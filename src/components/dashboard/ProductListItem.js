// src/components/dashboard/ProductListItem.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ProductInquiriesModal from "./ProductInquiriesModal";

export default function ProductListItem({ product }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const imageUrl = product.images?.[0] || "https://placehold.co/42x42";
  const inquiryCount = product._count?.inquiries || 0;

  // ====== تعیین وضعیت محصول با استایل مدرن ======
  const getStatusInfo = () => {
    // اولویت با status تأیید
    if (product.status === "PENDING") {
      return {
        type: "pending",
        label: "Pending Review",
        icon: "fa-clock",
        bg: "#fff7e6",
        color: "#b45309",
        border: "#fde68a",
      };
    }
    if (product.status === "REJECTED") {
      return {
        type: "rejected",
        label: "Rejected",
        icon: "fa-times-circle",
        bg: "#fef2f2",
        color: "#b91c1c",
        border: "#fecaca",
        note: product.rejectionNote,
      };
    }
    if (product.status === "APPROVED") {
      if (!product.isVisible) {
        return {
          type: "hidden",
          label: "Hidden",
          icon: "fa-eye-slash",
          bg: "#f1f5f9",
          color: "#475569",
          border: "#cbd5e1",
        };
      }
      if (product.stock === 0) {
        return {
          type: "soldout",
          label: "Sold Out",
          icon: "fa-box-open",
          bg: "#fff7e6",
          color: "#92400e",
          border: "#fde68a",
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
    // در حالت fallback
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

  // ====== حذف محصول ======
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
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
        {/* ====== ردیف اول: تصویر + نام + وضعیت ====== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                objectFit: "cover",
                border: "1px solid var(--gray-light)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <Link
                href={`/products/${product.productNumber}/${product.slug}`}
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
                {product.name}
              </Link>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--gray)",
                  marginTop: "4px",
                }}
              >
                {product.category || "—"}
              </div>
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

        {/* ====== ردیف دوم: قیمت + بازدید + درخواست‌ها ====== */}
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
              ${product.price}
            </span>{" "}
            <span style={{ color: "var(--gray)", fontSize: "11px" }}>
              / {product.unit}
            </span>
          </div>
          <div style={{ color: "var(--gray)" }}>
            <i className="fa-regular fa-eye" style={{ marginRight: "4px" }}></i>
            <span style={{ color: "var(--black)", fontWeight: 600 }}>
              {product.views || 0}
            </span>{" "}
            views
          </div>
          <div style={{ color: "var(--gray)" }}>
            <i
              className="fa-regular fa-envelope"
              style={{ marginRight: "4px" }}
            ></i>
            <span style={{ color: "var(--black)", fontWeight: 600 }}>
              {inquiryCount}
            </span>{" "}
            inquiries
          </div>
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
            <i className="fas fa-list me-1"></i> View Inquiries
          </button>
          <Link
            href={`/dashboard/products/edit/${product.id}`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="fas fa-pen me-1"></i> Edit
          </Link>
          <Link
            href={`/products/${product.productNumber}/${product.slug}`}
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

      {/* مودال درخواست‌ها */}
      <ProductInquiriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={product.id}
      />
    </>
  );
}