// src/app/dashboard/billing/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BillingStats from "@/components/dashboard/BillingStats";
import BillingFilters from "@/components/dashboard/BillingFilters";
import PaymentRow from "@/components/dashboard/PaymentRow";
import CurrentSubscriptionCard from "@/components/dashboard/CurrentSubscriptionCard";
import { getUserActivePlan } from "@/lib/planService";

export const metadata = { title: "Billing | Dashboard" };

export default async function BillingPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const {
    status = "all",
    search = "",
    page: pageParam = 1,
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  // ====== Active subscription status ======
  const { plan, subscription } = await getUserActivePlan(userId);

  // ====== Payment filters ======
  const where = { userId };
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { referenceNumber: { contains: search } },
    ];
  }

  const [payments, totalCount, totalPaidAgg] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        plan: { select: { id: true, name: true } },
        coupon: { select: { code: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { userId, status: "paid" },
      _sum: { amount: true },
    }),
  ]);

  const totalPaid = Number(totalPaidAgg._sum.amount || 0);
  const totalPages = Math.ceil(totalCount / limit);

  // ====== Remaining days ======
  const daysRemaining = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.endDate) - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3"
      >
        <div>
          <h1
            className="fw-bold mb-0"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 24,
              color: "var(--d-dark, #0b1f18)",
            }}
          >
            <i
              className="fas fa-credit-card me-2"
              style={{ color: "var(--d-primary, #0f9e6e)" }}
            ></i>
            Billing & Payments
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Manage your subscription and payment history
          </p>
        </div>
        <Link href="/plans" className="btn-upgrade">
          <i className="fas fa-crown"></i> View Plans
        </Link>
      </div>

      {/* Stats */}
      <BillingStats
        totalPaid={totalPaid}
        invoiceCount={totalCount}
        planName={plan?.name || "Basic"}
        daysRemaining={daysRemaining}
      />

      {/* Current subscription */}
      <CurrentSubscriptionCard
        subscription={subscription}
        planName={plan?.name || "Basic"}
      />

      {/* Filters */}
      <BillingFilters currentStatus={status} currentSearch={search} />

      {/* Payments List */}
      {payments.length > 0 ? (
        <div
          className="d-card"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--d-border-2, #f1f5f7)",
              background: "var(--d-bg, #f6f8f9)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "var(--d-dark, #0b1f18)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Payment History ({totalCount})
            </div>
            {search && (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--d-muted-2, #64748b)",
                }}
              >
                Filtered by: <strong>&quot;{search}&quot;</strong>
              </span>
            )}
          </div>

          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </div>
      ) : (
        <div
          className="d-card"
          style={{
            padding: 60,
            textAlign: "center",
            color: "var(--d-muted, #94a3b8)",
          }}
        >
          <i
            className="fas fa-receipt"
            style={{
              fontSize: 44,
              opacity: 0.3,
              display: "block",
              marginBottom: 14,
            }}
          ></i>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--d-dark, #0b1f18)",
              marginBottom: 6,
            }}
          >
            {search || status !== "all"
              ? "No payments found"
              : "No payments yet"}
          </h3>
          <p style={{ fontSize: 13, marginBottom: 20 }}>
            {search || status !== "all"
              ? "Try changing your filters."
              : "Your payment history will appear here once you subscribe."}
          </p>
          <Link href="/plans" className="btn-upgrade">
            <i className="fas fa-crown"></i> Browse Plans
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 24,
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {page > 1 && (
            <Link
              href={`/dashboard/billing?status=${status}&search=${search}&page=${page - 1}`}
              style={paginationBtnStyle}
            >
              <i className="fas fa-chevron-left"></i>
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + 1;
            const isActive = p === page;
            return (
              <Link
                key={p}
                href={`/dashboard/billing?status=${status}&search=${search}&page=${p}`}
                style={{
                  ...paginationBtnStyle,
                  background: isActive
                    ? "var(--d-primary, #0f9e6e)"
                    : "white",
                  color: isActive ? "white" : "var(--d-text, #334155)",
                  borderColor: isActive
                    ? "var(--d-primary, #0f9e6e)"
                    : "var(--d-border, #e8edf0)",
                }}
              >
                {p}
              </Link>
            );
          })}
          {page < totalPages && (
            <Link
              href={`/dashboard/billing?status=${status}&search=${search}&page=${page + 1}`}
              style={paginationBtnStyle}
            >
              <i className="fas fa-chevron-right"></i>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const paginationBtnStyle = {
  minWidth: 38,
  height: 38,
  padding: "0 12px",
  borderRadius: 8,
  background: "white",
  border: "1px solid var(--d-border, #e8edf0)",
  color: "var(--d-text, #334155)",
  fontWeight: 600,
  fontSize: 13,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};