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
  const [deleting, setDeleting] = useState(false);

  const quoteCount = request._count?.quotes || 0;

  // ===== Status info =====
  const getStatusInfo = () => {
    if (request.status === "PENDING") {
      return {
        type: "pending",
        label: "Pending Review",
        icon: "fa-clock",
      };
    }
    if (request.status === "REJECTED") {
      return {
        type: "rejected",
        label: "Rejected",
        icon: "fa-times-circle",
        note: request.rejectionNote,
      };
    }
    if (request.status === "APPROVED") {
      if (!request.isVisible) {
        return {
          type: "hidden",
          label: "Hidden",
          icon: "fa-eye-slash",
        };
      }
      return {
        type: "approved",
        label: "Approved",
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
    if (!confirm("Are you sure you want to delete this request?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Request deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete request");
      setDeleting(false);
    }
  };

  const formattedDate = new Date(request.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const detailUrl = `/requests/${request.requestNumber}/${request.slug}`;

  return (
    <>
      <div className="rli-card">
        {/* ============================================================
           Top Row: Category + Status
           ============================================================ */}
        <div className="rli-top">
          <div className="rli-category">
            <i className="fas fa-tag"></i>
            <span>{request.category || "Uncategorized"}</span>
            {request.subCategory && (
              <>
                <span className="rli-sep">·</span>
                <span>{request.subCategory}</span>
              </>
            )}
          </div>

          <div className={`rli-status ${status.type}`}>
            <i className={`fas ${status.icon}`}></i>
            <span>{status.label}</span>
          </div>
        </div>

        {/* ============================================================
           Title
           ============================================================ */}
        <Link href={detailUrl} className="rli-title-link" target="_blank">
          <h3 className="rli-title">{request.title}</h3>
        </Link>

        {/* ============================================================
           Rejection Note
           ============================================================ */}
        {status.type === "rejected" && status.note && (
          <div className="rli-rejection-note">
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Rejection reason:</strong> {status.note}
            </div>
          </div>
        )}

        {/* ============================================================
           Meta Row
           ============================================================ */}
        <div className="rli-meta">
          <span className="rli-meta-item">
            <i className="fas fa-cube"></i>
            <span>
              {request.quantity} {request.unit}
            </span>
          </span>

          <span className="rli-meta-item">
            <i className="far fa-eye"></i>
            <span>{request.views || 0} views</span>
          </span>

          <span className="rli-meta-item">
            <i className="far fa-comment-dots"></i>
            <span>
              {quoteCount} {quoteCount === 1 ? "quote" : "quotes"}
            </span>
          </span>

          {request.deliveryCountry && (
            <span className="rli-meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{request.deliveryCountry}</span>
            </span>
          )}

          <span className="rli-meta-item">
            <i className="far fa-calendar-alt"></i>
            <span>{formattedDate}</span>
          </span>

          {request.isUrgent && (
            <span className="rli-urgent-tag">
              <i className="fas fa-bolt"></i>
              Urgent
            </span>
          )}
        </div>

        {/* ============================================================
           Actions
           ============================================================ */}
        <div className="rli-actions">
          <button
            type="button"
            className="rli-btn rli-btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={quoteCount === 0}
            title={quoteCount === 0 ? "No quotes yet" : "View quotes"}
          >
            <i className="fas fa-list"></i>
            <span>View Quotes</span>
            {quoteCount > 0 && <span className="rli-btn-badge">{quoteCount}</span>}
          </button>

          <Link
            href={`/dashboard/requests/edit/${request.id}`}
            className="rli-btn"
          >
            <i className="fas fa-pen"></i>
            <span>Edit</span>
          </Link>

          <Link href={detailUrl} className="rli-btn" target="_blank">
            <i className="fas fa-eye"></i>
            <span>View</span>
          </Link>

          <button
            type="button"
            className="rli-btn rli-btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete request"
          >
            {deleting ? (
              <span className="rli-spinner"></span>
            ) : (
              <i className="fas fa-trash"></i>
            )}
          </button>
        </div>
      </div>

      {/* Quotes Modal */}
      <QuotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestId={request.id}
      />

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .rli-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 0;
        }

        .rli-card:hover {
          border-color: #13795b;
          box-shadow: 0 8px 24px rgba(19, 121, 91, 0.08);
        }

        /* ============================================================
           Top row
           ============================================================ */
        .rli-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rli-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rli-category i {
          font-size: 10px;
          color: #13795b;
        }

        .rli-sep {
          color: #cbd5d1;
        }

        /* Status badge */
        .rli-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .rli-status i {
          font-size: 10px;
        }

        .rli-status.pending {
          background: #fff7e6;
          color: #b45309;
        }

        .rli-status.approved {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .rli-status.rejected {
          background: #fef2f2;
          color: #b91c1c;
        }

        .rli-status.hidden {
          background: #f1f5f9;
          color: #475569;
        }

        /* ============================================================
           Title
           ============================================================ */
        .rli-title-link {
          text-decoration: none;
          color: inherit;
          display: block;
          min-width: 0;
        }

        .rli-title {
          font-size: 15.5px;
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

        .rli-title-link:hover .rli-title {
          color: #13795b;
        }

        /* ============================================================
           Rejection note
           ============================================================ */
        .rli-rejection-note {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          font-size: 12.5px;
          color: #991b1b;
          line-height: 1.5;
        }

        .rli-rejection-note i {
          margin-top: 2px;
          flex-shrink: 0;
          font-size: 13px;
        }

        /* ============================================================
           Meta row
           ============================================================ */
        .rli-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding: 10px 0;
          border-top: 1px solid #f1f5f7;
          font-size: 12px;
          color: #64748b;
          align-items: center;
        }

        .rli-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          white-space: nowrap;
        }

        .rli-meta-item i {
          font-size: 11px;
          color: #94a3b8;
        }

        .rli-urgent-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .rli-urgent-tag i {
          font-size: 9px;
          color: #b91c1c;
        }

        /* ============================================================
           Actions
           ============================================================ */
        .rli-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        :global(.rli-btn) {
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
        }

        :global(.rli-btn:hover:not(:disabled)) {
          border-color: #13795b;
          color: #13795b;
          background: #f0faf6;
        }

        :global(.rli-btn:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        :global(.rli-btn i) {
          font-size: 11px;
        }

        :global(.rli-btn-primary) {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-color: #13795b;
        }

        :global(.rli-btn-primary:hover:not(:disabled)) {
          background: linear-gradient(135deg, #0d9469, #0b5b43);
          color: white;
          border-color: #0d9469;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(19, 121, 91, 0.25);
        }

        :global(.rli-btn-primary:disabled) {
          background: #e2e8f0;
          border-color: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
        }

        :global(.rli-btn-danger) {
          padding: 9px 12px;
          color: #dc2626;
          border-color: #fecaca;
        }

        :global(.rli-btn-danger:hover:not(:disabled)) {
          background: #fef2f2;
          color: #dc2626;
          border-color: #dc2626;
        }

        .rli-btn-badge {
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

        .rli-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(220, 38, 38, 0.2);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: rliSpin 0.8s linear infinite;
        }

        @keyframes rliSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 768px) {
          .rli-card {
            padding: 16px;
            gap: 10px;
            border-radius: 14px;
          }

          .rli-title {
            font-size: 14.5px;
          }

          .rli-meta {
            gap: 10px;
            font-size: 11.5px;
          }
        }

        @media (max-width: 500px) {
          .rli-card {
            padding: 14px;
            border-radius: 12px;
          }

          .rli-category {
            font-size: 10.5px;
          }

          .rli-status {
            font-size: 10px;
            padding: 4px 10px;
          }

          .rli-title {
            font-size: 14px;
          }

          .rli-meta {
            gap: 8px;
            font-size: 11px;
          }

          /* Actions: View Quotes + View full width, Edit + Delete side by side */
          .rli-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          :global(.rli-btn) {
            padding: 9px 12px;
            font-size: 12px;
          }

          /* View Quotes - full width */
          :global(.rli-btn-primary) {
            grid-column: 1 / -1;
          }

          :global(.rli-btn-danger) {
            padding: 9px;
          }
        }
      `}</style>
    </>
  );
}