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
  const [deleting, setDeleting] = useState(false);

  const inquiryCount = product._count?.inquiries || 0;
  const imageUrl = product.images?.[0] || "https://placehold.co/80x80";
  const detailUrl = `/products/${product.productNumber}/${product.slug}`;

  // ===== Status info =====
  const getStatusInfo = () => {
    if (product.status === "PENDING") {
      return {
        type: "pending",
        label: "Pending Review",
        icon: "fa-clock",
      };
    }
    if (product.status === "REJECTED") {
      return {
        type: "rejected",
        label: "Rejected",
        icon: "fa-times-circle",
        note: product.rejectionNote,
      };
    }
    if (product.status === "APPROVED") {
      if (!product.isVisible) {
        return {
          type: "hidden",
          label: "Hidden",
          icon: "fa-eye-slash",
        };
      }
      if (product.stock === 0) {
        return {
          type: "soldout",
          label: "Sold Out",
          icon: "fa-box-open",
        };
      }
      return {
        type: "approved",
        label: "Active",
        icon: "fa-check-circle",
      };
    }
    return {
      type: "approved",
      label: "Active",
      icon: "fa-check-circle",
    };
  };

  const status = getStatusInfo();

  // ===== Delete =====
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
      setDeleting(false);
    }
  };

  const formattedDate = new Date(product.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <>
      <div className="pli-card">
        {/* ============================================================
           Left: Image
           ============================================================ */}
        <div className="pli-image-wrapper">
          <img
            src={imageUrl}
            alt={product.name}
            className="pli-image"
            loading="lazy"
          />
          {product.badge && (
            <span className="pli-image-badge">{product.badge}</span>
          )}
        </div>

        {/* ============================================================
           Middle: Content
           ============================================================ */}
        <div className="pli-content">
          {/* Top Row: Category + Status */}
          <div className="pli-top">
            <div className="pli-category">
              <i className="fas fa-tag"></i>
              <span>{product.category || "Uncategorized"}</span>
              {product.subCategory && (
                <>
                  <span className="pli-sep">·</span>
                  <span>{product.subCategory}</span>
                </>
              )}
            </div>

            <div className={`pli-status ${status.type}`}>
              <i className={`fas ${status.icon}`}></i>
              <span>{status.label}</span>
            </div>
          </div>

          {/* Title */}
          <Link href={detailUrl} className="pli-title-link" target="_blank">
            <h3 className="pli-title">{product.name}</h3>
          </Link>

          {/* Rejection Note */}
          {status.type === "rejected" && status.note && (
            <div className="pli-rejection-note">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Rejection reason:</strong> {status.note}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="pli-price">
            <span className="pli-price-value">
              {product.currency || "USD"} {product.price}
            </span>
            <span className="pli-price-unit">/ {product.unit}</span>
            <span className="pli-price-sep">·</span>
            <span className="pli-price-moq">MOQ: {product.moq}</span>
          </div>

          {/* Meta Row */}
          <div className="pli-meta">
            <span className="pli-meta-item">
              <i className="far fa-eye"></i>
              <span>{product.views || 0} views</span>
            </span>

            <span className="pli-meta-item">
              <i className="far fa-envelope"></i>
              <span>
                {inquiryCount} {inquiryCount === 1 ? "inquiry" : "inquiries"}
              </span>
            </span>

            {product.stock !== null && (
              <span className="pli-meta-item">
                <i className="fas fa-warehouse"></i>
                <span>Stock: {product.stock}</span>
              </span>
            )}

            <span className="pli-meta-item">
              <i className="far fa-calendar-alt"></i>
              <span>{formattedDate}</span>
            </span>
          </div>
        </div>

        {/* ============================================================
           Right: Actions
           ============================================================ */}
        <div className="pli-actions">
          <button
            type="button"
            className="pli-btn pli-btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={inquiryCount === 0}
            title={inquiryCount === 0 ? "No inquiries yet" : "View inquiries"}
          >
            <i className="fas fa-list"></i>
            <span>Inquiries</span>
            {inquiryCount > 0 && (
              <span className="pli-btn-badge">{inquiryCount}</span>
            )}
          </button>

          <Link
            href={`/dashboard/products/edit/${product.id}`}
            className="pli-btn"
            title="Edit product"
          >
            <i className="fas fa-pen"></i>
            <span>Edit</span>
          </Link>

          <Link
            href={detailUrl}
            className="pli-btn"
            target="_blank"
            title="View public page"
          >
            <i className="fas fa-eye"></i>
            <span>View</span>
          </Link>

          <button
            type="button"
            className="pli-btn pli-btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete product"
          >
            {deleting ? (
              <span className="pli-spinner"></span>
            ) : (
              <i className="fas fa-trash"></i>
            )}
          </button>
        </div>
      </div>

      {/* Inquiries Modal */}
      <ProductInquiriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={product.id}
      />

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .pli-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          padding: 16px;
          display: grid;
          grid-template-columns: 100px minmax(0, 1fr) auto;
          gap: 18px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 0;
        }

        .pli-card:hover {
          border-color: #13795b;
          box-shadow: 0 8px 24px rgba(19, 121, 91, 0.08);
        }

        /* ============================================================
           Image
           ============================================================ */
        .pli-image-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f8f6;
          border: 1px solid #f1f5f7;
          flex-shrink: 0;
        }

        .pli-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pli-image-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          padding: 2px 8px;
          background: linear-gradient(135deg, #f5b544, #e08900);
          color: white;
          border-radius: 50px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        /* ============================================================
           Content
           ============================================================ */
        .pli-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .pli-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .pli-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pli-category i {
          font-size: 10px;
          color: #13795b;
        }

        .pli-sep {
          color: #cbd5d1;
        }

        /* Status */
        .pli-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .pli-status i {
          font-size: 10px;
        }

        .pli-status.pending {
          background: #fff7e6;
          color: #b45309;
        }

        .pli-status.approved {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .pli-status.rejected {
          background: #fef2f2;
          color: #b91c1c;
        }

        .pli-status.hidden {
          background: #f1f5f9;
          color: #475569;
        }

        .pli-status.soldout {
          background: #fff7e6;
          color: #92400e;
        }

        /* Title */
        .pli-title-link {
          text-decoration: none;
          color: inherit;
          display: block;
          min-width: 0;
        }

        .pli-title {
          font-size: 15px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          line-height: 1.35;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.01em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-wrap: break-word;
          transition: color 0.15s ease;
        }

        .pli-title-link:hover .pli-title {
          color: #13795b;
        }

        /* Rejection note */
        .pli-rejection-note {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 12px;
          color: #991b1b;
          line-height: 1.5;
        }

        .pli-rejection-note i {
          margin-top: 2px;
          flex-shrink: 0;
          font-size: 12px;
        }

        /* Price */
        .pli-price {
          display: flex;
          align-items: baseline;
          gap: 5px;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .pli-price-value {
          font-size: 16px;
          font-weight: 800;
          color: #13795b;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
        }

        .pli-price-unit {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .pli-price-sep {
          color: #cbd5d1;
          margin: 0 4px;
        }

        .pli-price-moq {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        /* Meta */
        .pli-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11.5px;
          color: #64748b;
          align-items: center;
        }

        .pli-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          white-space: nowrap;
        }

        .pli-meta-item i {
          font-size: 11px;
          color: #94a3b8;
        }

        /* ============================================================
           Actions
           ============================================================ */
        .pli-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
          flex-shrink: 0;
          align-self: start;
        }

        :global(.pli-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 14px;
          border-radius: 10px;
          border: 1px solid #e8edf0;
          background: white;
          color: #334155;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          white-space: nowrap;
          width: 100%;
        }

        :global(.pli-btn:hover:not(:disabled)) {
          border-color: #13795b;
          color: #13795b;
          background: #f0faf6;
        }

        :global(.pli-btn:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        :global(.pli-btn i) {
          font-size: 11px;
        }

        :global(.pli-btn-primary) {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-color: #13795b;
        }

        :global(.pli-btn-primary:hover:not(:disabled)) {
          background: linear-gradient(135deg, #0d9469, #0b5b43);
          color: white;
          border-color: #0d9469;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(19, 121, 91, 0.25);
        }

        :global(.pli-btn-primary:disabled) {
          background: #e2e8f0;
          border-color: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
        }

        :global(.pli-btn-danger) {
          color: #dc2626;
          border-color: #fecaca;
        }

        :global(.pli-btn-danger:hover:not(:disabled)) {
          background: #fef2f2;
          color: #dc2626;
          border-color: #dc2626;
        }

        .pli-btn-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
        }

        .pli-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(220, 38, 38, 0.2);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: pliSpin 0.8s linear infinite;
        }

        @keyframes pliSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 992px) {
          .pli-card {
            grid-template-columns: 90px minmax(0, 1fr);
            gap: 14px;
          }

          .pli-image-wrapper {
            width: 90px;
            height: 90px;
          }

          .pli-actions {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr auto;
            gap: 6px;
            min-width: 0;
          }

          :global(.pli-btn) {
            width: auto;
          }
        }

        @media (max-width: 600px) {
          .pli-card {
            grid-template-columns: 80px minmax(0, 1fr);
            gap: 12px;
            padding: 14px;
            border-radius: 14px;
          }

          .pli-image-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 10px;
          }

          .pli-title {
            font-size: 14px;
          }

          .pli-price-value {
            font-size: 15px;
          }

          .pli-meta {
            gap: 10px;
            font-size: 11px;
          }

          /* Actions: primary تمام عرض + 3 دکمه کنار هم */
          .pli-actions {
            grid-template-columns: 1fr 1fr 1fr auto;
          }

          :global(.pli-btn) {
            font-size: 12px;
            padding: 9px 10px;
          }

          :global(.pli-btn span:not(.pli-btn-badge)) {
            display: none;
          }

          :global(.pli-btn i) {
            font-size: 13px;
          }

          /* View Inquiries همیشه آیکون + count */
          :global(.pli-btn-primary span.pli-btn-badge) {
            display: inline-flex;
          }

          :global(.pli-btn-primary) {
            gap: 4px;
          }
        }

        @media (max-width: 400px) {
          .pli-card {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .pli-image-wrapper {
            width: 100%;
            height: 180px;
          }

          .pli-actions {
            grid-template-columns: 1fr 1fr 1fr auto;
          }
        }
      `}</style>
    </>
  );
}