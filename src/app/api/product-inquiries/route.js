// src/app/api/product-inquiries/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { dispatchEvent } from "@/lib/eventService";
import { getAccessControlSettings } from "@/lib/accessControlService";

// ====== POST: create a new inquiry and its chat message ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { productId, message, quantity, requestedPrice } = body;

    if (!productId || !message) {
      return NextResponse.json(
        { message: "Product ID and message are required" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        userId: true,
        productNumber: true,
        slug: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    // ✅ The supplier is derived from the product itself, not from the request body.
    //    Previously any user could send an arbitrary supplierId and
    //    create a notification/message for a third party.
    const supplierId = product.userId;

    // ============================================================
    // ✅ Reveal security guard (only when the admin settings enforce it)
    // ============================================================
    if (product.userId !== userId) {
      // Admin check
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        const settings = await getAccessControlSettings();
        const consumeQuota =
          settings.product?.supplierInfo?.consumeQuotaOnReveal ?? true;

        // ✅ A Reveal record is only required when consumeQuotaOnReveal = true
        if (consumeQuota) {
          const revealed = await prisma.revealedSupplierInfo.findUnique({
            where: { userId_productId: { userId, productId } },
          });

          if (!revealed) {
            return NextResponse.json(
              {
                message: "Please reveal supplier info first",
                reason: "reveal_required",
              },
              { status: 403 },
            );
          }
        }
        // If consumeQuotaOnReveal = false, allow it without a Reveal record
      }
    }

    // ============================================================
    // Save the Inquiry
    // ============================================================
    const inquiry = await prisma.productInquiry.create({
      data: {
        productId,
        userId,
        supplierId,
        message,
        quantity: quantity || null,
        requestedPrice: requestedPrice || null,
        status: "pending",
      },
    });

    // ✅ Create the chat message (a summary of the inquiry for the buyer/supplier conversation)
    const baseUrl = (
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");
    const productLink = `${baseUrl}/products/${product.productNumber}/${product.slug}`;
    const messageContent = `📦 **Product:** ${product.name}\n🔗 ${productLink}\n\n📝 **Request:** ${message}`;

    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: supplierId,
        productId: product.id,
        content: messageContent,
      },
    });

    // ✅ Notification + Web Push + email, all through the central event pipeline.
    //    after() guarantees the work runs after the response is sent
    //    (not a fire-and-forget call that might be left half-done).
    after(async () => {
      const result = await dispatchEvent("inquiry.created", {
        inquiryId: inquiry.id,
      });
      if (result?.error) {
        console.error("[inquiry.created] dispatch error:", result.error);
      }
    });

    // Note: the quota is consumed at the "Reveal" step, not here.

    return NextResponse.json(
      { message: "Request sent successfully", inquiry },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { message: "Failed to send request" },
      { status: 500 },
    );
  }
}

// ====== GET: fetch the user's inquiries ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "buyer"; // buyer or supplier

    // ✅ The role can only be buyer or supplier.
    //    Previously any other value left `where` empty and
    //    returned every inquiry in the system (including the buyer's email).
    if (role !== "buyer" && role !== "supplier") {
      return NextResponse.json(
        { message: "Invalid role. Use 'buyer' or 'supplier'." },
        { status: 400 },
      );
    }

    const where =
      role === "buyer"
        ? { userId: session.user.id }
        : { supplierId: session.user.id };

    const inquiries = await prisma.productInquiry.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            unit: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { message: "Failed to fetch inquiries" },
      { status: 500 },
    );
  }
}