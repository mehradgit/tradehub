// src/app/dashboard/support/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SupportClient from "@/components/support/SupportClient";

export const metadata = { title: "Support | Dashboard" };

export default async function SupportPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  // ===== Counts (کل) =====
  const [
    totalCount,
    openCount,
    inProgressCount,
    waitingCount,
    resolvedCount,
    closedCount,
    unreadCount,
  ] = await Promise.all([
    prisma.ticket.count({ where: { userId } }),
    prisma.ticket.count({ where: { userId, status: "open" } }),
    prisma.ticket.count({ where: { userId, status: "in_progress" } }),
    prisma.ticket.count({ where: { userId, status: "waiting_user" } }),
    prisma.ticket.count({ where: { userId, status: "resolved" } }),
    prisma.ticket.count({ where: { userId, status: "closed" } }),
    prisma.ticket.count({ where: { userId, unreadByUser: true } }),
  ]);

  // ===== Tickets =====
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  // ===== Serialize =====
  const serialized = tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    lastReplyAt: t.lastReplyAt ? t.lastReplyAt.toISOString() : null,
    unreadByUser: t.unreadByUser,
    _count: t._count,
    assignedTo: t.assignedTo,
  }));

  const counts = {
    total: totalCount,
    open: openCount + inProgressCount + waitingCount, // همه "فعال"
    openOnly: openCount,
    inProgress: inProgressCount,
    waiting: waitingCount,
    resolved: resolvedCount,
    closed: closedCount,
    unread: unreadCount,
  };

  return <SupportClient tickets={serialized} counts={counts} />;
}