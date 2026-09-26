// src/app/api/product-inquiries/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  canAddProduct,
  getUserActivePlan,
  incrementUsage,
} from "@/lib/planService";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notificationService";
import { getAccessControlSettings } from "@/lib/accessControlService";

// ====== POST: ثبت درخواست جدید و ایجاد پیام ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { productId, supplierId, message, quantity, requestedPrice } = body;

    if (!productId || !supplierId || !message) {
      return NextResponse.json(
        { message: "Product ID, Supplier ID, and message are required" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, userId: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    // ============================================================
    // ✅ گارد امنیتی Reveal (فقط اگر تنظیمات ادمین اجبار کرده باشد)
    // ============================================================
    if (product.userId !== userId) {
      // چک ادمین
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        const settings = await getAccessControlSettings();
        const consumeQuota =
          settings.product?.supplierInfo?.consumeQuotaOnReveal ?? true;

        // ✅ فقط اگر consumeQuotaOnReveal = true باشد، رکورد Reveal اجباری است
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
        // اگر consumeQuotaOnReveal = false بود، اجازه بده بدون رکورد Reveal
      }
    }

    // ============================================================
    // ثبت Inquiry
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

    // ✅ نوتیفیکیشن برای تأمین‌کننده
    const buyerName = session.user.name || session.user.email || "A buyer";
    createNotification({
      userId: supplierId,
      type: NOTIFICATION_TYPES.NEW_INQUIRY,
      title: "New Product Inquiry",
      body: `${buyerName} is interested in "${product.name}".`,
      link: `/dashboard/inquiries?tab=supplier`,
      metadata: { productId: product.id, inquiryId: inquiry.id },
    });

    // ایجاد پیام
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const productLink = `${baseUrl}/products/${productId}`;
    const messageContent = `📦 **Product:** ${product.name}\n🔗 ${productLink}\n\n📝 **Request:** ${message}`;

    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: supplierId,
        productId: productId,
        content: messageContent,
      },
    });

    // ✅ دیگر incrementUsage اینجا انجام نمی‌شود (سهمیه در مرحله Reveal مصرف شده)

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

// ====== GET: دریافت درخواست‌های کاربر ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "buyer"; // buyer یا supplier

    const where = {};
    if (role === "buyer") {
      where.userId = session.user.id;
    } else if (role === "supplier") {
      where.supplierId = session.user.id;
    }

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