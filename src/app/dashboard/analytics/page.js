// src/app/dashboard/analytics/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";

export const metadata = { title: "Analytics | Dashboard" };

export default async function AnalyticsPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Role check - SUPPLIER only
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isAdmin: true },
  });

  if (!user) redirect("/login");

  if (user.role !== "SUPPLIER" && !user.isAdmin) {
    redirect("/dashboard");
  }

  const userId = session.user.id;
  const { range = "30" } = await searchParams;
  const daysBack = parseInt(range) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // ====== Concurrent queries ======
  const [
    totalViews,
    totalInquiries,
    totalQuotes,
    topProducts,
    recentInquiries,
    allProducts,
  ] = await Promise.all([
    // Total views
    prisma.product.aggregate({
      where: { userId },
      _sum: { views: true },
    }),

    // Total number of inquiries
    prisma.productInquiry.count({
      where: { supplierId: userId },
    }),

    // Total number of quotes
    prisma.quote.count({
      where: { supplierId: userId },
    }),

    // Top 5 products
    prisma.product.findMany({
      where: { userId, isVisible: true },
      orderBy: { views: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        images: true,
        views: true,
        productNumber: true,
        slug: true,
        category: true,
      },
    }),

    // For the daily calculation
    prisma.productInquiry.findMany({
      where: {
        supplierId: userId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    }),

    // For the daily views chart
    prisma.product.findMany({
      where: { userId },
      select: { views: true, createdAt: true },
    }),
  ]);

  // ====== Daily views (based on products) ======
  // Because views are cumulative, we use a simple distribution
  const dailyBuckets = {};
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyBuckets[key] = 0;
  }

  // Simple distribution: we attribute each product's views to its creation date
  // (For better accuracy we would need a separate views table)
  const totalProductsViews = totalViews._sum.views || 0;
  const productsCount = allProducts.length || 1;
  const avgViewsPerProduct = Math.floor(totalProductsViews / productsCount);

  allProducts.forEach((p) => {
    const key = new Date(p.createdAt).toISOString().slice(0, 10);
    if (dailyBuckets[key] !== undefined) {
      dailyBuckets[key] += p.views;
    }
  });

  // If everything is 0 (all created before range), distribute lightly
  const hasAnyDaily = Object.values(dailyBuckets).some((v) => v > 0);
  if (!hasAnyDaily && totalProductsViews > 0) {
    Object.keys(dailyBuckets).forEach((k, i, arr) => {
      dailyBuckets[k] = Math.floor(
        totalProductsViews / arr.length
      );
    });
  }

  const dailyLabels = Object.keys(dailyBuckets).map((k) =>
    new Date(k).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );
  const dailyViews = Object.values(dailyBuckets);

  // ====== Daily inquiries ======
  const inquiryBuckets = {};
  Object.keys(dailyBuckets).forEach((k) => {
    inquiryBuckets[k] = 0;
  });

  recentInquiries.forEach((inq) => {
    const key = new Date(inq.createdAt).toISOString().slice(0, 10);
    if (inquiryBuckets[key] !== undefined) {
      inquiryBuckets[key] += 1;
    }
  });

  const dailyInquiries = Object.values(inquiryBuckets);

  // ====== Top countries ======
  const inquiriesWithCountry = await prisma.productInquiry.findMany({
    where: { supplierId: userId },
    select: {
      user: {
        select: { country: true, countryCode: true },
      },
    },
  });

  const countryMap = new Map();
  for (const inq of inquiriesWithCountry) {
    const country = inq.user?.country || "Unknown";
    const code = inq.user?.countryCode || null;
    if (!countryMap.has(country)) {
      countryMap.set(country, { country, code, count: 0 });
    }
    countryMap.get(country).count += 1;
  }

  const topCountries = Array.from(countryMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const maxCountry = topCountries[0]?.count || 1;

  // ====== Average views per product ======
  const avgViews =
    productsCount > 0 ? Math.floor(totalProductsViews / productsCount) : 0;

  // ====== Conversion rate ======
  const conversionRate =
    totalProductsViews > 0
      ? ((totalInquiries / totalProductsViews) * 100).toFixed(2)
      : 0;

  const ranges = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
  ];

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1600 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1
            className="fw-bold mb-0"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 24,
              color: "var(--d-dark, #0b1f18)",
            }}
          >
            <i
              className="fas fa-chart-line me-2"
              style={{ color: "var(--d-primary, #0f9e6e)" }}
            ></i>
            Analytics
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Track your business performance and insights
          </p>
        </div>

        {/* Range Selector */}
        <div className="d-flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <Link
              key={r.value}
              href={`/dashboard/analytics?range=${r.value}`}
              style={{
                padding: "8px 16px",
                borderRadius: 50,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                background:
                  range === r.value
                    ? "var(--d-primary, #0f9e6e)"
                    : "white",
                color:
                  range === r.value
                    ? "white"
                    : "var(--d-text, #334155)",
                border: `1px solid ${
                  range === r.value
                    ? "var(--d-primary, #0f9e6e)"
                    : "var(--d-border, #e8edf0)"
                }`,
              }}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="d-stats mb-4">
        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon indigo">
              <i className="fas fa-eye"></i>
            </div>
          </div>
          <div className="stat-value">
            {totalProductsViews.toLocaleString()}
          </div>
          <div className="stat-label">Total Views</div>
        </div>

        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon green">
              <i className="fas fa-envelope"></i>
            </div>
          </div>
          <div className="stat-value">
            {totalInquiries.toLocaleString()}
          </div>
          <div className="stat-label">Total Inquiries</div>
        </div>

        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon amber">
              <i className="fas fa-file-signature"></i>
            </div>
          </div>
          <div className="stat-value">{totalQuotes.toLocaleString()}</div>
          <div className="stat-label">Total Quotes Sent</div>
        </div>

        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon rose">
              <i className="fas fa-percentage"></i>
            </div>
          </div>
          <div className="stat-value">{conversionRate}%</div>
          <div className="stat-label">View → Inquiry Rate</div>
        </div>
      </div>

      {/* Chart */}
      <section className="d-card mb-4">
        <div className="d-card-head">
          <div>
            <div className="d-card-title">Performance Trend</div>
            <div className="d-card-sub">
              Views and inquiries over the selected period
            </div>
          </div>
        </div>
        {dailyViews.some((v) => v > 0) ||
        dailyInquiries.some((v) => v > 0) ? (
          <AnalyticsChart
            labels={dailyLabels}
            viewsData={dailyViews}
            inquiriesData={dailyInquiries}
          />
        ) : (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "var(--d-muted, #94a3b8)",
            }}
          >
            <i
              className="fas fa-chart-line"
              style={{
                fontSize: 40,
                opacity: 0.3,
                display: "block",
                marginBottom: 12,
              }}
            ></i>
            No data available for this period.
          </div>
        )}
      </section>

      {/* Top Products + Top Countries */}
      <section className="d-grid-2">
        {/* Top Products */}
        <div className="d-card">
          <div className="d-card-head">
            <div>
              <div className="d-card-title">Top Performing Products</div>
              <div className="d-card-sub">By total views</div>
            </div>
            <Link href="/dashboard/products" className="d-card-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {topProducts.length > 0 ? (
            <div>
              {topProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/products/${product.productNumber}/${product.slug}`}
                  target="_blank"
                  className="d-request-row"
                >
                  <div className="d-req-left">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background:
                          index === 0
                            ? "linear-gradient(135deg, #f5b544, #e08900)"
                            : index === 1
                              ? "linear-gradient(135deg, #94a3b8, #64748b)"
                              : index === 2
                                ? "linear-gradient(135deg, #d97706, #92400e)"
                                : "var(--d-bg, #f6f8f9)",
                        color:
                          index < 3
                            ? "white"
                            : "var(--d-muted-2, #64748b)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="d-req-title">{product.name}</div>
                      <div className="d-req-sub">
                        {product.category || "Uncategorized"}
                      </div>
                    </div>
                  </div>
                  <div className="d-req-right">
                    <div className="d-req-qty">
                      {product.views.toLocaleString()} views
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--d-muted, #94a3b8)",
                fontSize: 13,
              }}
            >
              No products yet.
            </div>
          )}
        </div>

        {/* Top Countries */}
        <div className="d-card">
          <div className="d-card-head">
            <div>
              <div className="d-card-title">Top Countries</div>
              <div className="d-card-sub">Buyers who contacted you</div>
            </div>
          </div>

          {topCountries.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topCountries.map((c) => {
                const percent = (c.count / maxCountry) * 100;
                return (
                  <div key={c.country}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--d-text, #334155)",
                        }}
                      >
                        {c.code ? (
                          <span
                            className={`fi fi-${c.code.toLowerCase()}`}
                            style={{
                              width: 18,
                              height: 14,
                              borderRadius: 3,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                          ></span>
                        ) : (
                          <i className="fas fa-globe" style={{ fontSize: 12 }}></i>
                        )}
                        {c.country}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "var(--d-dark, #0b1f18)",
                        }}
                      >
                        {c.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "var(--d-border-2, #f1f5f7)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percent}%`,
                          background:
                            "linear-gradient(90deg, #0f9e6e, #14b881)",
                          borderRadius: 3,
                          transition: "width 0.6s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--d-muted, #94a3b8)",
                fontSize: 13,
              }}
            >
              No inquiries yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}