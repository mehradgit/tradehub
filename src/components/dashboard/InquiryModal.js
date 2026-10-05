// src/components/dashboard/InquiryModal.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function InquiryModal({ isOpen, onClose, inquiry, tab, onMarkRead }) {
  const [loading, setLoading] = useState(false);

  // ====== Mark the inquiry as read ======
  useEffect(() => {
    if (isOpen && inquiry && !inquiry.read) {
      const markAsRead = async () => {
        try {
          const res = await fetch(`/api/product-inquiries/${inquiry.id}/read`, {
            method: "PATCH",
          });
          if (res.ok && onMarkRead) {
            onMarkRead(); // Notify the parent so it can refresh
          }
        } catch (error) {
          console.error("Failed to mark as read:", error);
        }
      };
      markAsRead();
    }
  }, [isOpen, inquiry, onMarkRead]);

  if (!isOpen || !inquiry) return null;
  
  // ====== Determine the other party based on the tab ======
  const otherParty = tab === "buyer" ? inquiry.supplier : inquiry.user;
  const otherPartyName = otherParty?.companyName || otherParty?.name || "Unknown";
  const otherPartyId = otherParty?.id;

  const getStatusBadgeClass = (status) => {
    const map = {
      pending: "bg-warning text-dark",
      responded: "bg-info text-white",
      accepted: "bg-success text-white",
      rejected: "bg-danger text-white",
    };
    return map[status] || "bg-secondary text-white";
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            fontSize: "20px",
            background: "none",
            border: "none",
            color: "var(--gray)",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.color = "var(--black)")}
          onMouseLeave={(e) => (e.target.style.color = "var(--gray)")}
        >
          <i className="fas fa-times"></i>
        </button>

        <div style={{ marginBottom: "20px" }}>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--black)",
              margin: "0 0 4px 0",
            }}
          >
            {inquiry.product?.name || "Product"}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--gray)", margin: "0" }}>
            <strong>From:</strong> {otherPartyName}{" "}
            <span
              style={{
                fontSize: "10px",
                background: "var(--light)",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              {tab === "buyer" ? "Supplier" : "Buyer"}
            </span>
          </p>
        </div>

        {/* ====== Contact information ====== */}
        <div
          style={{
            background: "var(--light)",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Name
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {otherParty?.name || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Email
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {otherParty?.email || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Phone
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {otherParty?.phone || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Company
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {otherParty?.companyName || "—"}
            </div>
          </div>
        </div>

        {/* ====== Inquiry details ====== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "16px",
            background: "var(--light)",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Quantity
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {inquiry.quantity || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Requested Price
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {inquiry.requestedPrice ? `$${inquiry.requestedPrice}` : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Status
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              <span className={`badge ${getStatusBadgeClass(inquiry.status)}`} style={{ fontSize: "12px" }}>
                {inquiry.status}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 600, textTransform: "uppercase" }}>
              Date
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)" }}>
              {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* ====== Message ====== */}
        <div
          style={{
            borderTop: "1px solid var(--gray-light)",
            paddingTop: "16px",
            marginBottom: "16px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--gray)",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            Message
          </label>
          <div
            style={{
              background: "var(--light)",
              padding: "16px",
              borderRadius: "12px",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "var(--gray-dark)",
              whiteSpace: "pre-wrap",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {inquiry.message || "No message provided."}
          </div>
        </div>

        {/* ====== Buttons ====== */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            borderTop: "1px solid var(--gray-light)",
            paddingTop: "16px",
          }}
        >
          {otherPartyId && (
            <Link
              href={`/dashboard/messages?userId=${otherPartyId}`}
              style={{
                padding: "10px 24px",
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              className="text-decoration-none"
              target="_blank"
            >
              <i className="fas fa-envelope"></i> Message
            </Link>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "transparent",
              border: "1px solid var(--gray-light)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--gray-dark)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--primary)";
              e.target.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "var(--gray-light)";
              e.target.style.color = "var(--gray-dark)";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}