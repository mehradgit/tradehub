// src/app/dashboard/billing/invoice/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import InvoicePrintButton from "@/components/dashboard/InvoicePrintButton";
import {
  getPaymentStatusBadge,
  getPaymentMethodLabel,
  formatCurrency,
  formatDateTime,
} from "@/utils/invoiceHelpers";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { invoiceNumber: true },
  });
  return {
    title: payment
      ? `${payment.invoiceNumber} | Invoice`
      : "Invoice Not Found",
  };
}

export default async function InvoicePage({ params }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      plan: { select: { id: true, name: true, description: true } },
      coupon: { select: { code: true, type: true, value: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          country: true,
          address: true,
          phone: true,
        },
      },
    },
  });

  if (!payment) notFound();
  if (payment.userId !== session.user.id) {
    redirect("/dashboard/billing");
  }

  const statusBadge = getPaymentStatusBadge(payment.status);
  const hasDiscount = Number(payment.discountAmount) > 0;

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        <Link
          href="/dashboard/billing"
          style={{
            color: "var(--d-primary, #0f9e6e)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Billing
        </Link>
        <i
          className="fas fa-chevron-right"
          style={{ fontSize: 10, color: "var(--d-muted, #94a3b8)" }}
        ></i>
        <span style={{ color: "var(--d-muted-2, #64748b)" }}>
          {payment.invoiceNumber}
        </span>
      </nav>

      {/* Actions */}
      <div
        className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"
      >
        <div />
        <div className="d-flex gap-2 flex-wrap">
          <InvoicePrintButton />
          <Link
            href="/dashboard/billing"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "white",
              border: "1px solid var(--d-border, #e8edf0)",
              color: "var(--d-text, #334155)",
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="fas fa-arrow-left"></i> Back
          </Link>
        </div>
      </div>

      {/* Invoice */}
      <div
        className="invoice-container"
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid var(--d-border, #e8edf0)",
          padding: 40,
          boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            flexWrap: "wrap",
            paddingBottom: 24,
            borderBottom: "2px solid var(--d-border-2, #f1f5f7)",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, #0f9e6e, #0a7d55)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  boxShadow: "0 6px 16px rgba(15,158,110,0.25)",
                }}
              >
                <i className="fas fa-leaf"></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "var(--d-dark, #0b1f18)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  FoodTradeHub
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--d-muted-2, #64748b)",
                  }}
                >
                  B2B Food Marketplace
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "var(--d-dark, #0b1f18)",
                fontFamily: "Manrope, sans-serif",
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              INVOICE
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 50,
                background: statusBadge.bg,
                color: statusBadge.color,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              <i className={`fas ${statusBadge.icon}`}></i>
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Meta Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--d-muted-2, #64748b)",
                textTransform: "uppercase",
                fontWeight: 800,
                letterSpacing: 0.6,
                marginBottom: 6,
              }}
            >
              Billed To
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--d-dark, #0b1f18)",
                marginBottom: 2,
              }}
            >
              {payment.user.companyName || payment.user.name || "—"}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--d-muted-2, #64748b)",
                lineHeight: 1.6,
              }}
            >
              {payment.user.email}
              {payment.user.address && (
                <>
                  <br />
                  {payment.user.address}
                </>
              )}
              {payment.user.country && (
                <>
                  <br />
                  {payment.user.country}
                </>
              )}
              {payment.user.phone && (
                <>
                  <br />
                  {payment.user.phone}
                </>
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--d-muted-2, #64748b)",
                textTransform: "uppercase",
                fontWeight: 800,
                letterSpacing: 0.6,
                marginBottom: 6,
              }}
            >
              Invoice Details
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--d-text, #334155)",
                lineHeight: 1.8,
              }}
            >
              <div>
                <strong>Invoice #:</strong> {payment.invoiceNumber}
              </div>
              <div>
                <strong>Reference:</strong> {payment.referenceNumber || "—"}
              </div>
              <div>
                <strong>Date:</strong> {formatDateTime(payment.createdAt)}
              </div>
              {payment.paidAt && (
                <div>
                  <strong>Paid:</strong> {formatDateTime(payment.paidAt)}
                </div>
              )}
              <div>
                <strong>Method:</strong>{" "}
                {getPaymentMethodLabel(payment.method)}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 24 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--d-bg, #f6f8f9)",
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "var(--d-muted-2, #64748b)",
                    borderRadius: "10px 0 0 10px",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "var(--d-muted-2, #64748b)",
                  }}
                >
                  Duration
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "var(--d-muted-2, #64748b)",
                    borderRadius: "0 10px 10px 0",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "18px 16px",
                    borderBottom: "1px solid var(--d-border-2, #f1f5f7)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--d-dark, #0b1f18)",
                      marginBottom: 4,
                    }}
                  >
                    {payment.plan?.name} Plan Subscription
                  </div>
                  {payment.plan?.description && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--d-muted-2, #64748b)",
                      }}
                    >
                      {payment.plan.description}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "18px 16px",
                    textAlign: "right",
                    fontSize: 13,
                    color: "var(--d-text, #334155)",
                    borderBottom: "1px solid var(--d-border-2, #f1f5f7)",
                  }}
                >
                  {payment.duration} days
                </td>
                <td
                  style={{
                    padding: "18px 16px",
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--d-dark, #0b1f18)",
                    borderBottom: "1px solid var(--d-border-2, #f1f5f7)",
                  }}
                >
                  {formatCurrency(payment.originalAmount, payment.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ width: "100%", maxWidth: 320 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                fontSize: 13,
                color: "var(--d-text, #334155)",
              }}
            >
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>
                {formatCurrency(payment.originalAmount, payment.currency)}
              </span>
            </div>

            {hasDiscount && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  fontSize: 13,
                  color: "var(--d-primary, #0f9e6e)",
                }}
              >
                <span>
                  <i className="fas fa-tag me-1"></i>
                  Discount
                  {payment.coupon && (
                    <span
                      style={{
                        marginLeft: 6,
                        padding: "2px 8px",
                        borderRadius: 50,
                        background: "var(--d-primary-light, #e6faf1)",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {payment.coupon.code}
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: 700 }}>
                  −{formatCurrency(payment.discountAmount, payment.currency)}
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                fontSize: 16,
                fontWeight: 800,
                color: "var(--d-dark, #0b1f18)",
                borderTop: "2px solid var(--d-dark, #0b1f18)",
                marginTop: 6,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(payment.amount, payment.currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid var(--d-border-2, #f1f5f7)",
            textAlign: "center",
            fontSize: 12,
            color: "var(--d-muted-2, #64748b)",
            lineHeight: 1.7,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            Thank you for your business!
          </div>
          <div>
            For any questions about this invoice, contact{" "}
            <a
              href="mailto:support@foodtradehub.com"
              style={{
                color: "var(--d-primary, #0f9e6e)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              support@foodtradehub.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}