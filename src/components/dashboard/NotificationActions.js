// src/components/dashboard/NotificationActions.js
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function NotificationActions({ hasUnread, hasAny }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkAllRead = async () => {
    if (!hasUnread) return;
    setLoading(true);
    try {
      const res = await fetch(
        "/api/user/notifications/mark-all-read",
        { method: "PATCH" }
      );
      if (res.ok) {
        toast.success("All marked as read");
        window.dispatchEvent(new Event("notifications-updated"));
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!hasAny) return;
    if (!confirm("Are you sure you want to delete all notifications?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/notifications", {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("All notifications cleared");
        window.dispatchEvent(new Event("notifications-updated"));
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to clear notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex gap-2 flex-wrap">
      <button
        onClick={handleMarkAllRead}
        disabled={!hasUnread || loading}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: "1px solid var(--primary)",
          background: "white",
          color: "var(--primary)",
          fontSize: 12,
          fontWeight: 700,
          cursor: hasUnread ? "pointer" : "not-allowed",
          opacity: hasUnread ? 1 : 0.5,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i className="fas fa-check-double"></i>
        Mark All as Read
      </button>

      <button
        onClick={handleClearAll}
        disabled={!hasAny || loading}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: "1px solid #fecaca",
          background: "white",
          color: "#dc2626",
          fontSize: 12,
          fontWeight: 700,
          cursor: hasAny ? "pointer" : "not-allowed",
          opacity: hasAny ? 1 : 0.5,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i className="fas fa-trash"></i>
        Clear All
      </button>
    </div>
  );
}