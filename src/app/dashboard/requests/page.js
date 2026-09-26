// src/app/dashboard/requests/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RequestListItem from "@/components/dashboard/RequestListItem";

export const metadata = { title: "My Buying Requests | Dashboard" };

export default async function DashboardRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const requests = await prisma.buyingRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      subCategory: true,
      quantity: true,
      unit: true,
      isUrgent: true,
      isVisible: true,
      status: true,          // ✅ اضافه شد
      rejectionNote: true,   // ✅ اضافه شد
      deliveryCountry: true,
      createdAt: true,
      views: true,
      requestNumber: true,   // ✅ برای لینک
      slug: true,            // ✅ برای لینک
      _count: {
        select: {
          quotes: true,
        },
      },
    },
  });

  // آمار
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="container py-4">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="fw-bold mb-0">
            <i
              className="fas fa-shopping-cart me-2"
              style={{ color: "var(--primary)" }}
            ></i>
            My Buying Requests
          </h1>
          <p className="text-muted mb-0">Manage your buying requests</p>
        </div>
        <Link href="/requests/new" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>Post New Request
        </Link>
      </div>

      {/* آمار */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
        className="dash-stats-responsive"
      >
        <div className="card shadow-sm border-0 p-3">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--primary-light, #eaf7f1)",
                color: "var(--primary)",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              <i className="fas fa-list"></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.total}</div>
              <div style={{ fontSize: 11, color: "var(--gray)" }}>
                Total Requests
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 p-3">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#fff7e6",
                color: "#b45309",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {stats.pending}
              </div>
              <div style={{ fontSize: 11, color: "var(--gray)" }}>Pending</div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 p-3">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#ecfdf5",
                color: "#047857",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              <i className="fas fa-check-circle"></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {stats.approved}
              </div>
              <div style={{ fontSize: 11, color: "var(--gray)" }}>Approved</div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 p-3">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#fef2f2",
                color: "#b91c1c",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              <i className="fas fa-times-circle"></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {stats.rejected}
              </div>
              <div style={{ fontSize: 11, color: "var(--gray)" }}>Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* لیست */}
      {requests.length > 0 ? (
        <div
          className="requests-list"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {requests.map((request) => (
            <RequestListItem key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h3>No buying requests yet</h3>
          <p className="text-muted">
            Start posting buying requests to find the best suppliers.
          </p>
          <Link href="/requests/new" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>Post Your First Request
          </Link>
        </div>
      )}
    </div>
  );
}