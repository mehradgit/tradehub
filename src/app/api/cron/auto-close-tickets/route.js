// src/app/api/cron/auto-close-tickets/route.js
// ============================================================
// This route is manual. If you use the admin panel, you can
// change the system scheduler to /api/cron/tick and keep this
// one only for manual runs.
// ============================================================
import { NextResponse, after } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { dispatchEvent } from "@/lib/eventService";
import { closeStaleTickets } from "@/lib/jobHandlers";

export async function GET(request) {
  // ✅ fail-closed: without CRON_SECRET no request is authorized
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { closed, tickets } = await closeStaleTickets(7);

    if (tickets.length === 0) {
      return NextResponse.json({
        message: "No tickets to close",
        closed: 0,
      });
    }

    // ✅ Notify ticket owners through the central event route
    after(async () => {
      for (const t of tickets) {
        const res = await dispatchEvent("ticket.auto_closed", {
          ticketId: t.id,
        });
        if (res?.error) {
          console.error("[ticket.auto_closed] dispatch error:", res.error);
        }
      }
    });

    return NextResponse.json({
      message: `${closed} ticket(s) auto-closed`,
      closed,
      tickets: tickets.map((t) => t.ticketNumber),
    });
  } catch (error) {
    console.error("Auto-close error:", error);
    return NextResponse.json(
      { message: "Failed to auto-close tickets" },
      { status: 500 }
    );
  }
}
