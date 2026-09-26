// src/components/admin/ProductApprovalButtons.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ProductApprovalButtons({ product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const handleAction = async (action, note = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionNote: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success(data.message);
      router.refresh();
      setShowRejectModal(false);
      setRejectNote("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {product.status === "PENDING" && (
        <>
          <button
            onClick={() => handleAction("approve")}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--green2), var(--green))",
              color: "white",
              border: 0,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 6px 16px rgba(19,121,91,0.25)",
            }}
          >
            <i className="fa-solid fa-check"></i> Approve
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="fa-solid fa-times"></i> Reject
          </button>
        </>
      )}

      {product.status === "APPROVED" && (
        <button
          onClick={() => handleAction("reject", "Suspended by admin")}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-ban"></i> Suspend
        </button>
      )}

      {product.status === "REJECTED" && (
        <button
          onClick={() => handleAction("approve")}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--green2), var(--green))",
            color: "white",
            border: 0,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-check"></i> Re-approve
        </button>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          onClick={() => setShowRejectModal(false)}
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
              Reject this product?
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Provide a reason. The supplier will see this message.
            </p>

            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g., Missing certifications, poor image quality..."
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

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRejectModal(false)}
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
                onClick={() => handleAction("reject", rejectNote)}
                disabled={loading || !rejectNote.trim()}
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
                {loading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}