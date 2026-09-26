// src/app/admin/reports/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export const metadata = { title: "Reports | Admin" };

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    usersThisMonth,
    productsThisMonth,
    requestsThisMonth,
    inquiriesThisMonth,
    usersThisYear,
    productsThisYear,
    topCountries,
    planDistribution,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.buyingRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.productInquiry.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfYear } } }),
    prisma.product.count({ where: { createdAt: { gte: startOfYear } } }),
    prisma.user.groupBy({
      by: ["country"],
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 10,
      where: { country: { not: null } },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: true,
      orderBy: { _count: { plan: "desc" } },
    }),
  ]);

  const monthlyStats = [
    { label: "New Users", value: usersThisMonth, icon: "fa-users", cls: "green-bg" },
    { label: "New Products", value: productsThisMonth, icon: "fa-box", cls: "blue-bg" },
    { label: "New Requests", value: requestsThisMonth, icon: "fa-shopping-cart", cls: "orange-bg" },
    { label: "New Inquiries", value: inquiriesThisMonth, icon: "fa-envelope", cls: "purple-bg" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Reports"
        subtitle="Monthly and yearly platform statistics"
      />

      {/* Monthly Stats */}
      <h3 style={{ font: "800 14px Manrope", marginBottom: 10, color: "var(--dark)" }}>
        This Month
      </h3>
      <div className="admin-kpis" style={{ marginBottom: 24, gridTemplateColumns: "repeat(4, 1fr)" }}>
        {monthlyStats.map((stat) => (
          <div className="admin-kpi" key={stat.label} style={{ minHeight: "auto", padding: 16 }}>
            <div className={`admin-kpi-icon ${stat.cls}`}>
              <i className={`fa-solid ${stat.icon}`}></i>
            </div>
            <h4>{stat.label}</h4>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      {/* Yearly Stats */}
      <h3 style={{ font: "800 14px Manrope", marginBottom: 10, color: "var(--dark)" }}>
        This Year
      </h3>
      <div className="admin-kpis" style={{ marginBottom: 24, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon green-bg"><i className="fa-solid fa-users"></i></div>
          <h4>New Users</h4>
          <strong>{usersThisYear}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon blue-bg"><i className="fa-solid fa-box"></i></div>
          <h4>New Products</h4>
          <strong>{productsThisYear}</strong>
        </div>
      </div>

      {/* Charts Row */}
      <div className="admin-content-top">
        {/* Top Countries */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Top Countries</div>
              <div className="admin-subtitle">Users by country</div>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Country</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                {topCountries.map((c, i) => (
                  <tr key={c.country}>
                    <td>
                      <span style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: i < 3 ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "var(--bg)",
                        color: i < 3 ? "white" : "var(--muted)",
                        display: "grid", placeItems: "center",
                        fontSize: 11, fontWeight: 800,
                      }}>
                        {i + 1}
                      </span>
                    </td>
                    <td><b>{c.country}</b></td>
                    <td>{c._count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Plan Distribution</div>
              <div className="admin-subtitle">Users by subscription plan</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
            {planDistribution.map((p) => {
              const total = planDistribution.reduce((sum, x) => sum + x._count, 0);
              const percent = ((p._count / total) * 100).toFixed(1);
              const colors = {
                FREE: "#b6c0bd",
                BRONZE: "#c8891b",
                SILVER: "#8b9b95",
                GOLD: "#fbbf24",
              };
              return (
                <div key={p.plan}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{p.plan}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>
                      {p._count} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({percent}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${percent}%`,
                        background: colors[p.plan] || "var(--green2)",
                        borderRadius: 4,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-head">
          <div>
            <div className="admin-title">Export Reports</div>
            <div className="admin-subtitle">Download platform data as CSV or Excel</div>
          </div>
        </div>
        <div className="admin-quick">
          <button className="admin-quick-action" style={{
            border: "1px solid var(--line)",
            borderRadius: 10, padding: 10,
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", cursor: "pointer", textAlign: "left",
          }}>
            <div className="admin-quick-icon green-bg"><i className="fa-solid fa-users"></i></div>
            <div>
              <b style={{ fontSize: 11 }}>Users Report</b>
              <span style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Download CSV</span>
            </div>
          </button>
          <button className="admin-quick-action" style={{
            border: "1px solid var(--line)",
            borderRadius: 10, padding: 10,
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", cursor: "pointer", textAlign: "left",
          }}>
            <div className="admin-quick-icon blue-bg"><i className="fa-solid fa-box"></i></div>
            <div>
              <b style={{ fontSize: 11 }}>Products Report</b>
              <span style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Download CSV</span>
            </div>
          </button>
          <button className="admin-quick-action" style={{
            border: "1px solid var(--line)",
            borderRadius: 10, padding: 10,
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", cursor: "pointer", textAlign: "left",
          }}>
            <div className="admin-quick-icon orange-bg"><i className="fa-solid fa-shopping-cart"></i></div>
            <div>
              <b style={{ fontSize: 11 }}>Requests Report</b>
              <span style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Download CSV</span>
            </div>
          </button>
          <button className="admin-quick-action" style={{
            border: "1px solid var(--line)",
            borderRadius: 10, padding: 10,
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", cursor: "pointer", textAlign: "left",
          }}>
            <div className="admin-quick-icon purple-bg"><i className="fa-solid fa-file-excel"></i></div>
            <div>
              <b style={{ fontSize: 11 }}>Full Report</b>
              <span style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Download Excel</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}