// src/app/dashboard/support/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TicketListItem from "@/components/support/TicketListItem";

export const metadata = { title: "Support | Dashboard" };

export default async function SupportPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { status = "all", search = "" } = await searchParams;

  const where = { userId: session.user.id };
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { ticketNumber: parseInt(search) || -1 },
    ];
  }

  const [tickets, counts] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    Promise.all([
      prisma.ticket.count({ where: { userId: session.user.id } }),
      prisma.ticket.count({
        where: {
          userId: session.user.id,
          status: { in: ["open", "in_progress", "waiting_user"] },
        },
      }),
      prisma.ticket.count({
        where: { userId: session.user.id, status: "resolved" },
      }),
      prisma.ticket.count({
        where: { userId: session.user.id, status: "closed" },
      }),
    ]),
  ]);

  const [total, openCount, resolvedCount, closedCount] = counts;

  const filters = [
    { value: "all", label: "All", count: total },
    { value: "open", label: "Open", count: openCount },
    { value: "resolved", label: "Resolved", count: resolvedCount },
    { value: "closed", label: "Closed", count: closedCount },
  ];

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="fw-bold mb-0">
            <i
              className="fas fa-headset me-2"
              style={{ color: "var(--primary)" }}
            ></i>
            Support Tickets
          </h1>
          <p className="text-muted mb-0">
            Get help from our support team
          </p>
        </div>
        <Link href="/dashboard/support/new" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>New Ticket
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/support${f.value === "all" ? "" : `?status=${f.value}`}`}
            className={`btn btn-sm ${
              status === f.value ? "btn-primary" : "btn-outline-secondary"
            }`}
            style={{ borderRadius: 50, padding: "6px 16px", fontSize: 13 }}
          >
            {f.label} ({f.count})
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-4" action="/dashboard/support">
        {status !== "all" && (
          <input type="hidden" name="status" value={status} />
        )}
        <div className="filter-bar">
          <div className="search-box" style={{ maxWidth: 500 }}>
            <input
              type="text"
              name="search"
              placeholder="Search by subject or ticket number..."
              defaultValue={search}
            />
            <button type="submit" className="btn btn-primary search-btn">
              <i className="fas fa-search"></i> Search
            </button>
          </div>
        </div>
      </form>

      {/* List */}
      {tickets.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {tickets.map((ticket) => (
            <TicketListItem key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-headset fa-3x text-muted mb-3"></i>
          <h3>No tickets yet</h3>
          <p className="text-muted">
            {search
              ? "No tickets match your search."
              : "You haven't created any support tickets yet."}
          </p>
          <Link href="/dashboard/support/new" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>Create Your First Ticket
          </Link>
        </div>
      )}
    </div>
  );
}