// src/components/dashboard/NotificationsFilters.js
"use client";

import Link from "next/link";

export default function NotificationsFilters({
  currentFilter,
  totalCount,
  unreadCount,
}) {
  const filters = [
    { value: "all", label: "All", count: totalCount },
    { value: "unread", label: "Unread", count: unreadCount },
    { value: "read", label: "Read", count: totalCount - unreadCount },
  ];

  return (
    <div className="d-flex gap-2 flex-wrap mb-4">
      {filters.map((f) => (
        <Link
          key={f.value}
          href={`/dashboard/notifications${
            f.value === "all" ? "" : `?filter=${f.value}`
          }`}
          style={{
            padding: "8px 18px",
            borderRadius: 50,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            background:
              currentFilter === f.value ? "var(--primary)" : "white",
            color:
              currentFilter === f.value ? "white" : "var(--gray-dark)",
            border: `1px solid ${
              currentFilter === f.value
                ? "var(--primary)"
                : "var(--gray-light)"
            }`,
            transition: "all 0.2s ease",
          }}
        >
          {f.label} ({f.count})
        </Link>
      ))}
    </div>
  );
}