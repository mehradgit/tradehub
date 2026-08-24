// src/app/api/messages/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: دریافت پیام‌ها یا لیست مکالمات ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // اگر وجود داشته باشد، پیام‌های بین دو کاربر را برمی‌گرداند

    if (userId) {
      // دریافت پیام‌های بین کاربر فعلی و کاربر دیگر
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: userId },
            { senderId: userId, receiverId: session.user.id },
          ],
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ messages });
    }

    // اگر userId وجود نداشت، لیست مکالمات کاربر فعلی را برمی‌گرداند
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      distinct: ["senderId", "receiverId"],
    });

    // گروه‌بندی بر اساس کاربر مقابل
    const uniqueUsers = new Map();
    for (const msg of conversations) {
      const otherUserId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === session.user.id ? msg.receiver : msg.sender;
      if (!uniqueUsers.has(otherUserId)) {
        uniqueUsers.set(otherUserId, {
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
        });
      }
    }

    const result = Array.from(uniqueUsers.values());
    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// ====== POST: ارسال پیام جدید ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, productId } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { message: "Receiver ID and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        productId: productId || null,
      },
    });

    return NextResponse.json(
      { message: "Message sent successfully", data: message },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}