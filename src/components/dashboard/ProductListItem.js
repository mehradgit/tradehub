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

  // ====== تعیین وضعیت محصول ======
  const getStatus = (product) => {
    if (!product.isVisible) return { label: "Suspended", className: "sold" };
    if (product.stock === 0) return { label: "Sold Out", className: "sold" };
    return { label: "Active", className: "active" };
  };

  const status = getStatus(product);
  const imageUrl = product.images?.[0] || "https://placehold.co/42x42";
  const inquiryCount = product._count?.inquiries || 0;

  // ====== حذف محصول ======
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                objectFit: "cover",
                border: "1px solid var(--gray-light)",
              }}
            />
            <div>
              <Link
                href={`/products/${product.id}`}
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--black)",
                  textDecoration: "none",
                }}
                className="text-decoration-none"
                target="_blank"
              >
                {product.name}
              </Link>
              <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "4px" }}>
                {product.category || "—"}
              </div>
            </div>
          </div>
          <div>
            <span className={`status ${status.className}`}>
              <span className="status-dot"></span> {status.label}
            </span>
          </div>
        </div>

        {/* ====== ردیف دوم: قیمت + بازدید + درخواست‌ها ====== */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", fontSize: "13px" }}>
          <div>
            <span style={{ fontWeight: 700, color: "var(--black)" }}>${product.price}</span>{" "}
            <span style={{ color: "var(--gray)", fontSize: "11px" }}>/ {product.unit}</span>
          </div>
          <div>
            <i className="fa-regular fa-eye" style={{ marginRight: "4px", color: "var(--gray)" }}></i>
            {product.views || 0} views
          </div>
          <div>
            <i className="fa-regular fa-envelope" style={{ marginRight: "4px", color: "var(--gray)" }}></i>
            {inquiryCount} inquiries
          </div>
        </div>

        {/* ====== ردیف سوم: دکمه‌های عملیات ====== */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          {/* ✅ دکمه مشاهده درخواست‌ها */}
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="fas fa-list me-1"></i> View Inquiries
          </button>
          <Link href={`/dashboard/products/edit/${product.id}`} className="btn btn-sm btn-outline-secondary">
            <i className="fas fa-pen me-1"></i> Edit
          </Link>
          <Link href={`/products/${product.productNumber}/${product.slug}`} className="btn btn-sm btn-outline-secondary" target="_blank">
            <i className="fas fa-eye me-1"></i> View
          </Link>
          <button className="btn btn-sm btn-outline-danger" onClick={handleDelete}>
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