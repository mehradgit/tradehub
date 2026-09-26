// src/app/dashboard/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import ProductTable from "@/components/dashboard/ProductTable";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";

// ====== تابع کمکی برای استخراج داده‌های ماهانه ======
async function getMonthlyStats(userId) {
  const productViewsRaw = await prisma.$queryRaw`
    SELECT 
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      SUM(views) as totalViews
    FROM Product
    WHERE userId = ${userId}
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month ASC
  `;

  const requestViewsRaw = await prisma.$queryRaw`
    SELECT 
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      SUM(views) as totalViews
    FROM BuyingRequest
    WHERE userId = ${userId}
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month ASC
  `;

  const inquiriesRaw = await prisma.$queryRaw`
    SELECT 
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      COUNT(*) as totalInquiries
    FROM ProductInquiry
    WHERE supplierId = ${userId}
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month ASC
  `;

  const months = [];
  const viewsData = [];
  const inquiriesData = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    months.push(d.toLocaleString("en-US", { month: "short" }));

    const productView = productViewsRaw.find((row) => row.month === monthKey);
    const requestView = requestViewsRaw.find((row) => row.month === monthKey);
    const totalViews =
      (productView?.totalViews || 0) + (requestView?.totalViews || 0);
    viewsData.push(Number(totalViews));

    const inquiry = inquiriesRaw.find((row) => row.month === monthKey);
    inquiriesData.push(Number(inquiry?.totalInquiries || 0));
  }

  return { months, viewsData, inquiriesData };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [
    productCount,
    requestCount,
    totalProductViews,
    totalRequestViews,
    totalIncomingInquiries,
    recentInquiries,
    recentProducts,
    recentRequests,
    products,
    buyingRequests,
    monthlyStats,
  ] = await Promise.all([
    prisma.product.count({ where: { userId, isVisible: true } }),
    prisma.buyingRequest.count({ where: { userId } }),
    prisma.product.aggregate({ where: { userId }, _sum: { views: true } }),
    prisma.buyingRequest.aggregate({
      where: { userId },
      _sum: { views: true },
    }),
    prisma.productInquiry.count({ where: { supplierId: userId } }),
    prisma.productInquiry.findMany({
      where: { supplierId: userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true },
    }),
    prisma.buyingRequest.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { title: true, createdAt: true },
    }),
    prisma.product.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { inquiries: true } } },
    }),
    prisma.buyingRequest.findMany({
      where: { userId },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    getMonthlyStats(userId),
  ]);

  // ====== ترکیب و مرتب‌سازی فعالیت‌های اخیر ======
  const activities = [
    ...recentInquiries.map((inq) => ({
      type: "inquiry",
      icon: "fa-comment-dots",
      bgClass: "green",
      title: `New inquiry for "${inq.product.name}" from ${inq.user.name}`,
      time: new Date(inq.createdAt),
    })),
    ...recentProducts.map((prod) => ({
      type: "product",
      icon: "fa-box",
      bgClass: "amber",
      title: `New product "${prod.name}" published`,
      time: new Date(prod.createdAt),
    })),
    ...recentRequests.map((req) => ({
      type: "request",
      icon: "fa-cart-plus",
      bgClass: "indigo",
      title: `New buying request "${req.title}" posted`,
      time: new Date(req.createdAt),
    })),
  ]
    .sort((a, b) => b.time - a.time)
    .slice(0, 4);

  const formatTime = (date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalViews =
    (totalProductViews._sum.views || 0) + (totalRequestViews._sum.views || 0);

  return (
    <>
      {/* ====== WELCOME HERO ====== */}
      <section className="d-hero">
        <div className="hero-text">
          <div className="hero-title">
            Welcome back, {session.user.name || "User"} 👋
          </div>
          <div className="hero-sub">
            You have {productCount} active product
            {productCount !== 1 ? "s" : ""} and {requestCount} buying request
            {requestCount !== 1 ? "s" : ""}.
          </div>
        </div>
        <div className="hero-actions">
          <Link href="/products/new" className="btn-hero primary">
            <i className="fas fa-plus"></i> Add Product
          </Link>
          <Link href="/requests/new" className="btn-hero ghost">
            <i className="fas fa-cart-plus"></i> Post Request
          </Link>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="d-stats">
        <Link href="/dashboard/products" className="d-stat">
          <div className="stat-head">
            <div className="stat-icon green">
              <i className="fas fa-box"></i>
            </div>
          </div>
          <div className="stat-value">{productCount}</div>
          <div className="stat-label">Active Products</div>
        </Link>

        <Link href="/dashboard/requests" className="d-stat">
          <div className="stat-head">
            <div className="stat-icon amber">
              <i className="fas fa-cart-shopping"></i>
            </div>
          </div>
          <div className="stat-value">{requestCount}</div>
          <div className="stat-label">Buying Requests</div>
        </Link>

        <Link href="/dashboard/inquiries" className="d-stat">
          <div className="stat-head">
            <div className="stat-icon indigo">
              <i className="fas fa-eye"></i>
            </div>
          </div>
          <div className="stat-value">{totalViews.toLocaleString()}</div>
          <div className="stat-label">Total Views</div>
        </Link>

        <Link href="/dashboard/inquiries" className="d-stat">
          <div className="stat-head">
            <div className="stat-icon rose">
              <i className="fas fa-envelope"></i>
            </div>
          </div>
          <div className="stat-value">
            {totalIncomingInquiries.toLocaleString()}
          </div>
          <div className="stat-label">Total Inquiries</div>
        </Link>
      </section>

      {/* ====== CHART + ACTIVITY ====== */}
      <section className="d-grid-2">
        <div className="d-card">
          <div className="d-card-head">
            <div>
              <div className="d-card-title">Performance Overview</div>
              <div className="d-card-sub">
                Views and inquiries over the last 7 months
              </div>
            </div>
          </div>
          <PerformanceChart
            months={monthlyStats.months}
            viewsData={monthlyStats.viewsData}
            inquiriesData={monthlyStats.inquiriesData}
          />
        </div>

        <div className="d-card">
          <div className="d-card-head">
            <div>
              <div className="d-card-title">Recent Activity</div>
              <div className="d-card-sub">Latest updates</div>
            </div>
            <Link href="/dashboard/activity" className="d-card-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="d-activity">
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div key={i} className="d-activity-item">
                  <div className={`d-activity-icon ${act.bgClass}`}>
                    <i className={`fas ${act.icon}`}></i>
                  </div>
                  <div>
                    <div className="d-activity-text">{act.title}</div>
                    <div className="d-activity-time">
                      {formatTime(act.time)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--d-muted)",
                  fontSize: 13,
                }}
              >
                <i
                  className="fas fa-inbox"
                  style={{
                    fontSize: 28,
                    opacity: 0.3,
                    display: "block",
                    marginBottom: 8,
                  }}
                ></i>
                No recent activity
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== PRODUCTS TABLE ====== */}
      <ProductTable products={products} />

      {/* ====== SUBSCRIPTION (full width) ====== */}
      <SubscriptionCard />

      {/* ====== BUYING REQUESTS + QUICK ACTIONS ====== */}
      <section className="d-grid-bottom">
        <div className="d-card">
          <div className="d-card-head">
            <div>
              <div className="d-card-title">My Buying Requests</div>
              <div className="d-card-sub">
                Latest purchasing requirements
              </div>
            </div>
            <Link href="/dashboard/requests" className="d-card-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div>
            {buyingRequests.length > 0 ? (
              buyingRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/requests/${req.requestNumber}/${req.slug}`}
                  className="d-request-row"
                >
                  <div className="d-req-left">
                    <div className="d-req-icon">
                      <i className="fas fa-basket-shopping"></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="d-req-title">
                        {req.title || "Untitled Request"}
                      </div>
                      <div className="d-req-sub">
                        {req.category || "Uncategorized"} · Posted{" "}
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="d-req-right">
                    <div className="d-req-qty">
                      {req.quantity} {req.unit}
                    </div>
                    <span
                      className={`d-pill ${req.isUrgent ? "danger" : "active"}`}
                    >
                      {req.isUrgent ? "Urgent" : "Active"}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--d-muted)",
                  fontSize: 13,
                }}
              >
                <i
                  className="fas fa-inbox"
                  style={{
                    fontSize: 28,
                    opacity: 0.3,
                    display: "block",
                    marginBottom: 8,
                  }}
                ></i>
                No buying requests yet.
              </div>
            )}
          </div>
        </div>

        <div className="d-card">
          <div className="d-card-head">
            <div>
              <div className="d-card-title">Quick Actions</div>
              <div className="d-card-sub">Frequently used actions</div>
            </div>
          </div>
          <div className="d-quick">
            <Link href="/products/new" className="d-quick-btn">
              <i className="fas fa-plus"></i>
              <span>Add Product</span>
            </Link>
            <Link href="/requests/new" className="d-quick-btn">
              <i className="fas fa-cart-plus"></i>
              <span>Post Request</span>
            </Link>
            <Link href="/dashboard/analytics" className="d-quick-btn">
              <i className="fas fa-chart-column"></i>
              <span>Analytics</span>
            </Link>
            <Link href="/dashboard/profile" className="d-quick-btn">
              <i className="fas fa-building"></i>
              <span>Company Profile</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}