// src/components/dashboard/CustomerCard.js
"use client";

import Link from "next/link";

export default function CustomerCard({ customer }) {
  const { user, inquiryCount, quoteCount, lastContact, messageCount } =
    customer;

  const displayName =
    user.companyName || user.name || "Unknown Company";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileUrl =
    user.profileNumber && user.slug
      ? `/profiles/${user.profileNumber}/${user.slug}`
      : `/profile/${user.id}`;

  const formatLastContact = (date) => {
    if (!date) return "—";
    const now = new Date();
    const then = new Date(date);
    const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="d-card" style={{ padding: 20 }}>
      {/* Header: Avatar + Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: user.logo || user.image
              ? "transparent"
              : "linear-gradient(135deg, #0f9e6e, #0a7d55)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 17,
            fontWeight: 800,
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(15,158,110,0.2)",
          }}
        >
          {user.logo || user.image ? (
            <img
              src={user.logo || user.image}
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
              color: "var(--d-dark, #0b1f18)",
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
              color: "var(--d-muted-2, #64748b)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 3,
            }}
          >
            {user.countryCode && (
              <span
                className={`fi fi-${user.countryCode.toLowerCase()}`}
                style={{
                  width: 16,
                  height: 12,
                  borderRadius: 3,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              ></span>
            )}
            {user.country || "Unknown location"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          padding: "12px 0",
          borderTop: "1px solid var(--d-border-2, #f1f5f7)",
          borderBottom: "1px solid var(--d-border-2, #f1f5f7)",
          marginBottom: 14,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--d-primary, #0f9e6e)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {inquiryCount}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--d-muted-2, #64748b)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Inquiries
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--d-accent, #6366f1)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {messageCount}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--d-muted-2, #64748b)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Messages
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--d-secondary, #f5b544)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {quoteCount}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--d-muted-2, #64748b)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Quotes
          </div>
        </div>
      </div>

      {/* Last contact */}
      <div
        style={{
          fontSize: 11.5,
          color: "var(--d-muted, #94a3b8)",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i className="far fa-clock"></i>
        Last contact: {formatLastContact(lastContact)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <Link
          href={`/dashboard/messages?userId=${user.id}`}
          style={{
            flex: 1,
            padding: "9px 12px",
            background:
              "linear-gradient(135deg, #0f9e6e, #0a7d55)",
            color: "white",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            textAlign: "center",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <i className="fas fa-comment-dots"></i> Message
        </Link>
        <Link
          href={profileUrl}
          target="_blank"
          style={{
            flex: 1,
            padding: "9px 12px",
            background: "white",
            color: "var(--d-text, #334155)",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            textAlign: "center",
            border: "1px solid var(--d-border, #e8edf0)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <i className="fas fa-user"></i> Profile
        </Link>
      </div>
    </div>
  );
}