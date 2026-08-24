// src/app/dashboard/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import ProductTable from "@/components/dashboard/ProductTable";

// تابع کمکی برای استخراج داده‌های ماهانه
async function getMonthlyStats(userId) {
  // بازدیدهای ماهانه محصولات (7 ماه اخیر)
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
  
  // بازدیدهای ماهانه درخواست‌های خرید
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

  // درخواست‌های دریافتی ماهانه (به‌عنوان تأمین‌کننده)
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

  // ترکیب داده‌ها برای ۷ ماه اخیر
  const months = [];
  const viewsData = [];
  const inquiriesData = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7); // 'YYYY-MM'
    months.push(d.toLocaleString('en-US', { month: 'short' }));

    // پیدا کردن مجموع بازدیدها برای این ماه
    const productView = productViewsRaw.find(row => row.month === monthKey);
    const requestView = requestViewsRaw.find(row => row.month === monthKey);
    const totalViews = (productView?.totalViews || 0) + (requestView?.totalViews || 0);
    viewsData.push(totalViews);

    // پیدا کردن تعداد درخواست‌ها برای این ماه
    const inquiry = inquiriesRaw.find(row => row.month === monthKey);
    inquiriesData.push(inquiry?.totalInquiries || 0);
  }

  return { viewsData, inquiriesData };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  // ====== کوئری‌های هم‌زمان ======
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
    // 1. تعداد محصولات فعال
    prisma.product.count({ where: { userId, isVisible: true } }),

    // 2. تعداد درخواست‌های خرید
    prisma.buyingRequest.count({ where: { userId } }),

    // 3. مجموع بازدید محصولات
    prisma.product.aggregate({ where: { userId }, _sum: { views: true } }),

    // 4. مجموع بازدید درخواست‌ها
    prisma.buyingRequest.aggregate({ where: { userId }, _sum: { views: true } }),

    // 5. تعداد کل درخواست‌های دریافتی (به عنوان تامین‌کننده)
    prisma.productInquiry.count({ where: { supplierId: userId } }),

    // 6. درخواست‌های جدید (برای فعالیت‌های اخیر - ۴ مورد)
    prisma.productInquiry.findMany({
      where: { supplierId: userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true } }, user: { select: { name: true } } },
    }),

    // 7. محصولات جدید
    prisma.product.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true },
    }),

    // 8. درخواست‌های خرید جدید
    prisma.buyingRequest.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { title: true, createdAt: true },
    }),

    // 9. لیست محصولات برای جدول (۱۰ مورد)
    prisma.product.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { inquiries: true } } },
    }),

    // 10. لیست درخواست‌های خرید
    prisma.buyingRequest.findMany({
      where: { userId },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),

    // 11. داده‌های ماهانه برای نمودار
    getMonthlyStats(userId),
  ]);

  // ====== ترکیب و مرتب‌سازی فعالیت‌های اخیر (حداکثر ۴ مورد) ======
  const activities = [
    ...recentInquiries.map((inq) => ({
      type: "inquiry",
      icon: "fa-message",
      bgClass: "primary-bg",
      title: `New inquiry for "${inq.product.name}" from ${inq.user.name}`,
      time: new Date(inq.createdAt),
    })),
    ...recentProducts.map((prod) => ({
      type: "product",
      icon: "fa-box",
      bgClass: "gray-bg",
      title: `New product "${prod.name}" published`,
      time: new Date(prod.createdAt),
    })),
    ...recentRequests.map((req) => ({
      type: "request",
      icon: "fa-cart-shopping",
      bgClass: "secondary-bg",
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

  const totalViews = (totalProductViews._sum.views || 0) + (totalRequestViews._sum.views || 0);

  return (
    <>
      {/* ====== WELCOME ====== */}
      <div className="welcome-box">
        <div>
          <div className="welcome-title">Welcome back, {session.user.name || "User"} 👋</div>
          <div className="welcome-text">
            You have {productCount} active products and {requestCount} buying requests today.
          </div>
        </div>
        <div className="welcome-actions">
          <Link href="/products/new" className="btn-white">
            <i className="fa-solid fa-plus"></i> Add Product
          </Link>
          <Link href="/requests/new" className="btn-outline-white">
            <i className="fa-solid fa-cart-plus"></i> Post Buying Request
          </Link>
        </div>
      </div>

      {/* ====== STATS (لینک‌دار) ====== */}
      <div className="stats-grid">
        <Link href="/dashboard/products" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon primary-bg"><i className="fa-solid fa-box"></i></div>
          <div>
            <div className="stat-number">{productCount}</div>
            <div className="stat-label">Active Products</div>
            <div className="stat-change"><i className="fa-solid fa-arrow-up"></i> Active</div>
          </div>
        </Link>
        <Link href="/dashboard/requests" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon secondary-bg"><i className="fa-solid fa-cart-shopping"></i></div>
          <div>
            <div className="stat-number">{requestCount}</div>
            <div className="stat-label">Buying Requests</div>
            <div className="stat-change">{requestCount > 0 ? "Active" : "No active"}</div>
          </div>
        </Link>
        <Link href="/dashboard/inquiries" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon accent-bg"><i className="fa-solid fa-eye"></i></div>
          <div>
            <div className="stat-number">{totalViews.toLocaleString()}</div>
            <div className="stat-label">Total Views</div>
            <div className="stat-change">↑ Across all listings</div>
          </div>
        </Link>
        <Link href="/dashboard/inquiries" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon gray-bg"><i className="fa-solid fa-envelope"></i></div>
          <div>
            <div className="stat-number">{totalIncomingInquiries}</div>
            <div className="stat-label">Total Inquiries</div>
            <div className="stat-change">Incoming requests</div>
          </div>
        </Link>
      </div>

      {/* ====== CHART + ACTIVITY ====== */}
      <div className="dashboard-grid">
        <div className="card-box">
          <div className="card-header">
            <div>
              <div className="card-title">Business Performance</div>
              <div className="card-subtitle">Product views and inquiries over the last 7 months</div>
            </div>
          </div>
          {/* پاس‌دادن داده‌های واقعی */}
          <PerformanceChart
            viewsData={monthlyStats.viewsData}
            inquiriesData={monthlyStats.inquiriesData}
          />
        </div>

        {/* ====== RECENT ACTIVITY (حداکثر ۴ مورد) ====== */}
        <div className="card-box">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest activity on your account</div>
            </div>
            <Link href="/dashboard/activity" className="view-all">View All</Link>
          </div>
          <div className="activity">
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-icon ${act.bgClass}`}>
                    <i className={`fa-solid ${act.icon}`}></i>
                  </div>
                  <div>
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-time">{formatTime(act.time)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <div className="activity-time">No recent activity</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== PRODUCTS (با دکمه View All) ====== */}
      <ProductTable products={products} />

      {/* ====== BUYING REQUESTS + QUICK ACTIONS ====== */}
      <div className="bottom-grid">
        <div className="card-box">
          <div className="card-header">
            <div>
              <div className="card-title">My Buying Requests</div>
              <div className="card-subtitle">Latest purchasing requirements</div>
            </div>
            <Link href="/dashboard/requests" className="view-all">View All</Link>
          </div>
          <div className="requests-list">
            {buyingRequests.length > 0 ? (
              buyingRequests.map((req) => (
                <div key={req.id} className="request-item">
                  <div className="request-info">
                    <div className="request-icon">
                      <i className="fa-solid fa-basket-shopping"></i>
                    </div>
                    <div className="request-content">
                      <div className="request-title">
                        {req.title || "Untitled Request"}
                      </div>
                      <div className="request-meta">
                        {req.category || "Uncategorized"} • Posted{" "}
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="request-extra">
                    <div className="quantity">
                      {req.quantity} {req.unit}
                    </div>
                    <span
                      className={`status ${req.isUrgent ? "urgent" : "active"}`}
                    >
                      {req.isUrgent ? "Urgent" : "Active"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted" style={{ fontSize: "12px", padding: "10px 0" }}>
                No buying requests yet.
              </div>
            )}
          </div>
        </div>

        <div className="card-box">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Actions</div>
              <div className="card-subtitle">Frequently used actions</div>
            </div>
          </div>
          <div className="quick-actions">
            <Link href="/products/new" className="quick-action">
              <i className="fa-solid fa-plus"></i>
              <span>Add Product</span>
            </Link>
            <Link href="/requests/new" className="quick-action">
              <i className="fa-solid fa-cart-plus"></i>
              <span>Post Request</span>
            </Link>
            <Link href="/dashboard/analytics" className="quick-action">
              <i className="fa-solid fa-chart-column"></i>
              <span>View Analytics</span>
            </Link>
            <Link href="/dashboard/profile" className="quick-action">
              <i className="fa-solid fa-building"></i>
              <span>Company Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}