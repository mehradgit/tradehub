// src/components/dashboard/InquiryListItem.js
"use client";

import { useState } from "react";
import Link from "next/link";
import InquiryModal from "./InquiryModal";

export default function InquiryListItem({ inquiry, tab }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [read, setRead] = useState(inquiry.read); // ✅ استیت محلی

  // ====== کالبک برای به‌روزرسانی استیت پس از خوانده‌شدن ======
  const handleMarkRead = () => {
    setRead(true);
  };

  const otherParty = tab === "buyer" ? inquiry.supplier : inquiry.user;
  const otherPartyName = otherParty?.companyName || otherParty?.name || "Unknown";
  const otherPartyId = otherParty?.id;
  const isNew = !read; // ✅ استفاده از استیت محلی

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-warning text-dark",
      responded: "bg-info text-white",
      accepted: "bg-success text-white",
      rejected: "bg-danger text-white",
    };
    return colors[status] || "bg-secondary text-white";
  };

  return (
    <>
      <div
        style={{
          background: isNew ? "var(--primary-light)" : "white",
          border: isNew ? "1px solid var(--primary)" : "1px solid var(--gray-light)",
          borderLeft: isNew ? "4px solid var(--primary)" : "1px solid var(--gray-light)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "all 0.2s ease",
          boxShadow: "var(--shadow)",
        }}
        className="hover-shadow"
      >
        {/* هدر: نام محصول + وضعیت + نشان "New" */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link
                href={`/products/${inquiry.product.id}`}
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--primary)",
                  textDecoration: "none",
                }}
                className="text-decoration-none"
                target="_blank"
              >
                {inquiry.product.name}
              </Link>
              {isNew && (
                <span
                  className="badge bg-danger"
                  style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}
                >
                  New
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "4px" }}>
              {inquiry.product.category || "—"} • {inquiry.product.unit || ""}
            </div>
          </div>
          <div>
            <span className={`badge ${getStatusBadge(inquiry.status)} px-3 py-2`}>
              {inquiry.status}
            </span>
          </div>
        </div>

        {/* جزئیات */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px" }}>
          <div>
            <span style={{ color: "var(--gray)" }}>{tab === "buyer" ? "Supplier:" : "Buyer:"}</span>{" "}
            {otherPartyId ? (
              <Link
                href={`/profile/${otherPartyId}`}
                style={{ color: "var(--gray-dark)", textDecoration: "none", fontWeight: 600 }}
                target="_blank"
              >
                {otherPartyName}
              </Link>
            ) : (
              <span style={{ fontWeight: 600 }}>{otherPartyName}</span>
            )}
          </div>
          <div>
            <span style={{ color: "var(--gray)" }}>Quantity:</span>{" "}
            <span style={{ fontWeight: 600 }}>{inquiry.quantity || "—"}</span>
          </div>
          <div>
            <span style={{ color: "var(--gray)" }}>Price:</span>{" "}
            <span style={{ fontWeight: 600 }}>
              {inquiry.requestedPrice ? `$${inquiry.requestedPrice}` : "—"}
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

        {/* دکمه‌ها */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-info-circle me-1"></i> Details
          </button>
          <Link href={`/products/${inquiry.product.id}`} className="btn btn-sm btn-outline-secondary" target="_blank">
            <i className="fas fa-eye me-1"></i> View Product
          </Link>
        </div>
      </div>

      <InquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inquiry={inquiry}
        tab={tab}
        onMarkRead={handleMarkRead} // ✅ پاس‌دادن کالبک
      />
    </>
  );
}