// src/components/dashboard/NotificationBell.js
"use client";

import { useEffect, useState, useCallback } from "react";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ====== دریافت تعداد خوانده‌نشده ======
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ====== Polling هر 30 ثانیه ======
  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ====== گوش دادن به رویداد برای به‌روزرسانی فوری ======
  useEffect(() => {
    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener("notifications-updated", handleRefresh);
    return () => {
      window.removeEventListener("notifications-updated", handleRefresh);
    };
  }, [fetchUnreadCount]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        data-notification-bell
        onClick={handleToggle}
        className="top-icon"
        style={{ position: "relative" }}
        aria-label="Notifications"
      >
        <i className="fa-regular fa-bell"></i>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 50,
              background: "#ef4444",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              border: "2px solid white",
              boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCountChange={setUnreadCount}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}