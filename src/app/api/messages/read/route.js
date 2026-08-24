// src/app/api/messages/read/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { senderId } = await request.json();

    if (!senderId) {
      return NextResponse.json({ message: "senderId is required" }, { status: 400 });
    }

    // علامت‌گذاری تمام پیام‌های دریافتی از فرستنده به‌عنوان خوانده‌شده
    await prisma.message.updateMany({
      where: {
        receiverId: session.user.id,
        senderId: senderId,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ message: "Failed to mark messages as read" }, { status: 500 });
  }
}