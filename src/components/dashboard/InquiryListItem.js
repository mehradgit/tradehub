// src/components/dashboard/InquiryListItem.js
"use client";

import { useState } from "react";
import Link from "next/link";
import InquiryModal from "./InquiryModal";
import { PRODUCT_PLACEHOLDER } from "@/lib/imageHelpers";

export default function InquiryListItem({ inquiry, tab }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [read, setRead] = useState(inquiry.read);

  const handleMarkRead = () => setRead(true);

  const otherParty = tab === "buyer" ? inquiry.supplier : inquiry.user;
  const otherPartyName =
    otherParty?.companyName || otherParty?.name || "Unknown";

  const isNew = !read;

  // ===== Status info =====
  const getStatusInfo = () => {
    const map = {
      pending: { type: "pending", label: "Pending", icon: "fa-clock" },
      responded: { type: "responded", label: "Responded", icon: "fa-reply" },
      accepted: { type: "accepted", label: "Accepted", icon: "fa-check-circle" },
      rejected: { type: "rejected", label: "Rejected", icon: "fa-times-circle" },
    };
    return (
      map[inquiry.status] || {
        type: "pending",
        label: inquiry.status || "Pending",
        icon: "fa-circle",
      }
    );
  };

  const status = getStatusInfo();

  const imageUrl =
    inquiry.product?.images?.[0] || PRODUCT_PLACEHOLDER;
  const productUrl =
    inquiry.product?.productNumber && inquiry.product?.slug
      ? `/products/${inquiry.product.productNumber}/${inquiry.product.slug}`
      : "#";

  const formattedDate = new Date(inquiry.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <>
      <div className={`ipi-card ${isNew ? "is-new" : ""}`}>
        {/* ============================================================
           Image
           ============================================================ */}
        <div className="ipi-image-wrapper">
          <img
            src={imageUrl}
            alt={inquiry.product?.name || "Product"}
            className="ipi-image"
            loading="lazy"
          />
          {isNew && <span className="ipi-new-dot" />}
        </div>

        {/* ============================================================
           Content
           ============================================================ */}
        <div className="ipi-content">
          {/* Top: Category + Status */}
          <div className="ipi-top">
            <div className="ipi-category">
              <i className="fas fa-tag"></i>
              <span>{inquiry.product?.category || "Uncategorized"}</span>
              {inquiry.product?.subCategory && (
                <>
                  <span className="ipi-sep">·</span>
                  <span>{inquiry.product.subCategory}</span>
                </>
              )}
            </div>

            <div className={`ipi-status ${status.type}`}>
              <i className={`fas ${status.icon}`}></i>
              <span>{status.label}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link href={productUrl} className="ipi-title-link" target="_blank">
            <h3 className="ipi-title">
              {inquiry.product?.name || "Product"}
            </h3>
          </Link>

          {/* Other Party */}
          <div className="ipi-party">
            <i
              className={`fas ${
                tab === "buyer" ? "fa-store" : "fa-user-tie"
              }`}
            ></i>
            <span className="ipi-party-label">
              {tab === "buyer" ? "Supplier:" : "Buyer:"}
            </span>
            <span className="ipi-party-name">{otherPartyName}</span>
          </div>

          {/* Meta Row */}
          <div className="ipi-meta">
            <span className="ipi-meta-item">
              <i className="fas fa-cube"></i>
              <span>
                Qty: {inquiry.quantity || "—"}
                {inquiry.product?.unit ? ` ${inquiry.product.unit}` : ""}
              </span>
            </span>

            {inquiry.requestedPrice ? (
              <span className="ipi-meta-item">
                <i className="fas fa-dollar-sign"></i>
                <span>${inquiry.requestedPrice}</span>
              </span>
            ) : (
              <span className="ipi-meta-item ipi-meta-muted">
                <i className="fas fa-dollar-sign"></i>
                <span>Price: —</span>
              </span>
            )}

            <span className="ipi-meta-item">
              <i className="far fa-calendar-alt"></i>
              <span>{formattedDate}</span>
            </span>
          </div>

          {/* Message Preview */}
          {inquiry.message && (
            <div className="ipi-message">
              <i className="fas fa-quote-left"></i>
              <p className="ipi-message-text">{inquiry.message}</p>
            </div>
          )}
        </div>

        {/* ============================================================
           Actions
           ============================================================ */}
        <div className="ipi-actions">
          <button
            type="button"
            className="ipi-btn ipi-btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="fas fa-eye"></i>
            <span>Details</span>
          </button>

          <Link href={productUrl} target="_blank" className="ipi-btn">
            <i className="fas fa-external-link-alt"></i>
            <span>Product</span>
          </Link>

          {otherParty?.id && (
            <Link
              href={`/dashboard/messages?userId=${otherParty.id}`}
              className="ipi-btn"
              title={`Message ${otherPartyName}`}
            >
              <i className="fas fa-comment-dots"></i>
              <span>Message</span>
            </Link>
          )}
        </div>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inquiry={inquiry}
        tab={tab}
        onMarkRead={handleMarkRead}
      />

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .ipi-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          padding: 16px;
          display: grid;
          grid-template-columns: 90px minmax(0, 1fr) auto;
          gap: 18px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 0;
          position: relative;
        }

        .ipi-card:hover {
          border-color: #13795b;
          box-shadow: 0 8px 24px rgba(19, 121, 91, 0.08);
        }

        .ipi-card.is-new {
          border-color: #a7f3d0;
          background: linear-gradient(
            135deg,
            #f8fdfb 0%,
            #ffffff 50%
          );
        }

        /* ============================================================
           Image
           ============================================================ */
        .ipi-image-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f8f6;
          border: 1px solid #f1f5f7;
          flex-shrink: 0;
        }

        .ipi-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ipi-new-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #13795b;
          border: 2px solid white;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.15);
          animation: ipiPulse 2s ease-in-out infinite;
        }

        @keyframes ipiPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        /* ============================================================
           Content
           ============================================================ */
        .ipi-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .ipi-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ipi-category {
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

        .ipi-category i {
          font-size: 10px;
          color: #13795b;
        }

        .ipi-sep {
          color: #cbd5d1;
        }

        /* Status badge */
        .ipi-status {
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

        .ipi-status i {
          font-size: 10px;
        }

        .ipi-status.pending {
          background: #fff7e6;
          color: #b45309;
        }

        .ipi-status.responded {
          background: #eff6ff;
          color: #2563eb;
        }

        .ipi-status.accepted {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .ipi-status.rejected {
          background: #fef2f2;
          color: #b91c1c;
        }

        /* Title */
        .ipi-title-link {
          text-decoration: none;
          color: inherit;
          display: block;
          min-width: 0;
        }

        .ipi-title {
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

        .ipi-title-link:hover .ipi-title {
          color: #13795b;
        }

        /* Other party */
        .ipi-party {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #334155;
          min-width: 0;
          flex-wrap: wrap;
        }

        .ipi-party > i {
          color: #13795b;
          font-size: 11px;
        }

        .ipi-party-label {
          color: #94a3b8;
          font-weight: 600;
        }

        .ipi-party-name {
          font-weight: 700;
          color: #0b1f18;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          max-width: 100%;
        }

        /* Meta */
        .ipi-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          font-size: 11.5px;
          color: #64748b;
          align-items: center;
          padding: 8px 0;
          border-top: 1px solid #f1f5f7;
          margin-top: 2px;
        }

        .ipi-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          white-space: nowrap;
        }

        .ipi-meta-item i {
          font-size: 10px;
          color: #94a3b8;
        }

        .ipi-meta-muted {
          opacity: 0.65;
        }

        /* Message preview */
        .ipi-message {
          display: flex;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border-left: 3px solid #a7f3d0;
          border-radius: 8px;
          min-width: 0;
        }

        .ipi-message > i {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 3px;
          flex-shrink: 0;
        }

        .ipi-message-text {
          font-size: 12.5px;
          color: #334155;
          line-height: 1.55;
          margin: 0;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-wrap: break-word;
          min-width: 0;
        }

        /* ============================================================
           Actions
           ============================================================ */
        .ipi-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 140px;
          flex-shrink: 0;
          align-self: start;
        }

        :global(.ipi-btn) {
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

        :global(.ipi-btn:hover:not(:disabled)) {
          border-color: #13795b;
          color: #13795b;
          background: #f0faf6;
        }

        :global(.ipi-btn i) {
          font-size: 11px;
        }

        :global(.ipi-btn-primary) {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-color: #13795b;
          box-shadow: 0 4px 10px rgba(19, 121, 91, 0.2);
        }

        :global(.ipi-btn-primary:hover:not(:disabled)) {
          background: linear-gradient(135deg, #0d9469, #0b5b43);
          color: white;
          border-color: #0d9469;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.3);
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 992px) {
          .ipi-card {
            grid-template-columns: 80px minmax(0, 1fr);
            gap: 14px;
          }

          .ipi-image-wrapper {
            width: 80px;
            height: 80px;
          }

          .ipi-actions {
            grid-column: 1 / -1;
            flex-direction: row;
            min-width: 0;
            gap: 6px;
            padding-top: 4px;
            border-top: 1px solid #f1f5f7;
            margin-top: 4px;
          }

          :global(.ipi-btn) {
            width: auto;
            flex: 1;
          }
        }

        @media (max-width: 600px) {
          .ipi-card {
            grid-template-columns: 70px minmax(0, 1fr);
            gap: 12px;
            padding: 14px;
            border-radius: 14px;
          }

          .ipi-image-wrapper {
            width: 70px;
            height: 70px;
            border-radius: 10px;
          }

          .ipi-title {
            font-size: 14px;
          }

          .ipi-party {
            font-size: 11.5px;
          }

          .ipi-meta {
            gap: 10px;
            font-size: 11px;
          }

          .ipi-message {
            padding: 8px 10px;
          }

          .ipi-message-text {
            font-size: 12px;
            -webkit-line-clamp: 3;
          }

          :global(.ipi-btn) {
            font-size: 12px;
            padding: 8px 10px;
            gap: 4px;
          }

          :global(.ipi-btn span) {
            display: none;
          }

          :global(.ipi-btn i) {
            font-size: 13px;
          }
        }

        @media (max-width: 400px) {
          .ipi-card {
            grid-template-columns: 1fr;
          }

          .ipi-image-wrapper {
            width: 100%;
            height: 160px;
          }
        }
      `}</style>
    </>
  );
}