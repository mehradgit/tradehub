// src/components/admin/SubscriptionsTable.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function SubscriptionsTable({ subscriptions }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);

  const handleAction = async (id, action, days = 0) => {
    if (action === "cancel" && !confirm("Are you sure you want to cancel this subscription?")) {
      return;
    }

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, days }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Updated successfully");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (error) {
      toast.error("Failed to update subscription");
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { cls: "active", label: "Active" },
      reserved: { cls: "pending", label: "Reserved" },
      ended: { cls: "basic", label: "Ended" },
      cancelled: { cls: "suspended", label: "Cancelled" },
    };
    const s = map[status] || { cls: "basic", label: status };
    return <span className={`admin-pill ${s.cls}`}>{s.label}</span>;
  };

  if (subscriptions.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
        <i className="fa-solid fa-crown" style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}></i>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>No subscriptions found.</p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const days = Math.ceil(
                (new Date(sub.endDate) - new Date(sub.startDate)) / (1000 * 60 * 60 * 24)
              );
              const isLoading = loadingId === sub.id;

              return (
                <tr key={sub.id}>
                  <td>
                    <Link
                      href={`/admin/users/${sub.user.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div className="avatar-letter">
                        {(sub.user.companyName || sub.user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <b style={{ fontSize: 12, color: "var(--text)", display: "block" }}>
                          {sub.user.companyName || sub.user.name || "Unknown"}
                        </b>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                          {sub.user.email}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <span className={`admin-pill ${
                      sub.plan?.name === "Gold" ? "premium" :
                      sub.plan?.name === "Basic" ? "basic" : "active"
                    }`}>
                      {sub.plan?.name || "—"}
                    </span>
                  </td>
                  <td>
                    {new Date(sub.startDate).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td>
                    {new Date(sub.endDate).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {days} days
                    </span>
                  </td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {sub.status === "active" && (
                        <>
                          <button
                            onClick={() => handleAction(sub.id, "extend", 30)}
                            disabled={isLoading}
                            style={{
                              padding: "6px 10px",
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 7,
                              border: 0,
                              background: "#e2f5ea",
                              color: "#12885f",
                              cursor: "pointer",
                            }}
                            title="Extend 30 days"
                          >
                            <i className="fa-solid fa-plus"></i> 30d
                          </button>
                          <button
                            onClick={() => handleAction(sub.id, "cancel")}
                            disabled={isLoading}
                            style={{
                              padding: "6px 10px",
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 7,
                              border: 0,
                              background: "#fde8e5",
                              color: "#e75e5e",
                              cursor: "pointer",
                            }}
                            title="Cancel"
                          >
                            <i className="fa-solid fa-ban"></i>
                          </button>
                        </>
                      )}
                      {sub.status === "reserved" && (
                        <button
                          onClick={() => handleAction(sub.id, "cancel")}
                          disabled={isLoading}
                          style={{
                            padding: "6px 10px",
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 7,
                            border: 0,
                            background: "#fff0d3",
                            color: "#c8891b",
                            cursor: "pointer",
                          }}
                        >
                          Cancel Reservation
                        </button>
                      )}
                      {(sub.status === "ended" || sub.status === "cancelled") && (
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                          No actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}