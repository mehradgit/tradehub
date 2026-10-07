// src/app/admin/payments/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminPaymentStats from "@/components/admin/AdminPaymentStats";
import AdminPaymentsFilter from "@/components/admin/AdminPaymentsFilter";
import {
  getPaymentStatusBadge,
  formatCurrency,
  formatDate,
} from "@/utils/invoiceHelpers";
import SafeImage from "@/components/ui/SafeImage";

export const metadata = { title: "Payments | Admin" };

export default async function AdminPaymentsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    status = "",
    planId = "",
    search = "",
    page: pageParam = 1,
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (planId) where.planId = planId;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { referenceNumber: { contains: search } },
      { user: { email: { contains: search } } },
      { user: { name: { contains: search } } },
      { user: { companyName: { contains: search } } },
    ];
  }

  const [payments, totalCount, plans, stats] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            country: true,
            countryCode: true,
            image: true,
          },
        },
        plan: { select: { id: true, name: true } },
        coupon: { select: { code: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.plan.findMany({
      select: { id: true, name: true },
      orderBy: { maxProducts: "asc" },
    }),
    Promise.all([
      prisma.payment.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: "paid" } }),
      prisma.payment.count({ where: { status: "pending" } }),
      prisma.payment.count({ where: { status: "failed" } }),
    ]),
  ]);

  const [revenueAgg, paidCount, pendingCount, failedCount] = stats;
  const totalPages = Math.ceil(totalCount / limit);

  const statData = {
    totalRevenue: Number(revenueAgg._sum.amount || 0),
    paidCount,
    pendingCount,
    failedCount,
  };

  return (
    <>
      <AdminPageHeader
        title="Payments Management"
        subtitle={`${totalCount} total payments · $${statData.totalRevenue.toLocaleString()} revenue`}
        action={
          <Link
            href="/admin/payments/new"
            style={{
              background: "var(--green2)",
              color: "white",
              border: 0,
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="fa-solid fa-plus"></i>
            Add Payment
          </Link>
        }
      />

      {/* Stats */}
      <AdminPaymentStats stats={statData} />

      {/* Filters */}
      <AdminPaymentsFilter plans={plans} />

      {/* Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>User</th>
                <th>Plan</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--muted)",
                    }}
                  >
                    <i
                      className="fa-solid fa-receipt"
                      style={{
                        fontSize: 32,
                        display: "block",
                        marginBottom: 10,
                        opacity: 0.4,
                      }}
                    ></i>
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const badge = getPaymentStatusBadge(payment.status);
                  return (
                    <tr key={payment.id}>
                      <td>
                        <div>
                          <b style={{ fontSize: 12 }}>
                            {payment.invoiceNumber}
                          </b>
                          {payment.referenceNumber && (
                            <span
                              style={{
                                display: "block",
                                fontSize: 10,
                                color: "var(--muted)",
                                marginTop: 2,
                              }}
                            >
                              {payment.referenceNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-person">
                          {payment.user?.image ? (
                            <SafeImage
                              src={payment.user.image}
                              alt={payment.user.name}
                              fallbackType="avatar"
                              style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div className="avatar-letter">{(
                              payment.user?.companyName ||
                              payment.user?.name ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}</div>
                          )}
                          <div>
                            <b>
                              {payment.user?.companyName ||
                                payment.user?.name ||
                                "Unknown"}
                            </b>
                            <span>{payment.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-pill ${payment.plan?.name === "Gold"
                              ? "premium"
                              : payment.plan?.name === "Basic"
                                ? "basic"
                                : "active"
                            }`}
                        >
                          {payment.plan?.name || "—"}
                        </span>
                      </td>
                      <td>{payment.duration} days</td>
                      <td>
                        <div>
                          <b style={{ fontSize: 12 }}>
                            {formatCurrency(payment.amount, payment.currency)}
                          </b>
                          {Number(payment.discountAmount) > 0 && (
                            <span
                              style={{
                                display: "block",
                                fontSize: 10,
                                color: "var(--muted)",
                                textDecoration: "line-through",
                              }}
                            >
                              {formatCurrency(
                                payment.originalAmount,
                                payment.currency
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 11px",
                            borderRadius: 50,
                            background: badge.bg,
                            color: badge.color,
                            fontSize: 10,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i
                            className={`fas ${badge.icon}`}
                            style={{ fontSize: 10 }}
                          ></i>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {formatDate(payment.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Link
                            href={`/admin/payments/${payment.id}`}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: "var(--bg)",
                              color: "var(--green2)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                            }}
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination currentPage={page} totalPages={totalPages} />
      </div>
    </>
  );
}