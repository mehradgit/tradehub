// src/app/admin/analytics/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import GrowthChart from "@/components/admin/GrowthChart";

export const metadata = { title: "Analytics | Admin" };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  // Compute the key statistics
  const [
    userCount,
    supplierCount,
    productCount,
    requestCount,
    inquiryCount,
    quoteCount,
    subscriptionCount,
    activeSubscriptions,
    topSuppliers,
    categoryStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.product.count({ where: { isVisible: true } }),
    prisma.buyingRequest.count({ where: { isVisible: true } }),
    prisma.productInquiry.count(),
    prisma.quote.count(),
    prisma.userSubscription.count(),
    prisma.userSubscription.count({ where: { status: "active" } }),
    prisma.user.findMany({
      where: { role: "SUPPLIER" },
      take: 10,
      orderBy: {
        products: { _count: "desc" },
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        country: true,
        _count: {
          select: {
            products: true,
            productInquiriesAsSupplier: true,
          },
        },
      },
    }),
    prisma.product.groupBy({
      by: ["category"],
      _count: true,
      orderBy: { _count: { category: "desc" } },
      take: 10,
    }),
  ]);

  const stats = [
    { label: "Total Users", value: userCount, icon: "fa-users", cls: "green-bg" },
    { label: "Suppliers", value: supplierCount, icon: "fa-truck", cls: "orange-bg" },
    { label: "Products", value: productCount, icon: "fa-box", cls: "blue-bg" },
    { label: "Requests", value: requestCount, icon: "fa-shopping-cart", cls: "purple-bg" },
    { label: "Inquiries", value: inquiryCount, icon: "fa-envelope", cls: "green-bg" },
    { label: "Quotes", value: quoteCount, icon: "fa-file-signature", cls: "orange-bg" },
    { label: "Subscriptions", value: subscriptionCount, icon: "fa-crown", cls: "blue-bg" },
    { label: "Active Subs", value: activeSubscriptions, icon: "fa-check-circle", cls: "purple-bg" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        subtitle="Platform metrics and trends"
      />

      {/* Stats Grid */}
      <div className="admin-kpis" style={{ marginBottom: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
        {stats.map((stat) => (
          <div className="admin-kpi" key={stat.label} style={{ minHeight: "auto", padding: "16px" }}>
            <div className={`admin-kpi-icon ${stat.cls}`}>
              <i className={`fa-solid ${stat.icon}`}></i>
            </div>
            <h4>{stat.label}</h4>
            <strong>{stat.value.toLocaleString()}</strong>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card-head">
          <div>
            <div className="admin-title">Platform Growth</div>
            <div className="admin-subtitle">Users, products and inquiries over 6 months</div>
          </div>
        </div>
        <GrowthChart />
      </div>

      {/* Top Suppliers + Categories */}
      <div className="admin-content-top">
        {/* Top Suppliers */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Top Suppliers</div>
              <div className="admin-subtitle">By number of products</div>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Country</th>
                  <th>Products</th>
                  <th>Inquiries</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliers.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <div className="admin-person">
                        <div className="avatar-letter" style={{ background: i < 3 ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : undefined }}>
                          {(s.companyName || s.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <b>{s.companyName || s.name}</b>
                      </div>
                    </td>
                    <td>{s.country || "—"}</td>
                    <td><b>{s._count.products}</b></td>
                    <td>{s._count.productInquiriesAsSupplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Category Distribution</div>
              <div className="admin-subtitle">Products by category</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryStats.map((cat, i) => {
              const max = categoryStats[0]._count;
              const percent = (cat._count / max) * 100;
              return (
                <div key={cat.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{cat.category}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green2)" }}>
                      {cat._count}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${percent}%`,
                        background: "linear-gradient(90deg, var(--green2), #14a375)",
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
    </>
  );
}