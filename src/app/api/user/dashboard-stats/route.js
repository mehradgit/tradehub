// src/app/api/user/dashboard-stats/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [unreadMessages, unseenInquiries, openTickets, unreadNotifications] =
      await Promise.all([
        prisma.message.count({
          where: { receiverId: userId, read: false },
        }),
        prisma.productInquiry.count({
          where: { supplierId: userId, read: false },
        }),
        prisma.ticket.count({
          where: {
            userId,
            status: { in: ["open", "in_progress", "waiting_user", "resolved"] },
            unreadByUser: true,
          },
        }),
        prisma.notification.count({
          where: { userId, read: false },
        }),
      ]);

    return NextResponse.json({
      unreadMessages,
      unseenInquiries,
      openTickets,
      unreadNotifications,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}