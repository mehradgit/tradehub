// src/app/api/product-inquiries/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { dispatchEvent } from "@/lib/eventService";
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

    // ✅ تأمین‌کننده از خودِ محصول استخراج می‌شود، نه از بدنه درخواست.
    //    قبلاً هر کاربری می‌توانست supplierId دلخواه بفرستد و
    //    نوتیفیکیشن/پیام برای شخص ثالث بسازد.
    const supplierId = product.userId;

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

    // ✅ ایجاد پیام چت (خلاصه استعلام برای مکالمه خریدار/تأمین‌کننده)
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

    // ✅ نوتیفیکیشن + Web Push + ایمیل، همه از مسیر مرکزی رویداد.
    //    after() تضمین می‌کند کار پس از ارسال پاسخ اجرا شود
    //    (نه fire-and-forget که ممکن است نیمه‌کاره بماند).
    after(async () => {
      const result = await dispatchEvent("inquiry.created", {
        inquiryId: inquiry.id,
      });
      if (result?.error) {
        console.error("[inquiry.created] dispatch error:", result.error);
      }
    });

    // توجه: سهمیه در مرحله «Reveal» مصرف می‌شود، نه اینجا.

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

    // ✅ نقش فقط buyer یا supplier می‌تواند باشد.
    //    قبلاً هر مقدار دیگری where را خالی می‌گذاشت و
    //    همه‌ی استعلام‌های سیستم (همراه با ایمیل خریدار) برگردانده می‌شد.
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