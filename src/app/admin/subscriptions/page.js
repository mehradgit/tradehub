// src/app/admin/subscriptions/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import SubscriptionsTable from "@/components/admin/SubscriptionsTable";

export const metadata = { title: "Subscriptions | Admin" };

export default async function AdminSubscriptionsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    page: pageParam = 1,
    search = "",
    status = "",
    plan = "",
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (plan) where.plan = { name: plan };
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { companyName: { contains: search } },
      ],
    };
  }

  const [subscriptions, totalCount, stats, plans] = await Promise.all([
    prisma.userSubscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            country: true,
            countryCode: true,
          },
        },
        plan: { select: { id: true, name: true } },
      },
    }),
    prisma.userSubscription.count({ where }),
    Promise.all([
      prisma.userSubscription.count({ where: { status: "active" } }),
      prisma.userSubscription.count({ where: { status: "reserved" } }),
      prisma.userSubscription.count({ where: { status: "ended" } }),
      prisma.userSubscription.count({ where: { status: "cancelled" } }),
    ]),
    prisma.plan.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const [activeCount, reservedCount, endedCount, cancelledCount] = stats;
  const totalPages = Math.ceil(totalCount / limit);

  const serialized = subscriptions.map((s) => ({
    id: s.id,
    status: s.status,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
    user: s.user,
    plan: s.plan,
  }));

  return (
    <>
      <AdminPageHeader
        title="Subscriptions Management"
        subtitle={`${totalCount} total subscriptions`}
      />

      {/* Stats Grid */}
      <div className="admin-kpis" style={{ marginBottom: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon green-bg"><i className="fa-solid fa-check-circle"></i></div>
          <h4>Active</h4>
          <strong>{activeCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon orange-bg"><i className="fa-solid fa-clock"></i></div>
          <h4>Reserved</h4>
          <strong>{reservedCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon blue-bg"><i className="fa-solid fa-flag-checkered"></i></div>
          <h4>Ended</h4>
          <strong>{endedCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon purple-bg"><i className="fa-solid fa-ban"></i></div>
          <h4>Cancelled</h4>
          <strong>{cancelledCount}</strong>
        </div>
      </div>

      <AdminFilterBar
        searchPlaceholder="Search by user, email, company..."
        filters={[
          {
            name: "status",
            placeholder: "All Statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "reserved", label: "Reserved" },
              { value: "ended", label: "Ended" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
          {
            name: "plan",
            placeholder: "All Plans",
            options: plans.map((p) => ({ value: p.name, label: p.name })),
          },
        ]}
      />

      <SubscriptionsTable subscriptions={serialized} />

      <AdminPagination currentPage={page} totalPages={totalPages} />
    </>
  );
}