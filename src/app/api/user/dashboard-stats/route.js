// src/app/api/user/dashboard-stats/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [
      unreadMessages,
      unseenInquiries,
    ] = await Promise.all([
      // پیام‌های خوانده‌نشده (دریافتی)
      prisma.message.count({
        where: { receiverId: userId, read: false },
      }),
      // درخواست‌های دیده‌نشده (به‌عنوان تأمین‌کننده)
      prisma.productInquiry.count({
        where: { supplierId: userId, read: false },
      }),
    ]);

    return NextResponse.json({
      unreadMessages,
      unseenInquiries,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  }
}