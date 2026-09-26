// src/components/dashboard/ProfileDropdown.js
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";

export default function ProfileDropdown({ user, stats, isOpen, onClose }) {
  const dropdownRef = useRef(null);

  // ====== بستن با کلیک بیرون ======
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.closest("[data-profile-trigger]")
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = user.companyName || user.name || "User";
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = user.logo || user.image;

  const handleSignOut = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    onClose();
    await signOut({ callbackUrl: "/" });
  };

  const publicProfileUrl =
    user.profileNumber && user.slug
      ? `/profiles/${user.profileNumber}/${user.slug}`
      : null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: "calc(100% + 12px)",
        right: 0,
        width: 300,
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
      {/* ====== Header: Avatar + نام + ایمیل ====== */}
      <div
        style={{
          padding: 16,
          background: "linear-gradient(135deg, #f0faf6, #eaf7f1)",
          borderBottom: "1px solid var(--gray-light)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: avatarUrl
                ? "transparent"
                : "linear-gradient(135deg, #13795b, #1d9a71)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              fontWeight: 800,
              overflow: "hidden",
              flexShrink: 0,
              border: "2px solid white",
              boxShadow: "0 4px 12px rgba(19,121,91,0.2)",
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

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--black)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--gray)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
          </div>
        </div>

        {/* پلن فعلی */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 50,
              background:
                user.plan === "GOLD"
                  ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                  : user.plan === "SILVER"
                    ? "linear-gradient(135deg, #cbd5d1, #9ca3af)"
                    : user.plan === "BRONZE"
                      ? "linear-gradient(135deg, #f59e0b, #b45309)"
                      : "#eef1f0",
              color: user.plan === "FREE" ? "#71807b" : "white",
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            <i className="fas fa-crown"></i>
            {user.plan || "FREE"} Plan
          </span>

          <Link
            href="/plans"
            onClick={onClose}
            style={{
              fontSize: 11,
              color: "var(--primary)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Upgrade →
          </Link>
        </div>
      </div>

      {/* ====== Menu Items ====== */}
      <div style={{ padding: 8 }}>
        <MenuItem
          href="/dashboard"
          icon="fa-chart-pie"
          label="Dashboard"
          onClick={onClose}
        />
        <MenuItem
          href="/dashboard/profile"
          icon="fa-user"
          label="My Profile"
          onClick={onClose}
        />
        <MenuItem
          href="/dashboard/edit-profile"
          icon="fa-pen"
          label="Edit Profile"
          onClick={onClose}
        />
        {publicProfileUrl && (
          <>
            <MenuItem
              href={publicProfileUrl}
              icon="fa-external-link-alt"
              label="View Public Profile"
              onClick={onClose}
              external
            />
            <MenuItem
              href="/"
              icon="fa-globe"
              label="Visit Public Site"
              onClick={onClose}
              external
            />
          </>
        )}

        <Divider />

        <MenuItem
          href="/dashboard/messages"
          icon="fa-message"
          label="Messages"
          badge={stats?.unreadMessages}
          onClick={onClose}
        />
        <MenuItem
          href="/dashboard/notifications"
          icon="fa-bell"
          label="Notifications"
          badge={stats?.unreadNotifications}
          onClick={onClose}
        />
        <MenuItem
          href="/dashboard/support"
          icon="fa-headset"
          label="Support"
          badge={stats?.openTickets}
          onClick={onClose}
        />

        <Divider />

        <MenuItem
          href="/dashboard/settings"
          icon="fa-gear"
          label="Settings"
          onClick={onClose}
        />
        <MenuItem
          href="/dashboard/saved-products"
          icon="fa-heart"
          label="Saved Items"
          onClick={onClose}
        />

        <Divider />

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            background: "transparent",
            border: 0,
            color: "#dc2626",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <i
            className="fas fa-sign-out-alt"
            style={{ width: 20, textAlign: "center", fontSize: 14 }}
          ></i>
          Sign Out
        </button>
      </div>

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

// ====== MenuItem ======
function MenuItem({ href, icon, label, badge, onClick, external }) {
  const props = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      onClick={onClick}
      {...props}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: "var(--gray-dark)",
        fontSize: 13,
        fontWeight: 600,
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--light)";
        e.currentTarget.style.color = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--gray-dark)";
      }}
    >
      <i
        className={`fas ${icon}`}
        style={{ width: 20, textAlign: "center", fontSize: 14 }}
      ></i>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span
          style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 50,
            background: "#ef4444",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ====== Divider ======
function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--gray-light)",
        margin: "6px 4px",
      }}
    />
  );
}
