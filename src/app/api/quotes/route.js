// src/app/api/quotes/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, buyerId, quantity, offeredPrice, message } = body;

    if (!requestId || !buyerId || !message) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // بررسی وجود درخواست
    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id: requestId },
      select: { id: true, title: true, userId: true },
    });

    if (!buyingRequest) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    // ثبت پیشنهاد
    const quote = await prisma.quote.create({
      data: {
        requestId,
        supplierId: session.user.id,
        buyerId,
        quantity: quantity ? parseInt(quantity) : null,
        offeredPrice: offeredPrice ? parseFloat(offeredPrice) : null,
        message,
      },
    });

    // ارسال پیام به خریدار (سیستم پیام‌رسانی)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const requestLink = `${baseUrl}/requests/${requestId}`;
    const messageContent = `📦 **New Quote for Request:** ${buyingRequest.title}\n🔗 ${requestLink}\n\n📝 **Message:** ${message}`;

    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: buyerId,
        requestId: requestId,
        content: messageContent,
      },
    });

    return NextResponse.json({ message: "Quote sent successfully", quote }, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ message: "Failed to send quote" }, { status: 500 });
  }
}