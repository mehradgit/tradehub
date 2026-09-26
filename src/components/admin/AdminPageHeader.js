// src/components/admin/AdminPageHeader.js
"use client";

export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <h1
          style={{
            font: "800 20px 'Manrope', sans-serif",
            color: "var(--dark)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              marginTop: "3px",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}