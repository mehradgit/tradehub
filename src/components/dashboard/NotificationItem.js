// src/components/dashboard/NotificationItem.js
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function NotificationItem({
  notification,
  onRead,
  onDelete,
  compact = false,
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  const handleClick = async () => {
    // Mark as read
    if (!notification.read) {
      setMarking(true);
      try {
        await fetch(`/api/user/notifications/${notification.id}/read`, {
          method: "PATCH",
        });
        onRead?.(notification.id);
      } catch (err) {
        console.error(err);
      } finally {
        setMarking(false);
      }
    }

    // Redirect
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `/api/user/notifications/${notification.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete?.(notification.id);
        toast.success("Notification deleted");
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: compact ? "12px 14px" : "16px 20px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        cursor: "pointer",
        background: notification.read ? "white" : "var(--primary-light, #eaf7f1)",
        borderBottom: "1px solid var(--gray-light)",
        transition: "background 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (notification.read) {
          e.currentTarget.style.background = "var(--light)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.read
          ? "white"
          : "var(--primary-light, #eaf7f1)";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: compact ? 34 : 42,
          height: compact ? 34 : 42,
          borderRadius: 12,
          background: notification.read ? "var(--light)" : "white",
          color: "var(--primary)",
          display: "grid",
          placeItems: "center",
          fontSize: compact ? 13 : 16,
          flexShrink: 0,
          boxShadow: notification.read
            ? "none"
            : "0 2px 8px rgba(19,121,91,0.15)",
        }}
      >
        <i className={`fas ${notification.icon || "fa-bell"}`}></i>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: compact ? 13 : 14,
            fontWeight: notification.read ? 600 : 700,
            color: "var(--black)",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: compact ? "nowrap" : "normal",
            lineHeight: 1.4,
          }}
        >
          {notification.title}
        </div>

        {notification.body && !compact && (
          <div
            style={{
              fontSize: 13,
              color: "var(--gray)",
              lineHeight: 1.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              marginBottom: 4,
            }}
          >
            {notification.body}
          </div>
        )}

        <div
          style={{
            fontSize: 11,
            color: "var(--gray)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="far fa-clock"></i>
          {formatTime(notification.createdAt)}
          {!notification.read && (
            <>
              <span style={{ margin: "0 4px" }}>·</span>
              <span
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: 10,
                  textTransform: "uppercase",
                }}
              >
                New
              </span>
            </>
          )}
        </div>
      </div>

      {/* Delete button (only in non-compact mode) */}
      {!compact && onDelete && (
        <button
          onClick={handleDelete}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "transparent",
            border: "1px solid var(--gray-light)",
            color: "var(--gray)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.color = "#dc2626";
            e.currentTarget.style.borderColor = "#fecaca";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--gray)";
            e.currentTarget.style.borderColor = "var(--gray-light)";
          }}
          title="Delete"
        >
          <i className="fas fa-trash"></i>
        </button>
      )}

      {/* Unread dot */}
      {!notification.read && (
        <span
          style={{
            position: "absolute",
            top: compact ? 8 : 12,
            right: compact ? 8 : 12,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--primary)",
            boxShadow: "0 0 0 3px rgba(19,121,91,0.15)",
          }}
        />
      )}
    </div>
  );
}