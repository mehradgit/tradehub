// src/app/admin/plans/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export const metadata = { title: "Plans | Admin" };

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const plans = await prisma.plan.findMany({
    include: {
      prices: { orderBy: { duration: "asc" } },
      _count: {
        select: { subscriptions: true },
      },
    },
    orderBy: { maxProducts: "asc" },
  });

  const subscriptionCounts = await prisma.userSubscription.groupBy({
    by: ["planId", "status"],
    _count: true,
  });

  const activeCountMap = {};
  subscriptionCounts.forEach((s) => {
    if (s.status === "active") {
      activeCountMap[s.planId] = (activeCountMap[s.planId] || 0) + s._count;
    }
  });

  const totalActive = Object.values(activeCountMap).reduce((a, b) => a + b, 0);

  return (
    <>
      <AdminPageHeader
        title="Plans Management"
        subtitle={`${plans.length} plans · ${totalActive} active subscriptions`}
        action={
          <Link
            href="/admin/plans/new"
            style={{
              background: "var(--green2)",
              color: "white",
              border: 0,
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
            New Plan
          </Link>
        }
      />

      {/* Plans Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {plans.map((plan) => {
          const isPopular = plan.name === "Silver";
          const isGold = plan.name === "Gold";
          const activeSubs = activeCountMap[plan.id] || 0;
          const price6 = plan.prices.find((p) => p.duration === 180);
          const price12 = plan.prices.find((p) => p.duration === 360);

          return (
            <div
              key={plan.id}
              className="admin-card"
              style={{
                position: "relative",
                borderTop: isGold
                  ? "3px solid #fbbf24"
                  : isPopular
                  ? "3px solid var(--green2)"
                  : "3px solid #e4ebe7",
              }}
            >
              {isPopular && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: "linear-gradient(135deg, var(--green2), var(--green))",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 50,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Most Popular
                </div>
              )}

              {isGold && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 50,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  <i className="fa-solid fa-crown"></i> Gold
                </div>
              )}

              <div className="admin-card-head">
                <div>
                  <div className="admin-title" style={{ fontSize: 18 }}>
                    {plan.name}
                  </div>
                  <div className="admin-subtitle">
                    {activeSubs} active subscription{activeSubs !== 1 ? "s" : ""}
                  </div>
                </div>
                <Link
                  href={`/admin/plans/${plan.id}`}
                  style={{
                    width: 32, height: 32,
                    borderRadius: 8,
                    background: "var(--bg)",
                    color: "var(--muted)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                  }}
                  title="Edit plan"
                >
                  <i className="fa-solid fa-pen"></i>
                </Link>
              </div>

              {/* Prices */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    background: "var(--bg)",
                    padding: 12,
                    borderRadius: 10,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
                    6 Months
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--green2)" }}>
                    ${price6 ? Number(price6.price) : 0}
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--bg)",
                    padding: 12,
                    borderRadius: 10,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
                    12 Months
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--green2)" }}>
                    ${price12 ? Number(price12.price) : 0}
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Limits
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--muted)" }}>
                      <i className="fa-solid fa-box" style={{ width: 16, color: "var(--green2)" }}></i>
                      Products
                    </span>
                    <b style={{ color: "var(--text)" }}>
                      {plan.maxProducts === -1 ? "∞" : plan.maxProducts}
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--muted)" }}>
                      <i className="fa-solid fa-images" style={{ width: 16, color: "var(--green2)" }}></i>
                      Images/Product
                    </span>
                    <b style={{ color: "var(--text)" }}>
                      {plan.maxImagesPerProduct === -1 ? "∞" : plan.maxImagesPerProduct}
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--muted)" }}>
                      <i className="fa-solid fa-shopping-cart" style={{ width: 16, color: "var(--green2)" }}></i>
                      Requests/Month
                    </span>
                    <b style={{ color: "var(--text)" }}>
                      {plan.maxRequestsPerMonth === -1 ? "∞" : plan.maxRequestsPerMonth}
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--muted)" }}>
                      <i className="fa-solid fa-envelope" style={{ width: 16, color: "var(--green2)" }}></i>
                      Inquiries/Month
                    </span>
                    <b style={{ color: "var(--text)" }}>
                      {plan.maxInquiriesPerMonth === -1 ? "∞" : plan.maxInquiriesPerMonth}
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--muted)" }}>
                      <i className="fa-solid fa-file-signature" style={{ width: 16, color: "var(--green2)" }}></i>
                      Quotes/Month
                    </span>
                    <b style={{ color: "var(--text)" }}>
                      {plan.maxQuotesPerMonth === -1 ? "∞" : plan.maxQuotesPerMonth}
                    </b>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span className={`admin-pill ${plan.isActive ? "active" : "basic"}`}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/admin/plans/${plan.id}`}
                  style={{
                    fontSize: 11,
                    color: "var(--green2)",
                    fontWeight: 700,
                  }}
                >
                  Edit Plan <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}