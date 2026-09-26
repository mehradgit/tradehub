// src/app/api/user/notifications/unread-count/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Unread count error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}