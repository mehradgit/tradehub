// src/app/dashboard/activity/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ActivityPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const page = parseInt(searchParams?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  // دریافت تمام فعالیت‌ها با شمارش تعداد کل
  const [inquiries, products, requests, totalCount] = await Promise.all([
    prisma.productInquiry.findMany({
      where: { supplierId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true } }, user: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true },
    }),
    prisma.buyingRequest.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { title: true, createdAt: true },
    }),
    prisma.productInquiry.count({ where: { supplierId: userId } }) +
    prisma.product.count({ where: { userId } }) +
    prisma.buyingRequest.count({ where: { userId } }),
  ]);

  // ترکیب و مرتب‌سازی
  const activities = [
    ...inquiries.map((inq) => ({
      type: "inquiry",
      icon: "fa-message",
      bgClass: "primary-bg",
      title: `New inquiry for "${inq.product.name}" from ${inq.user.name}`,
      time: new Date(inq.createdAt),
    })),
    ...products.map((prod) => ({
      type: "product",
      icon: "fa-box",
      bgClass: "gray-bg",
      title: `New product "${prod.name}" published`,
      time: new Date(prod.createdAt),
    })),
    ...requests.map((req) => ({
      type: "request",
      icon: "fa-cart-shopping",
      bgClass: "secondary-bg",
      title: `New buying request "${req.title}" posted`,
      time: new Date(req.createdAt),
    })),
  ].sort((a, b) => b.time - a.time);

  const totalPages = Math.ceil(totalCount / limit);

  const formatTime = (date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">
            <i className="fas fa-bolt me-2" style={{ color: "var(--primary)" }}></i>
            Activity Log
          </h1>
          <p className="text-muted">All activities on your account</p>
        </div>
        <Link href="/dashboard" className="btn btn-outline-secondary btn-sm">
          <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
        </Link>
      </div>

      {activities.length > 0 ? (
        <div className="activity-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {activities.map((act, i) => (
            <div key={i} className="activity-item">
              <div className={`activity-icon ${act.bgClass}`}>
                <i className={`fa-solid ${act.icon}`}></i>
              </div>
              <div>
                <div className="activity-title">{act.title}</div>
                <div className="activity-time">{formatTime(act.time)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h3>No activities yet</h3>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="dashboard-pagination-container">
          <nav>
            <ul className="pagination">
              {page > 1 && (
                <li className="page-item">
                  <Link href={`/dashboard/activity?page=${page - 1}`} className="page-link">
                    <i className="fas fa-chevron-left"></i>
                  </Link>
                </li>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                    <Link href={`/dashboard/activity?page=${p}`} className="page-link">
                      {p}
                    </Link>
                  </li>
                );
              })}
              {totalPages > 5 && (
                <li className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              )}
              {page < totalPages && (
                <li className="page-item">
                  <Link href={`/dashboard/activity?page=${page + 1}`} className="page-link">
                    <i className="fas fa-chevron-right"></i>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}