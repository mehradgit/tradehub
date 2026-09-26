// src/app/api/cron/auto-close-tickets/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// این API را می‌توانید از cron job صدا بزنید
// مثال: curl -H "x-cron-secret: your-secret" https://yoursite.com/api/cron/auto-close-tickets

const AUTO_CLOSE_DAYS = 7;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  try {
    // بررسی امنیت (اختیاری)
    if (CRON_SECRET) {
      const { searchParams } = new URL(request.url);
      const secret =
        searchParams.get("secret") ||
        request.headers.get("x-cron-secret");

      if (secret !== CRON_SECRET) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // تاریخ X روز پیش
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUTO_CLOSE_DAYS);

    // تیکت‌های resolved که در X روز اخیر پاسخ نداده‌اند
    const ticketsToClose = await prisma.ticket.findMany({
      where: {
        status: "resolved",
        updatedAt: { lt: cutoffDate },
      },
      select: { id: true, ticketNumber: true },
    });

    if (ticketsToClose.length === 0) {
      return NextResponse.json({
        message: "No tickets to close",
        closed: 0,
      });
    }

    // بستن همه
    const result = await prisma.ticket.updateMany({
      where: {
        id: { in: ticketsToClose.map((t) => t.id) },
      },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `${result.count} ticket(s) auto-closed`,
      closed: result.count,
      tickets: ticketsToClose.map((t) => t.ticketNumber),
    });
  } catch (error) {
    console.error("Auto-close error:", error);
    return NextResponse.json(
      { message: "Failed to auto-close tickets" },
      { status: 500 }
    );
  }
}