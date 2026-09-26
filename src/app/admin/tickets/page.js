// src/app/admin/tickets/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTicketListItem from "@/components/admin/AdminTicketListItem";
import AdminTicketFilters from "@/components/admin/AdminTicketFilters";

export const metadata = { title: "Support Tickets | Admin" };

export default async function AdminTicketsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    status = "",
    priority = "",
    category = "",
    search = "",
  } = await searchParams;

  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (search) {
    const num = parseInt(search);
    where.OR = [
      { subject: { contains: search } },
      ...(isNaN(num) ? [] : [{ ticketNumber: num }]),
    ];
  }

  const [tickets, counts] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            image: true,
          },
        },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    }),
    Promise.all([
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.ticket.count({ where: { status: "in_progress" } }),
      prisma.ticket.count({ where: { status: "resolved" } }),
      prisma.ticket.count({ where: { status: "closed" } }),
      prisma.ticket.count({ where: { unreadByAdmin: true } }),
    ]),
  ]);

  const [openCount, inProgressCount, resolvedCount, closedCount, unreadCount] =
    counts;

  return (
    <>
      <AdminPageHeader
        title="Support Tickets"
        subtitle={`${openCount + inProgressCount} active · ${unreadCount} unread`}
      />

      {/* Stats */}
      <div
        className="admin-kpis"
        style={{
          marginBottom: 16,
          gridTemplateColumns: "repeat(5, 1fr)",
        }}
      >
        <StatCard
          label="Open"
          value={openCount}
          icon="fa-envelope-open"
          cls="blue-bg"
          href="/admin/tickets?status=open"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon="fa-spinner"
          cls="orange-bg"
          href="/admin/tickets?status=in_progress"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon="fa-check-circle"
          cls="green-bg"
          href="/admin/tickets?status=resolved"
        />
        <StatCard
          label="Closed"
          value={closedCount}
          icon="fa-archive"
          cls="purple-bg"
          href="/admin/tickets?status=closed"
        />
        <StatCard
          label="Unread"
          value={unreadCount}
          icon="fa-bell"
          cls="purple-bg"
          href="/admin/tickets"
          highlight
        />
      </div>

      {/* Filters (Client Component) */}
      <AdminTicketFilters />

      {/* List */}
      {tickets.length === 0 ? (
        <div
          className="admin-card"
          style={{ padding: 60, textAlign: "center" }}
        >
          <i
            className="fa-solid fa-inbox"
            style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}
          ></i>
          <p style={{ color: "#82918b", fontSize: 13 }}>
            No tickets found.
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {tickets.map((ticket) => (
            <AdminTicketListItem key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      <style>{`
        .admin-ticket-item:hover {
          box-shadow: 0 8px 24px rgba(15, 45, 35, 0.08);
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
}

function StatCard({ label, value, icon, cls, href, highlight }) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="admin-kpi"
        style={{
          minHeight: "auto",
          padding: 16,
          cursor: "pointer",
          border: highlight && value > 0 ? "1px solid #fbbf24" : undefined,
          background: highlight && value > 0 ? "#fffbeb" : undefined,
        }}
      >
        <div className={`admin-kpi-icon ${cls}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <h4>{label}</h4>
        <strong>{value}</strong>
      </div>
    </Link>
  );
}