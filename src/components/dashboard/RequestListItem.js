// src/components/dashboard/RequestListItem.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import QuotesModal from "./QuotesModal";

export default function RequestListItem({ request }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const quoteCount = request._count?.quotes || 0;

  // ====== تعیین وضعیت درخواست با استایل مدرن ======
  const getStatusInfo = () => {
    if (request.status === "PENDING") {
      return {
        type: "pending",
        label: "Pending Review",
        icon: "fa-clock",
        bg: "#fff7e6",
        color: "#b45309",
        border: "#fde68a",
      };
    }
    if (request.status === "REJECTED") {
      return {
        type: "rejected",
        label: "Rejected",
        icon: "fa-times-circle",
        bg: "#fef2f2",
        color: "#b91c1c",
        border: "#fecaca",
        note: request.rejectionNote,
      };
    }
    if (request.status === "APPROVED") {
      if (!request.isVisible) {
        return {
          type: "hidden",
          label: "Hidden",
          icon: "fa-eye-slash",
          bg: "#f1f5f9",
          color: "#475569",
          border: "#cbd5e1",
        };
      }
      return {
        type: "active",
        label: "Active",
        icon: "fa-check-circle",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
      };
    }
    return {
      type: "active",
      label: "Active",
      icon: "fa-check-circle",
      bg: "#ecfdf5",
      color: "#047857",
      border: "#a7f3d0",
    };
  };

  const status = getStatusInfo();

  // ====== حذف درخواست ======
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Request deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete request");
    }
  };

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
        {/* ====== ردیف اول: عنوان + وضعیت ====== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href={`/requests/${request.requestNumber}/${request.slug}`}
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--black)",
                textDecoration: "none",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              className="text-decoration-none"
              target="_blank"
            >
              {request.title}
            </Link>
            <div
              style={{
                fontSize: "12px",
                color: "var(--gray)",
                marginTop: "4px",
              }}
            >
              {request.category}
              {request.subCategory && ` · ${request.subCategory}`}
            </div>
          </div>

          {/* ✅ بج وضعیت مدرن */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 50,
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.border}`,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <i className={`fas ${status.icon}`} style={{ fontSize: 11 }}></i>
            {status.label}
          </div>
        </div>

        {/* ✅ نمایش دلیل رد شدن (در صورت وجود) */}
        {status.type === "rejected" && status.note && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              color: "#991b1b",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <i
              className="fas fa-info-circle"
              style={{ marginTop: 2, flexShrink: 0 }}
            ></i>
            <div>
              <strong>Rejection reason:</strong> {status.note}
            </div>
          </div>
        )}

        {/* ====== ردیف دوم: مقدار + بازدید + پاسخ‌ها ====== */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "13px",
            marginTop: 4,
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: "var(--black)" }}>
              {request.quantity} {request.unit}
            </span>
          </div>
          <div style={{ color: "var(--gray)" }}>
            <i className="fa-regular fa-eye" style={{ marginRight: "4px" }}></i>
            <span style={{ color: "var(--black)", fontWeight: 600 }}>
              {request.views || 0}
            </span>{" "}
            views
          </div>
          <div style={{ color: "var(--gray)" }}>
            <i
              className="fa-regular fa-comment-dots"
              style={{ marginRight: "4px" }}
            ></i>
            <span style={{ color: "var(--black)", fontWeight: 600 }}>
              {quoteCount}
            </span>{" "}
            quotes
          </div>
          {request.isUrgent && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 10px",
                borderRadius: 50,
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 10,
                fontWeight: 700,
                border: "1px solid #fecaca",
              }}
            >
              <i className="fas fa-exclamation-circle" style={{ fontSize: 9 }}></i>
              Urgent
            </span>
          )}
        </div>

        {/* ====== ردیف سوم: دکمه‌های عملیات ====== */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="fas fa-list me-1"></i> View Quotes
          </button>
          <Link
            href={`/dashboard/requests/edit/${request.id}`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="fas fa-pen me-1"></i> Edit
          </Link>
          <Link
            href={`/requests/${request.requestNumber}/${request.slug}`}
            className="btn btn-sm btn-outline-secondary"
            target="_blank"
          >
            <i className="fas fa-eye me-1"></i> View
          </Link>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleDelete}
          >
            <i className="fas fa-trash me-1"></i> Delete
          </button>
        </div>
      </div>

      {/* مودال پاسخ‌ها */}
      <QuotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestId={request.id}
      />
    </>
  );
}