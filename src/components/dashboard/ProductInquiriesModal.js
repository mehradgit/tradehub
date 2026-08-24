// src/components/dashboard/ProductInquiriesModal.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function ProductInquiriesModal({ isOpen, onClose, productId }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      fetchInquiries();
    }
  }, [isOpen, productId]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/inquiries`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load inquiries");
      setInquiries(data.inquiries);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "bg-warning text-dark",
      responded: "bg-info text-white",
      accepted: "bg-success text-white",
      rejected: "bg-danger text-white",
    };
    return map[status] || "bg-secondary text-white";
  };

  if (!isOpen) return null;

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
          maxWidth: "800px",
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
          }}
        >
          <i className="fas fa-times"></i>
        </button>

        <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px", color: "var(--black)" }}>
          Inquiries for this Product
        </h3>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-muted" style={{ fontSize: "14px", padding: "20px 0" }}>
            No inquiries yet.
          </div>
        ) : (
          <div className="inquiries-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {inquiries.map((inquiry) => {
              const buyer = inquiry.user;
              const buyerName = buyer?.companyName || buyer?.name || "Unknown Buyer";
              const buyerId = buyer?.id;

              return (
                <div
                  key={inquiry.id}
                  style={{
                    border: "1px solid var(--gray-light)",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "var(--light)",
                  }}
                >
                  {/* ====== هدر: نام خریدار + دکمه پیام ====== */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      {buyerId ? (
                        <Link
                          href={`/profile/${buyerId}`}
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "var(--primary)",
                            textDecoration: "none",
                          }}
                          className="text-decoration-none"
                          target="_blank"
                        >
                          {buyerName}
                        </Link>
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--black)" }}>
                          {buyerName}
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "4px" }}>
                        {buyer?.email} • {buyer?.phone || "—"}
                      </div>
                    </div>

                    {/* ✅ دکمه پیام‌رسانی */}
                    {buyerId && (
                      <Link
                        href={`/dashboard/messages?userId=${buyerId}`}
                        style={{
                          padding: "6px 12px",
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s ease",
                        }}
                        className="text-decoration-none"
                        target="_blank"
                      >
                        <i className="fas fa-envelope"></i> Message
                      </Link>
                    )}
                  </div>

                  {/* ====== جزئیات درخواست ====== */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginTop: "12px",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--gray)" }}>Quantity:</span>{" "}
                      <span style={{ fontWeight: 600 }}>{inquiry.quantity || "—"}</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--gray)" }}>Requested Price:</span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {inquiry.requestedPrice ? `$${inquiry.requestedPrice}` : "—"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--gray)" }}>Status:</span>{" "}
                      <span
                        className={`badge ${getStatusBadge(inquiry.status)}`}
                        style={{ fontSize: "12px", fontWeight: 700 }}
                      >
                        {inquiry.status}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--gray)" }}>Date:</span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* ====== پیام ====== */}
                  {inquiry.message && (
                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--gray-light)", paddingTop: "12px" }}>
                      <div style={{ fontSize: "12px", color: "var(--gray)", fontWeight: 600, marginBottom: "4px" }}>
                        Message:
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--gray-dark)", whiteSpace: "pre-wrap" }}>
                        {inquiry.message}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}