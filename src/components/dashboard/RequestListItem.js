// src/components/dashboard/RequestListItem.js
"use client";

import { useState } from "react";
import Link from "next/link";
import QuotesModal from "./QuotesModal";

export default function RequestListItem({ request }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: "white",
          border: "1px solid var(--gray-light)",
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {/* عنوان لینک‌دار */}
            <Link
              href={`/requests/${request.id}`}
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--black)",
                textDecoration: "none",
              }}
              className="text-decoration-none"
            >
              {request.title}
            </Link>
            <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "4px" }}>
              {request.category} • Posted {new Date(request.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* وضعیت */}
            <span className={`status ${request.isUrgent ? "urgent" : "active"}`}>
              {request.isUrgent ? "Urgent" : "Active"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", fontSize: "13px" }}>
          <div>
            <i className="fa-regular fa-eye" style={{ marginRight: "4px" }}></i>
            {request.views || 0} views
          </div>
          <div>
            <i className="fa-regular fa-comment-dots" style={{ marginRight: "4px" }}></i>
            {request._count?.quotes || 0} quotes
          </div>
          <div>
            {request.quantity} {request.unit}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          {/* ✅ دکمه ویرایش */}
          <Link href={`/dashboard/requests/edit/${request.id}`} className="btn btn-sm btn-outline-secondary">
            <i className="fas fa-pen me-1"></i> Edit
          </Link>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="fas fa-list me-1"></i> View Quotes
          </button>
          <Link href={`/requests/${request.requestNumber}/${request.slug}`} className="btn btn-sm btn-outline-secondary">
            <i className="fas fa-eye me-1"></i> View Details
          </Link>
        </div>
      </div>

      <QuotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestId={request.id}
      />
    </>
  );
}