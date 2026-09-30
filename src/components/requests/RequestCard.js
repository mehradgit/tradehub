// src/components/requests/RequestCard.js
"use client";

import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryViaCode } from "@/lib/countries";

export default function RequestCard({ request }) {
  if (!request) return null;

  const displayCountry = request.buyerCountry || request.deliveryCountry || null;
  const formattedDate = request.createdAt
    ? new Date(request.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <>
      <Link
        href={`/requests/${request.requestNumber}/${request.slug}`}
        className="request-card-link"
      >
        <div className={`request-card ${request.isUrgent ? "urgent" : ""}`}>
          {/* Top row: Category + Badge */}
          <div className="request-card-top">
            <span className="request-category">
              {request.category || "Uncategorized"}
              {request.subCategory && ` · ${request.subCategory}`}
            </span>
            {request.isUrgent && (
              <span className="request-urgent-badge">
                <i className="fas fa-bolt"></i> Urgent
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="request-card-title">{request.title}</h3>

          {/* Underline */}
          <div className="request-card-underline" />

          {/* Description */}
          <p className="request-card-description">
            {request.description}
          </p>

          {/* Footer: Date + Country */}
          <div className="request-card-footer">
            <span className="request-meta-item">
              <i className="far fa-calendar-alt"></i>
              {formattedDate}
            </span>
            <span className="request-meta-item">
              <CountryFlag
                countryCode={getCountryViaCode(displayCountry)}
                size="14px"
              />
              <span>{displayCountry || "—"}</span>
            </span>
          </div>
        </div>
      </Link>

      <style jsx>{`
        .request-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
          min-width: 0;
        }

        .request-card {
          background: white;
          border: 1px solid #e8edf0;
          border-left: 4px solid #13795b;
          border-radius: 14px;
          padding: 16px 18px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
          min-width: 0;
          overflow: hidden;
        }

        .request-card.urgent {
          border-left-color: #ef4444;
        }

        .request-card-link:hover .request-card {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(19, 121, 91, 0.12);
          border-color: #13795b;
        }

        .request-card-link:hover .request-card.urgent {
          border-color: #ef4444;
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.12);
        }

        /* ===== Top row ===== */
        .request-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
        }

        .request-category {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          flex: 1;
        }

        .request-urgent-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #b91c1c;
          border-radius: 50px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .request-urgent-badge i {
          font-size: 8px;
        }

        /* ===== Title ===== */
        .request-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0b1f18;
          margin: 0;
          line-height: 1.35;
          font-family: "Manrope", sans-serif;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 40px;
          word-wrap: break-word;
        }

        /* ===== Underline ===== */
        .request-card-underline {
          width: 50%;
          height: 1px;
          background: #f7c3a3;
          border-radius: 2px;
          margin: 2px 0;
        }

        /* ===== Description ===== */
        .request-card-description {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.55;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 58px;
          flex: 1;
        }

        /* ===== Footer ===== */
        .request-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f7;
          font-size: 11.5px;
          color: #64748b;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .request-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          white-space: nowrap;
        }

        .request-meta-item i {
          font-size: 11px;
          color: #94a3b8;
        }

        .request-meta-item span {
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        /* ===== Responsive ===== */
        @media (max-width: 768px) {
          .request-card {
            padding: 14px;
            gap: 8px;
          }
          .request-card-title {
            font-size: 14px;
            min-height: 38px;
          }
          .request-card-description {
            font-size: 12px;
            min-height: 54px;
          }
          .request-card-footer {
            font-size: 11px;
          }
        }

        @media (max-width: 500px) {
          .request-card {
            padding: 12px;
            border-radius: 12px;
          }
          .request-card-title {
            font-size: 13.5px;
          }
          .request-card-description {
            font-size: 11.5px;
          }
        }
      `}</style>
    </>
  );
}