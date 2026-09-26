// src/app/api/quotes/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notificationService";
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { requestId, buyerId, quantity, offeredPrice, message } = body;

    if (!requestId || !buyerId || !message) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // بررسی وجود درخواست
    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id: requestId },
      select: { id: true, title: true, userId: true },
    });

    if (!buyingRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    if (buyingRequest.userId === userId) {
      return NextResponse.json(
        { message: "You cannot quote your own request" },
        { status: 400 },
      );
    }

    // ✅ بررسی RevealedBuyerInfo (سهمیه در مرحله Reveal مصرف شده)
    const revealed = await prisma.revealedBuyerInfo.findUnique({
      where: {
        userId_requestId: { userId, requestId },
      },
    });

    if (!revealed) {
      // ادمین مجاز است (بدون نیاز به Reveal)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return NextResponse.json(
          {
            message: "Please reveal buyer info first",
            reason: "reveal_required",
          },
          { status: 403 },
        );
      }
    }

    // ثبت Quote (بدون مصرف سهمیه)
    const quote = await prisma.quote.create({
      data: {
        requestId,
        supplierId: userId,
        buyerId,
        quantity: quantity ? parseInt(quantity) : null,
        offeredPrice: offeredPrice ? parseFloat(offeredPrice) : null,
        message,
      },
    });
    // ✅ نوتیفیکیشن برای خریدار
    const supplierName =
      session.user.name || session.user.email || "A supplier";
    createNotification({
      userId: buyerId,
      type: NOTIFICATION_TYPES.NEW_QUOTE,
      title: `New quote for "${buyingRequest.title}"`,
      body: `${supplierName} submitted a quote of ${
        offeredPrice ? `$${offeredPrice}` : "an offer"
      }.`,
      link: `/dashboard/requests`,
      metadata: {
        requestId: buyingRequest.id,
        quoteId: quote.id,
      },
    });
    // ارسال پیام به خریدار
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const requestLink = `${baseUrl}/requests/${buyingRequest.id}`;
    const messageContent = `📦 **New Quote for Request:** ${buyingRequest.title}\n🔗 ${requestLink}\n\n📝 **Message:** ${message}`;

    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: buyerId,
        requestId: requestId,
        content: messageContent,
      },
    });

    return NextResponse.json(
      { message: "Quote sent successfully", quote },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { message: "Failed to send quote", error: error.message },
      { status: 500 },
    );
  }
}
