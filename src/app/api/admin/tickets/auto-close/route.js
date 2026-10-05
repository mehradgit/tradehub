// src/app/api/admin/tickets/auto-close/route.js
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { dispatchEvent } from "@/lib/eventService";
import { closeStaleTickets } from "@/lib/jobHandlers";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Shared logic with the scheduled job - a single source of truth, not two copies
    const { closed, tickets } = await closeStaleTickets(7);

    if (tickets.length === 0) {
      return NextResponse.json({
        message: "No tickets older than 7 days to close",
        closed: 0,
      });
    }

    // ✅ Notify ticket owners through the central event pipeline
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
      message: `${closed} ticket(s) closed`,
      closed,
      tickets: tickets.map((t) => t.ticketNumber),
    });
  } catch (error) {
    console.error("Auto-close error:", error);
    return NextResponse.json(
      { message: "Failed to close tickets" },
      { status: 500 }
    );
  }
}
