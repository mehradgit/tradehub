// src/app/dashboard/notifications/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationItem from "@/components/dashboard/NotificationItem";
import NotificationsFilters from "@/components/dashboard/NotificationsFilters";
import NotificationActions from "@/components/dashboard/NotificationActions";

export const metadata = { title: "Notifications | Dashboard" };

export default async function NotificationsPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const {
    filter = "all",
    page: pageParam = 1,
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = { userId: session.user.id };
  if (filter === "unread") where.read = false;
  if (filter === "read") where.read = true;

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="fw-bold mb-0">
            <i
              className="fas fa-bell me-2"
              style={{ color: "var(--primary)" }}
            ></i>
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  background: "var(--primary)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 12px",
                  borderRadius: 50,
                  marginLeft: 10,
                }}
              >
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-muted mb-0">
            Stay updated with your latest activities
          </p>
        </div>

        <NotificationActions
          hasUnread={unreadCount > 0}
          hasAny={totalCount > 0}
        />
      </div>

      {/* Filters */}
      <NotificationsFilters
        currentFilter={filter}
        totalCount={totalCount}
        unreadCount={unreadCount}
      />

      {/* List */}
      {notifications.length > 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid var(--gray-light)",
            overflow: "hidden",
            boxShadow: "var(--shadow)",
          }}
        >
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
          <h3>No notifications</h3>
          <p className="text-muted">
            {filter === "unread"
              ? "You have no unread notifications."
              : filter === "read"
              ? "You have no read notifications."
              : "You don't have any notifications yet."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="dashboard-pagination-container">
          <nav>
            <ul className="pagination">
              {page > 1 && (
                <li className="page-item">
                  <Link
                    href={`/dashboard/notifications?filter=${filter}&page=${page - 1}`}
                    className="page-link"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </Link>
                </li>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <li
                    key={p}
                    className={`page-item ${p === page ? "active" : ""}`}
                  >
                    <Link
                      href={`/dashboard/notifications?filter=${filter}&page=${p}`}
                      className="page-link"
                    >
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
                  <Link
                    href={`/dashboard/notifications?filter=${filter}&page=${page + 1}`}
                    className="page-link"
                  >
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