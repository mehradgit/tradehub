// src/app/admin/requests/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";

export const metadata = { title: "Buying Requests | Admin" };

export default async function AdminRequestsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    page: pageParam = 1,
    search = "",
    category = "",
    approval = "",
    status = "",
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (category) where.category = category;
  if (approval) where.status = approval;
  if (status === "urgent") where.isUrgent = true;
  if (status === "open") where.isUrgent = false;
  if (status === "visible") where.isVisible = true;
  if (status === "hidden") where.isVisible = false;

  const [requests, totalCount, categories, statusCounts] = await Promise.all([
    prisma.buyingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        subCategory: true,
        quantity: true,
        unit: true,
        deliveryCountry: true,
        isUrgent: true,
        isVisible: true,
        status: true,
        rejectionNote: true,
        views: true,
        createdAt: true,
        requestNumber: true,
        slug: true,
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            profileNumber: true,
            slug: true,
          },
        },
        _count: {
          select: { quotes: true },
        },
      },
    }),
    prisma.buyingRequest.count({ where }),
    prisma.buyingRequest.findMany({
      select: { category: true },
      distinct: ["category"],
    }),
    Promise.all([
      prisma.buyingRequest.count({ where: { status: "PENDING" } }),
      prisma.buyingRequest.count({ where: { status: "APPROVED" } }),
      prisma.buyingRequest.count({ where: { status: "REJECTED" } }),
    ]),
  ]);

  const [pendingCount, approvedCount, rejectedCount] = statusCounts;
  const totalPages = Math.ceil(totalCount / limit);

  const getStatusBadge = (req) => {
    if (req.status === "PENDING") {
      return { label: "Pending", icon: "fa-clock", bg: "#fff7e6", color: "#b45309", border: "#fde68a" };
    }
    if (req.status === "REJECTED") {
      return { label: "Rejected", icon: "fa-times-circle", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    }
    if (req.status === "APPROVED") {
      if (!req.isVisible) return { label: "Hidden", icon: "fa-eye-slash", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
      return { label: "Approved", icon: "fa-check-circle", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    }
    return { label: "Active", icon: "fa-check-circle", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  };

  return (
    <>
      <AdminPageHeader
        title="Buying Requests"
        subtitle={`${totalCount} requests on the platform`}
      />

      {/* Status Stats */}
      <div
        className="admin-kpis"
        style={{ marginBottom: 16, gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <Link href="/admin/requests?approval=PENDING" style={{ textDecoration: "none" }}>
          <div className="admin-kpi" style={{ minHeight: "auto", padding: 16, cursor: "pointer" }}>
            <div className="admin-kpi-icon orange-bg"><i className="fa-solid fa-clock"></i></div>
            <h4>Pending Review</h4>
            <strong>{pendingCount}</strong>
          </div>
        </Link>
        <Link href="/admin/requests?approval=APPROVED" style={{ textDecoration: "none" }}>
          <div className="admin-kpi" style={{ minHeight: "auto", padding: 16, cursor: "pointer" }}>
            <div className="admin-kpi-icon green-bg"><i className="fa-solid fa-check-circle"></i></div>
            <h4>Approved</h4>
            <strong>{approvedCount}</strong>
          </div>
        </Link>
        <Link href="/admin/requests?approval=REJECTED" style={{ textDecoration: "none" }}>
          <div className="admin-kpi" style={{ minHeight: "auto", padding: 16, cursor: "pointer" }}>
            <div className="admin-kpi-icon purple-bg"><i className="fa-solid fa-times-circle"></i></div>
            <h4>Rejected</h4>
            <strong>{rejectedCount}</strong>
          </div>
        </Link>
      </div>

      <AdminFilterBar
        searchPlaceholder="Search requests..."
        filters={[
          {
            name: "approval",
            placeholder: "All Approvals",
            options: [
              { value: "PENDING", label: "Pending Review" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ],
          },
          {
            name: "category",
            placeholder: "All Categories",
            options: categories.map((c) => ({
              value: c.category,
              label: c.category,
            })),
          },
          {
            name: "status",
            placeholder: "Status",
            options: [
              { value: "urgent", label: "Urgent" },
              { value: "open", label: "Open" },
            ],
          },
        ]}
      />

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Buyer</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Approval</th>
                <th>Priority</th>
                <th>Views</th>
                <th>Quotes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const badge = getStatusBadge(req);
                  return (
                    <tr key={req.id}>
                      <td>
                        <div>
                          <b>{req.title}</b>
                          <span style={{ display: "block", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                            #{req.requestNumber}
                          </span>
                        </div>
                      </td>
                      <td>
                        {req.user ? (
                          <Link
                            href={`/admin/users/${req.user.id}`}
                            style={{ color: "var(--green2)", fontWeight: 600 }}
                          >
                            {req.user.companyName || req.user.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{req.category}</td>
                      <td>
                        {req.quantity} {req.unit}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 11px",
                            borderRadius: 50,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: 10,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i className={`fas ${badge.icon}`} style={{ fontSize: 10 }}></i>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        {req.isUrgent ? (
                          <span className="admin-pill" style={{ background: "#fde8e5", color: "#e75e5e" }}>
                            Urgent
                          </span>
                        ) : (
                          <span className="admin-pill active">Open</span>
                        )}
                      </td>
                      <td>{req.views || 0}</td>
                      <td>{req._count.quotes}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Link
                            href={`/admin/requests/${req.id}`}
                            style={{
                              width: 28, height: 28,
                              borderRadius: 7,
                              background: "var(--bg)",
                              color: "var(--green2)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                            }}
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <Link
                            href={`/requests/${req.requestNumber}/${req.slug}`}
                            target="_blank"
                            style={{
                              width: 28, height: 28,
                              borderRadius: 7,
                              background: "var(--bg)",
                              color: "var(--muted)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                            }}
                            title="View Public Page"
                          >
                            <i className="fa-solid fa-external-link-alt"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination currentPage={page} totalPages={totalPages} />
      </div>
    </>
  );
}