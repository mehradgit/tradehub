// src/lib/jobHandlers.js
// ============================================================
// Registry of scheduled jobs
//
// Every job is a "task" that is pre-written in code. The admin panel
// can change the schedule and whether it is active, but there is no
// way to create a "new task" from the panel — a key must be added
// here for a new job.
//
// To add a new job:
//   1. Add a handler here (name, description, defaultCron, run)
//   2. That is all — DEFAULT_JOBS at the bottom of this file is built
//      automatically and the first tick creates it in the database.
// ============================================================
import { prisma } from "@/lib/prisma";
import { processEmailQueue } from "@/lib/emailQueueService";
import { dispatchEvent } from "@/lib/eventService";

// ============================================================
// Closes stale resolved tickets.
// Shared between the scheduled job and the manual routes.
// ============================================================
export async function closeStaleTickets(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const ticketsToClose = await prisma.ticket.findMany({
    where: {
      status: "resolved",
      updatedAt: { lt: cutoffDate },
    },
    select: { id: true, ticketNumber: true },
  });

  if (ticketsToClose.length === 0) {
    return { closed: 0, tickets: [] };
  }

  const result = await prisma.ticket.updateMany({
    where: { id: { in: ticketsToClose.map((t) => t.id) } },
    data: { status: "closed", closedAt: new Date() },
  });

  return { closed: result.count, tickets: ticketsToClose };
}

// ============================================================
// Subscription expiry reminder — on the days with 7, 3 and 1 remaining
// ============================================================
async function findExpiringSubscriptions(daysLeft) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysLeft);

  const end = new Date(start.getTime());
  end.setHours(23, 59, 59, 999);

  return prisma.userSubscription.findMany({
    where: {
      status: "active",
      endDate: { gte: start, lte: end },
    },
    select: {
      id: true,
      endDate: true,
      userId: true,
      plan: { select: { name: true } },
    },
  });
}

// ============================================================
// Registry
// ============================================================
export const JOB_HANDLERS = {
  // ----------------------------------------------------------
  "process-email-queue": {
    name: "Process email queue",
    description:
      "Sends queued emails (EmailLog with status=queued). Should run every minute.",
    defaultCron: "* * * * *",
    run: async () => {
      const result = await processEmailQueue(30);
      return {
        ok: true,
        summary: `processed ${result.processed}, sent ${result.sent}, failed ${result.failed}`,
      };
    },
  },

  // ----------------------------------------------------------
  "auto-close-tickets": {
    name: "Auto-close stale tickets",
    description:
      "Closes tickets in 'resolved' state that had no activity for 7 days.",
    defaultCron: "30 3 * * *",
    run: async () => {
      const { closed, tickets } = await closeStaleTickets(7);

      // Notify the ticket owners through the central event pipeline
      for (const t of tickets) {
        const res = await dispatchEvent("ticket.auto_closed", {
          ticketId: t.id,
        });
        if (res?.error) {
          console.error("[auto-close-tickets] dispatch error:", res.error);
        }
      }

      return { ok: true, summary: `closed ${closed} ticket(s)` };
    },
  },

  // ----------------------------------------------------------
  "subscription-expiry-reminder": {
    name: "Subscription expiry reminder",
    description:
      "Sends a reminder 7, 3 and 1 day(s) before an active subscription expires.",
    defaultCron: "0 9 * * *",
    run: async () => {
      let total = 0;

      for (const daysLeft of [7, 3, 1]) {
        const subscriptions = await findExpiringSubscriptions(daysLeft);

        for (const sub of subscriptions) {
          // If the user has already renewed (has a reserved subscription),
          // the reminder is pointless and would only annoy them.
          const alreadyRenewed = await prisma.userSubscription.findFirst({
            where: { userId: sub.userId, status: "reserved" },
            select: { id: true },
          });
          if (alreadyRenewed) continue;

          const res = await dispatchEvent("subscription.expiring", {
            subscriptionId: sub.id,
            daysLeft,
          });
          if (res?.error) {
            console.error(
              "[subscription-expiry-reminder] dispatch error:",
              res.error
            );
          }
          total++;
        }
      }

      return { ok: true, summary: `sent ${total} reminder(s)` };
    },
  },
};

// ============================================================
// Run a job by its key
// ============================================================
export async function runJobHandler(handlerKey) {
  const handler = JOB_HANDLERS[handlerKey];

  if (!handler) {
    return {
      ok: false,
      error: `No handler registered for "${handlerKey}"`,
    };
  }

  try {
    const result = await handler.run();
    return {
      ok: result?.ok !== false,
      summary: result?.summary || "",
    };
  } catch (err) {
    console.error(`[job:${handlerKey}] failed:`, err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// Jobs that are created on startup
// ============================================================
export const DEFAULT_JOBS = Object.entries(JOB_HANDLERS).map(
  ([jobKey, def]) => ({
    jobKey,
    name: def.name,
    description: def.description,
    handlerKey: jobKey,
    cronExpression: def.defaultCron,
    isActive: true,
  })
);
