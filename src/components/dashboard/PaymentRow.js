// src/components/dashboard/PaymentRow.js
import Link from "next/link";
import { getPaymentStatusBadge, formatCurrency, formatDate } from "@/utils/invoiceHelpers";

export default function PaymentRow({ payment }) {
  const statusBadge = getPaymentStatusBadge(payment.status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 20px",
        borderBottom: "1px solid var(--d-border-2, #f1f5f7)",
        transition: "background 0.15s ease",
      }}
      className="billing-row"
    >
      {/* Left: Icon + Info */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: statusBadge.bg,
            color: statusBadge.color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            fontSize: 15,
          }}
        >
          <i className={`fas ${statusBadge.icon}`}></i>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "var(--d-dark, #0b1f18)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              {payment.invoiceNumber}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 50,
                background: statusBadge.bg,
                color: statusBadge.color,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {statusBadge.label}
            </span>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--d-muted-2, #64748b)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>
              <i className="fas fa-box me-1" style={{ fontSize: 10 }}></i>
              {payment.plan?.name || "—"} Plan · {payment.duration} days
            </span>
            <span>·</span>
            <span>
              <i className="far fa-calendar me-1" style={{ fontSize: 10 }}></i>
              {formatDate(payment.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amount + Actions */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--d-dark, #0b1f18)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {formatCurrency(payment.amount, payment.currency)}
          </div>
          {Number(payment.discountAmount) > 0 && (
            <div
              style={{
                fontSize: 11,
                color: "var(--d-muted, #94a3b8)",
                textDecoration: "line-through",
              }}
            >
              {formatCurrency(payment.originalAmount, payment.currency)}
            </div>
          )}
        </div>

        <Link
          href={`/dashboard/billing/invoice/${payment.id}`}
          style={{
            padding: "8px 14px",
            borderRadius: 9,
            background: "white",
            border: "1px solid var(--d-border, #e8edf0)",
            color: "var(--d-text, #334155)",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
          className="billing-view-btn"
        >
          <i className="fas fa-eye" style={{ fontSize: 11 }}></i>
          View
        </Link>
      </div>
    </div>
  );
}