// src/app/api/admin/tickets/auto-close/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notificationService";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    // ✅ userId اضافه شد
    const ticketsToClose = await prisma.ticket.findMany({
      where: {
        status: "resolved",
        updatedAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        ticketNumber: true, // ✅ برای نمایش در نوتیفیکیشن
        userId: true, // ✅ برای ارسال نوتیفیکیشن
      },
    });

    if (ticketsToClose.length === 0) {
      return NextResponse.json({
        message: "No tickets older than 7 days to close",
        closed: 0,
      });
    }

    const result = await prisma.ticket.updateMany({
      where: { id: { in: ticketsToClose.map((t) => t.id) } },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    // ✅ نوتیفیکیشن برای صاحبان تیکت‌ها
    for (const t of ticketsToClose) {
      createNotification({
        userId: t.userId,
        type: NOTIFICATION_TYPES.TICKET_AUTO_CLOSED,
        title: `Ticket #${t.ticketNumber} closed`,
        body: "This ticket was automatically closed after 7 days of inactivity. Reopen it if you still need help.",
        link: `/dashboard/support/${t.ticketNumber}`,
        metadata: { ticketId: t.id, ticketNumber: t.ticketNumber },
      });
    }

    return NextResponse.json({
      message: `${result.count} ticket(s) closed`,
      closed: result.count,
    });
  } catch (error) {
    console.error("Auto-close error:", error);
    return NextResponse.json(
      { message: "Failed to close tickets" },
      { status: 500 }
    );
  }
}