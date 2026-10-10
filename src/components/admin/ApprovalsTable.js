// src/components/admin/ApprovalsTable.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { PRODUCT_PLACEHOLDER } from "@/lib/imageHelpers";

export default function ApprovalsTable({ products, requests }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("products");
  const [loadingId, setLoadingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    type: null,
    id: null,
  });
  const [rejectNote, setRejectNote] = useState("");

  const handleAction = async (type, id, action, note = "") => {
    setLoadingId(id);
    try {
      const url =
        type === "product"
          ? `/api/admin/products/${id}/approve`
          : `/api/admin/requests/${id}/approve`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionNote: note }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");

      toast.success(data.message);
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingId(null);
      setRejectModal({ open: false, type: null, id: null });
      setRejectNote("");
    }
  };

  const openRejectModal = (type, id) => {
    setRejectModal({ open: true, type, id });
    setRejectNote("");
  };

  const tabs = [
    { id: "products", label: `Products (${products.length})` },
    { id: "requests", label: `Requests (${requests.length})` },
  ];

  return (
    <>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              borderRadius: 50,
              border: "1px solid var(--line)",
              background: activeTab === tab.id ? "var(--green2)" : "#fff",
              color: activeTab === tab.id ? "white" : "var(--text)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== Products Tab ====== */}
      {activeTab === "products" && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--muted)",
                      }}
                    >
                      <i
                        className="fa-solid fa-check-circle"
                        style={{
                          fontSize: 32,
                          color: "#4ade80",
                          marginBottom: 8,
                          display: "block",
                        }}
                      ></i>
                      No pending products.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-person">
                          <img
                            src={
                              p.images?.[0] ||
                              PRODUCT_PLACEHOLDER
                            }
                            style={{ borderRadius: 8 }}
                          />
                          <div>
                            <b>{p.name}</b>
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--muted)",
                              }}
                            >
                              #{p.productNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/admin/users/${p.user.id}`}
                          style={{
                            color: "var(--green2)",
                            fontWeight: 600,
                          }}
                        >
                          {p.user.companyName || p.user.name}
                        </Link>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <b>${p.price}</b>/{p.unit}
                      </td>
                      <td>
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* ✅ View details button (links to the details page) */}
                          <Link
                            href={`/admin/products/${p.id}`}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "var(--bg)",
                              color: "var(--green2)",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="View Full Details"
                          >
                            <i className="fa-solid fa-eye"></i> Review
                          </Link>

                          {/* ✅ Quick approve */}
                          <button
                            onClick={() => handleAction("product", p.id, "approve")}
                            disabled={loadingId === p.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#e2f5ea",
                              color: "#12885f",
                              border: 0,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Quick Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>

                          {/* ✅ Quick reject */}
                          <button
                            onClick={() => openRejectModal("product", p.id)}
                            disabled={loadingId === p.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#fde8e5",
                              color: "#e75e5e",
                              border: 0,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====== Requests Tab ====== */}
      {activeTab === "requests" && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Buyer</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--muted)",
                      }}
                    >
                      <i
                        className="fa-solid fa-check-circle"
                        style={{
                          fontSize: 32,
                          color: "#4ade80",
                          marginBottom: 8,
                          display: "block",
                        }}
                      ></i>
                      No pending requests.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div>
                          <b>{r.title}</b>
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              display: "block",
                            }}
                          >
                            #{r.requestNumber}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/admin/users/${r.user.id}`}
                          style={{
                            color: "var(--green2)",
                            fontWeight: 600,
                          }}
                        >
                          {r.user.companyName || r.user.name}
                        </Link>
                      </td>
                      <td>{r.category}</td>
                      <td>
                        {r.quantity} {r.unit}
                      </td>
                      <td>
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* ✅ View details button */}
                          <Link
                            href={`/admin/requests/${r.id}`}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "var(--bg)",
                              color: "var(--green2)",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="View Full Details"
                          >
                            <i className="fa-solid fa-eye"></i> Review
                          </Link>

                          {/* ✅ Quick approve */}
                          <button
                            onClick={() =>
                              handleAction("request", r.id, "approve")
                            }
                            disabled={loadingId === r.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#e2f5ea",
                              color: "#12885f",
                              border: 0,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Quick Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>

                          {/* ✅ Quick reject */}
                          <button
                            onClick={() => openRejectModal("request", r.id)}
                            disabled={loadingId === r.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#fde8e5",
                              color: "#e75e5e",
                              border: 0,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====== Reject Modal ====== */}
      {rejectModal.open && (
        <div
          onClick={() =>
            setRejectModal({ open: false, type: null, id: null })
          }
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 20,
              padding: 28,
              maxWidth: 420,
              width: "100%",
            }}
          >
            <h3
              style={{
                font: "800 16px Manrope",
                marginBottom: 8,
                color: "#13251f",
              }}
            >
              Reject this {rejectModal.type === "product" ? "product" : "request"}?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              Please provide a reason. The user will see this message.
            </p>

            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g., Missing required certifications, poor image quality..."
              rows={4}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                marginBottom: 16,
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() =>
                  setRejectModal({ open: false, type: null, id: null })
                }
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(
                    rejectModal.type,
                    rejectModal.id,
                    "reject",
                    rejectNote
                  )
                }
                disabled={loadingId || !rejectNote.trim()}
                style={{
                  padding: "10px 18px",
                  background: "linear-gradient(135deg, #e75e5e, #c0392b)",
                  color: "white",
                  border: 0,
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: !rejectNote.trim() ? 0.6 : 1,
                }}
              >
                {loadingId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}