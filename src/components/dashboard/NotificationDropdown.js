// src/components/dashboard/NotificationDropdown.js
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import NotificationItem from "./NotificationItem";

export default function NotificationDropdown({
  isOpen,
  onClose,
  onCountChange,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef(null);

  // ====== بستن با کلیک بیرون ======
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        !e.target.closest("[data-notification-bell]")
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ====== دریافت لیست ======
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/user/notifications?limit=5&filter=all");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          onCountChange?.(data.unreadCount || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, onCountChange]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/user/notifications/mark-all-read", {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        onCountChange?.(0);
        toast.success("All marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    const newCount = Math.max(0, unreadCount - 1);
    setUnreadCount(newCount);
    onCountChange?.(newCount);
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={wrapperRef}
      className="notification-dropdown"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        background: "white",
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: "1px solid var(--gray-light)",
        overflow: "hidden",
        zIndex: 1000,
        animation: "fadeInDown 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--gray-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--light)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "var(--black)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Notifications
          {unreadCount > 0 && (
            <span
              style={{
                background: "var(--primary)",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 50,
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--primary)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div
        style={{
          maxHeight: 420,
          overflowY: "auto",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--gray)",
            }}
          >
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--gray)",
            }}
          >
            <i
              className="fas fa-bell-slash"
              style={{
                fontSize: 32,
                opacity: 0.3,
                marginBottom: 8,
                display: "block",
              }}
            ></i>
            <p style={{ fontSize: 13, margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={handleRead}
              onDelete={handleDelete}
              compact={true}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        href="/dashboard/notifications"
        onClick={onClose}
        style={{
          display: "block",
          padding: "12px",
          textAlign: "center",
          background: "var(--light)",
          color: "var(--primary)",
          fontSize: 12,
          fontWeight: 700,
          textDecoration: "none",
          borderTop: "1px solid var(--gray-light)",
        }}
      >
        View All Notifications →
      </Link>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
