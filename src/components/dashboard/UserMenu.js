// src/components/dashboard/UserMenu.js
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ProfileDropdown from "./ProfileDropdown";

export default function UserMenu() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    unreadMessages: 0,
    unreadNotifications: 0,
    openTickets: 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ====== fetch user data ======
  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchUserData();
  }, [session, fetchUserData]);

  // ====== به‌روزرسانی badgeها با رویدادهای global ======
  useEffect(() => {
    const refresh = () => fetchUserData();
    window.addEventListener("notifications-updated", refresh);
    window.addEventListener("messages-read", refresh);
    return () => {
      window.removeEventListener("notifications-updated", refresh);
      window.removeEventListener("messages-read", refresh);
    };
  }, [fetchUserData]);

  if (loading || !user) {
    return (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "var(--light)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      ></div>
    );
  }

  const displayName = user.companyName || user.name || "User";
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = user.logo || user.image;
  const totalBadges =
    (stats.unreadMessages || 0) +
    (stats.unreadNotifications || 0) +
    (stats.openTickets || 0);

  return (
    <div style={{ position: "relative" }}>
      <button
        data-profile-trigger
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 10px 4px 4px",
          borderRadius: 50,
          background: isOpen ? "var(--light)" : "white",
          border: "1px solid var(--gray-light)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--primary)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "var(--gray-light)";
          }
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: avatarUrl
              ? "transparent"
              : "linear-gradient(135deg, #13795b, #1d9a71)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            fontWeight: 800,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            initials
          )}
        </div>

        {/* نام + نقش - فقط دسکتاپ */}
        <div
          className="user-menu-info"
          style={{ textAlign: "left", display: "none" }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--black)",
              lineHeight: 1.2,
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--gray)",
              lineHeight: 1.2,
            }}
          >
            {user.role === "SUPPLIER" ? "Supplier" : "Buyer"}
          </div>
        </div>

        {/* Chevron */}
        <i
          className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
          style={{
            fontSize: 10,
            color: "var(--gray)",
            transition: "transform 0.2s ease",
          }}
        ></i>

        {/* Total badge (mobile) */}
        {totalBadges > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid white",
            }}
          ></span>
        )}
      </button>

      <ProfileDropdown
        user={user}
        stats={stats}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @media (min-width: 900px) {
          :global(.user-menu-info) {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}