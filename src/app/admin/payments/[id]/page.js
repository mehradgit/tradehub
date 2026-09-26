// src/app/admin/payments/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getPaymentStatusBadge,
  getPaymentMethodLabel,
  formatCurrency,
  formatDateTime,
} from "@/utils/invoiceHelpers";

export const metadata = { title: "Payment Detail | Admin" };

export default async function AdminPaymentDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          country: true,
          countryCode: true,
          plan: true,
          profileNumber: true,
          slug: true,
          image: true,
        },
      },
      plan: true,
      coupon: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      usages: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!payment) notFound();

  const badge = getPaymentStatusBadge(payment.status);

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/admin/payments"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Payments
        </Link>
      </div>

      {/* Header Card */}
      <div
        className="admin-card"
        style={{ padding: 24, marginBottom: 16 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                fontWeight: 700,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Invoice
            </div>
            <h1
              style={{
                font: "800 22px 'Manrope', sans-serif",
                color: "#13251f",
                margin: "0 0 8px 0",
              }}
            >
              {payment.invoiceNumber}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 50,
                background: badge.bg,
                color: badge.color,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              <i className={`fas ${badge.icon}`} style={{ fontSize: 10 }}></i>
              {badge.label}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={`/dashboard/billing/invoice/${payment.id}`}
              target="_blank"
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "white",
                border: "1px solid var(--line)",
                color: "var(--text)",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="fa-solid fa-external-link-alt"></i>
              View Invoice
            </Link>
          </div>
        </div>

        {/* Amount */}
        <div
          style={{
            padding: 20,
            background: "linear-gradient(135deg, #eaf7f1, #d1ede0)",
            borderRadius: 14,
            border: "1px solid #a7f3d0",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#047857",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Total Amount
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#0b1f18",
              fontFamily: "Manrope, sans-serif",
              letterSpacing: -0.5,
            }}
          >
            {formatCurrency(payment.amount, payment.currency)}
          </div>
          {Number(payment.discountAmount) > 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#047857",
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span>
                Original:{" "}
                <strong>
                  {formatCurrency(payment.originalAmount, payment.currency)}
                </strong>
              </span>
              <span>
                Discount:{" "}
                <strong>
                  −{formatCurrency(payment.discountAmount, payment.currency)}
                </strong>
                {payment.coupon && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: "2px 8px",
                      background: "white",
                      borderRadius: 50,
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {payment.coupon.code}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* User Info */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: "#13251f",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-user"
              style={{ color: "var(--green2)" }}
            ></i>
            User Information
          </h3>

          <Link
            href={`/admin/users/${payment.user.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "#f9fbfa",
              borderRadius: 12,
              textDecoration: "none",
              marginBottom: 16,
            }}
          >
            {payment.user.image ? (
              <img
                src={payment.user.image}
                alt={payment.user.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #13795b, #0d9469)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {(payment.user.companyName || payment.user.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#13251f",
                }}
              >
                {payment.user.companyName || payment.user.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  marginTop: 2,
                }}
              >
                {payment.user.email}
              </div>
            </div>
            <i
              className="fa-solid fa-arrow-right"
              style={{ color: "var(--green2)", fontSize: 12 }}
            ></i>
          </Link>

          <InfoRow label="Country" value={payment.user.country || "—"} />
          <InfoRow label="Plan" value={payment.user.plan || "—"} />
          <InfoRow
            label="Profile #"
            value={payment.user.profileNumber || "—"}
          />
        </div>

        {/* Payment Info */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: "#13251f",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-credit-card"
              style={{ color: "var(--green2)" }}
            ></i>
            Payment Information
          </h3>

          <InfoRow label="Invoice #" value={payment.invoiceNumber} />
          <InfoRow
            label="Reference"
            value={payment.referenceNumber || "—"}
          />
          <InfoRow label="Plan" value={payment.plan?.name || "—"} />
          <InfoRow label="Duration" value={`${payment.duration} days`} />
          <InfoRow
            label="Currency"
            value={payment.currency || "USD"}
          />
          <InfoRow
            label="Method"
            value={getPaymentMethodLabel(payment.method)}
          />
          <InfoRow
            label="Created"
            value={formatDateTime(payment.createdAt)}
          />
          {payment.paidAt && (
            <InfoRow
              label="Paid At"
              value={formatDateTime(payment.paidAt)}
            />
          )}
          {payment.refundedAt && (
            <InfoRow
              label="Refunded At"
              value={formatDateTime(payment.refundedAt)}
            />
          )}
        </div>
      </div>

      {/* Coupon Usage */}
      {payment.usages && payment.usages.length > 0 && (
        <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
          <h3
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: "#13251f",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-tag"
              style={{ color: "var(--green2)" }}
            ></i>
            Coupon Usage
          </h3>
          {payment.usages.map((usage) => (
            <div
              key={usage.id}
              style={{
                padding: 12,
                background: "#f9fbfa",
                borderRadius: 10,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700, color: "#13251f" }}>
                {payment.coupon?.code || "Coupon"}
              </div>
              <div style={{ color: "var(--muted)", marginTop: 4 }}>
                Saved {formatCurrency(usage.discountAmount)} by{" "}
                {usage.user.name || usage.user.email}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Created By */}
      {payment.createdBy && (
        <div className="admin-card" style={{ padding: 20 }}>
          <h3
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: "#13251f",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-user-shield"
              style={{ color: "var(--green2)" }}
            ></i>
            Created By Admin
          </h3>
          <InfoRow
            label="Admin"
            value={payment.createdBy.name || payment.createdBy.email}
          />
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #f1f5f7",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#13251f" }}>{value}</span>
    </div>
  );
}