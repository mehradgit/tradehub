// src/app/admin/users/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function AdminUserDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      products: {
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          unit: true,
          images: true,
          isVisible: true,
          productNumber: true,
          slug: true,
        },
      },
      buyingRequests: {
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          quantity: true,
          unit: true,
          isUrgent: true,
          isVisible: true,
          requestNumber: true,
          slug: true,
          createdAt: true,
        },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        include: { plan: true },
      },
      _count: {
        select: {
          products: true,
          buyingRequests: true,
          productInquiriesAsBuyer: true,
          productInquiriesAsSupplier: true,
          sentMessages: true,
          receivedMessages: true,
          savedProducts: true,
          savedRequests: true,
        },
      },
    },
  });

  if (!user) notFound();

  const displayName = user.companyName || user.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSupplier = user.role === "SUPPLIER";

  return (
    <>
      {/* Back Link */}
      <Link
        href="/admin/users"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--green2)",
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        <i className="fa-solid fa-arrow-left"></i> Back to Users
      </Link>

      {/* Profile Header */}
      <div
        className="admin-card"
        style={{
          padding: "24px",
          marginBottom: 16,
          background: "linear-gradient(120deg, #0a2a21 0%, #0d5c47 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {user.image ? (
            <img
              src={user.image}
              alt={displayName}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.3)",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "grid", placeItems: "center",
                fontSize: 28, fontWeight: 800,
                border: "3px solid rgba(255,255,255,0.3)",
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ color: "white", font: "800 22px Manrope", margin: 0 }}>
              {displayName}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "4px 0" }}>
              {user.email}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span className="admin-pill" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                {isSupplier ? "Supplier" : "Buyer"}
              </span>
              <span className="admin-pill" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                {user.plan}
              </span>
              <span className="admin-pill" style={{ background: user.registrationComplete ? "#4ade80" : "#fbbf24", color: "#0a2a21" }}>
                {user.registrationComplete ? "Active" : "Pending"}
              </span>
              {user.countryCode && (
                <span className="admin-pill" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                  <img
                    src={`https://flagcdn.com/w20/${user.countryCode.toLowerCase()}.png`}
                    style={{ width: 14, marginRight: 5, verticalAlign: "middle" }}
                  />
                  {user.country}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.1)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              <i className="fa-solid fa-pen"></i> Edit
            </button>
            <button style={{
              padding: "10px 16px", borderRadius: 10, border: 0,
              background: "#e75e5e", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              <i className="fa-solid fa-ban"></i> Suspend
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-kpis" style={{ marginBottom: 16 }}>
        <div className="admin-kpi">
          <div className="admin-kpi-icon green-bg"><i className="fa-solid fa-box"></i></div>
          <h4>Products</h4>
          <strong>{user._count.products}</strong>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-icon blue-bg"><i className="fa-solid fa-shopping-cart"></i></div>
          <h4>Requests</h4>
          <strong>{user._count.buyingRequests}</strong>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-icon orange-bg"><i className="fa-solid fa-envelope"></i></div>
          <h4>Inquiries</h4>
          <strong>{user._count.productInquiriesAsBuyer + user._count.productInquiriesAsSupplier}</strong>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-icon purple-bg"><i className="fa-solid fa-comments"></i></div>
          <h4>Messages</h4>
          <strong>{user._count.sentMessages + user._count.receivedMessages}</strong>
        </div>
      </div>

      {/* Recent Products */}
      {isSupplier && user.products.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-card-head">
            <div className="admin-title">Recent Products</div>
            <Link href={`/admin/products?supplierId=${user.id}`} className="admin-view">View all</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {user.products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-person">
                        <img src={p.images?.[0] || "https://via.placeholder.com/40"} style={{ borderRadius: 8 }} />
                        <b>{p.name}</b>
                      </div>
                    </td>
                    <td><b>${p.price}</b>/{p.unit}</td>
                    <td>
                      <span className={`admin-pill ${p.isVisible ? "active" : "basic"}`}>
                        {p.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Requests */}
      {!isSupplier && user.buyingRequests.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-card-head">
            <div className="admin-title">Recent Buying Requests</div>
            <Link href={`/admin/requests?buyerId=${user.id}`} className="admin-view">View all</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {user.buyingRequests.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.title}</b></td>
                    <td>{r.category}</td>
                    <td>{r.quantity} {r.unit}</td>
                    <td>
                      {r.isUrgent ? (
                        <span className="admin-pill" style={{ background: "#fde8e5", color: "#e75e5e" }}>Urgent</span>
                      ) : (
                        <span className="admin-pill active">Open</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscriptions */}
      <div className="admin-card">
        <div className="admin-card-head">
          <div className="admin-title">Subscription History</div>
        </div>
        {user.subscriptions.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", padding: 20 }}>
            No subscriptions yet.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {user.subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.plan?.name}</b></td>
                    <td>{new Date(s.startDate).toLocaleDateString()}</td>
                    <td>{new Date(s.endDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`admin-pill ${
                        s.status === "active" ? "active" :
                        s.status === "reserved" ? "pending" :
                        s.status === "cancelled" ? "suspended" : "basic"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}