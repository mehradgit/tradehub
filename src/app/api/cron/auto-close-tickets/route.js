// src/app/api/cron/auto-close-tickets/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse, after } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { dispatchEvent } from "@/lib/eventService";

// تیکت‌های resolved که این تعداد روز پاسخ نگرفته‌اند، بسته می‌شوند
const AUTO_CLOSE_DAYS = 7;

export async function GET(request) {
  // ✅ fail-closed: بدون CRON_SECRET هیچ درخواستی مجاز نیست
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUTO_CLOSE_DAYS);

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

    const result = await prisma.ticket.updateMany({
      where: { id: { in: ticketsToClose.map((t) => t.id) } },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    // ✅ اطلاع به صاحبان تیکت‌ها از مسیر مرکزی رویداد
    //    قبلاً این مسیر تیکت‌ها را کاملاً بی‌صدا می‌بست.
    after(async () => {
      for (const t of ticketsToClose) {
        const res = await dispatchEvent("ticket.auto_closed", {
          ticketId: t.id,
        });
        if (res?.error) {
          console.error("[ticket.auto_closed] dispatch error:", res.error);
        }
      }
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
