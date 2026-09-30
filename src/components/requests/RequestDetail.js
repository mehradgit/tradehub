// src/components/requests/RequestDetail.js
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import ViewTracker from "@/components/ui/ViewTracker";
import RequestGallery from "./RequestGallery";
import BuyerInfoSection from "./BuyerInfoSection";
import RequestActions from "./RequestActions";
import { getCountryName, getCountryViaCode } from "@/lib/countries";

export default function RequestDetail({
  request,
  relatedRequests = [],
  attachments = [],
  supplierCountries = ["WORLDWIDE"],
  buyerInfoPermission,
  alreadyRevealed,
  shouldAutoReveal,
}) {
  const { data: session } = useSession();

  // ===== Dates =====
  const postedDate = new Date(request.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deadlineDate = request.deadline
    ? new Date(request.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Flexible";

  const buyerName =
    request.user?.companyName || request.user?.name || "Anonymous Buyer";

  const hasImages = attachments && attachments.length > 0;
  const mainImage = hasImages ? attachments[0] : null;
  const thumbnails = hasImages ? attachments.slice(1) : [];

  const buyer = {
    id: request.user?.id,
    name: buyerName,
  };

  // ===== Render helpers =====
  const renderSupplierCountries = () => {
    if (!Array.isArray(supplierCountries) || supplierCountries.length === 0) {
      return "Worldwide";
    }
    if (supplierCountries.includes("WORLDWIDE")) {
      return "Worldwide";
    }
    return supplierCountries.map((code) => getCountryName(code)).join(", ");
  };

  const renderTargetPrice = () => {
    if (request.isPriceNegotiable) return "Negotiable";
    if (request.targetPrice) {
      return `$${request.targetPrice} / ${request.unit}`;
    }
    return "—";
  };

  return (
    <>
      <div className="request-detail-container">
        {/* View Tracker */}
        <ViewTracker type="request" id={request.id} />

        {/* ====== Breadcrumb ====== */}
        <nav
          className="request-breadcrumb"
          aria-label="Breadcrumb"
        >
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link href="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/requests">Requests</Link>
            </li>
            {request.category && (
              <li className="breadcrumb-item">
                <Link
                  href={`/requests?category=${encodeURIComponent(
                    request.category,
                  )}`}
                >
                  {request.category}
                </Link>
              </li>
            )}
            {request.subCategory && (
              <li className="breadcrumb-item">
                <Link
                  href={`/requests?category=${encodeURIComponent(
                    request.category,
                  )}&subCategory=${encodeURIComponent(request.subCategory)}`}
                >
                  {request.subCategory}
                </Link>
              </li>
            )}
            <li className="breadcrumb-item active" aria-current="page">
              {request.title}
            </li>
          </ol>
        </nav>

        {/* ====== Main Grid: Gallery | Info ====== */}
        <div className="request-detail-row">
          {/* Gallery */}
          <RequestGallery
            mainImage={mainImage}
            thumbnails={thumbnails}
            hasImages={hasImages}
          />

          {/* Info */}
          <div className="request-info">
            {/* Header Badges */}
            <div className="request-header-info">
              <span
                className={`request-badge-lg ${
                  request.isUrgent ? "urgent" : ""
                }`}
              >
                {request.isUrgent ? (
                  <>
                    <i className="fas fa-bolt"></i> Urgent
                  </>
                ) : (
                  "Open"
                )}
              </span>
              <span className="request-status">
                <i className="fas fa-check-circle"></i> Verified Buyer
              </span>
            </div>

            {/* Title */}
            <h1 className="request-title">{request.title}</h1>

            {/* Meta Grid */}
            <div className="request-meta-grid">
              <div className="meta-item">
                <span className="label">Budget</span>
                <span className="value">
                  {request.budgetRange || "Negotiable"}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Deadline</span>
                <span className="value">{deadlineDate}</span>
              </div>
              <div className="meta-item">
                <span className="label">Quantity</span>
                <span className="value">
                  {request.quantity} {request.unit}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Posted</span>
                <span className="value">{postedDate}</span>
              </div>
            </div>

            {/* Description Card */}
            <div className="request-description-card">
              <div className="request-description-card-header">
                <i className="fas fa-align-left"></i>
                Description
              </div>
              <div className="request-description-card-body">
                {request.description}
              </div>
            </div>

            {/* Specs Table */}
            <div className="request-specs-wrapper">
              <table className="request-specs-table">
                <tbody>
                  <tr>
                    <td className="label">
                      <i className="fas fa-tag"></i>
                      <span>Product Type</span>
                    </td>
                    <td className="value">{request.category || "—"}</td>
                  </tr>

                  {request.subCategory && (
                    <tr>
                      <td className="label">
                        <i className="fas fa-folder-open"></i>
                        <span>Sub-Category</span>
                      </td>
                      <td className="value">{request.subCategory}</td>
                    </tr>
                  )}

                  <tr>
                    <td className="label">
                      <i className="fas fa-certificate"></i>
                      <span>Certifications</span>
                    </td>
                    <td className="value">
                      {request.certifications || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="label">
                      <i className="fas fa-box"></i>
                      <span>Packaging</span>
                    </td>
                    <td className="value">{request.packagingReq || "—"}</td>
                  </tr>

                  <tr>
                    <td className="label">
                      <i className="fas fa-ship"></i>
                      <span>Shipping Terms</span>
                    </td>
                    <td className="value">
                      {request.shippingTerms || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="label">
                      <i className="fas fa-credit-card"></i>
                      <span>Payment Terms</span>
                    </td>
                    <td className="value">
                      {request.paymentTerms || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="label">
                      <i className="fas fa-dollar-sign"></i>
                      <span>Target Price</span>
                    </td>
                    <td className="value">{renderTargetPrice()}</td>
                  </tr>

                  <tr>
                    <td className="label">
                      <i className="fas fa-map-pin"></i>
                      <span>Delivery Location</span>
                    </td>
                    <td className="value">
                      {request.deliveryCountry ? (
                        <span className="value-with-flag">
                          <CountryFlag
                            countryCode={getCountryViaCode(
                              request.deliveryCountry,
                            )}
                            size="16px"
                          />
                          <span>{request.deliveryCountry}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="label">
                      <i className="fas fa-globe"></i>
                      <span>Suppliers From</span>
                    </td>
                    <td className="value">{renderSupplierCountries()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Buyer Info */}
            <BuyerInfoSection
              requestId={request.id}
              buyer={{
                id: request.user?.id,
                name: request.user?.name,
                companyName: request.user?.companyName,
                image: request.user?.image,
                logo: request.user?.logo,
                country: request.user?.country,
                countryCode: request.user?.countryCode,
                createdAt: request.user?.createdAt,
              }}
              initialPermission={buyerInfoPermission}
              alreadyRevealed={alreadyRevealed}
              shouldAutoReveal={shouldAutoReveal}
            />

            {/* Actions */}
            <RequestActions
              request={request}
              buyer={buyer}
              buyerInfoPermission={buyerInfoPermission}
              alreadyRevealed={alreadyRevealed}
            />
          </div>
        </div>

        {/* ====== Related Requests ====== */}
        {relatedRequests.length > 0 && (
          <div className="related-requests-section">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-arrow-right"></i>
                Similar Buying Requests
              </h2>
              <Link href="/requests" className="section-more">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div className="compact-requests-grid">
              {relatedRequests.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/requests/${rel.requestNumber}/${rel.slug}`}
                  className="related-request-link"
                >
                  <div
                    className={`compact-request-card ${
                      rel.isUrgent ? "wanted" : ""
                    }`}
                  >
                    <span
                      className={`request-badge-sm ${
                        rel.isUrgent ? "urgent" : "verified"
                      }`}
                    >
                      {rel.isUrgent ? "Urgent" : "Verified"}
                    </span>
                    <div className="related-title">{rel.title}</div>
                    <div className="related-desc">{rel.description}</div>
                    <div className="related-footer">
                      <span>
                        <i className="far fa-calendar-alt"></i>{" "}
                        {new Date(rel.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        <i className="fas fa-user"></i>{" "}
                        {rel.buyerCountry || "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====== Styles ====== */}
      <style jsx>{`
        .request-detail-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ============================================================
           Breadcrumb
           ============================================================ */
        .request-breadcrumb {
          padding: 16px 0 20px;
        }

        .breadcrumb-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 13px;
        }

        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
        }

        .breadcrumb-item:not(:last-child)::after {
          content: "/";
          margin: 0 8px;
          color: #cbd5d1;
        }

        .breadcrumb-item::before {
          display: none !important;
        }

        .breadcrumb-item a {
          color: #13795b;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb-item a:hover {
          text-decoration: underline;
        }

        .breadcrumb-item.active {
          color: #64748b;
          font-weight: 500;
        }

        /* ============================================================
           Main grid: Gallery | Info
           ============================================================ */
        .request-detail-row {
          display: grid;
          grid-template-columns: 380px minmax(0, 1fr);
          gap: 32px;
          align-items: start;
          width: 100%;
          margin-bottom: 40px;
        }

        .request-detail-row > * {
          min-width: 0;
        }

        /* ============================================================
           Info Column
           ============================================================ */
        .request-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        .request-header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .request-badge-lg {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: linear-gradient(135deg, #eaf7f1, #d1ede0);
          color: #0b5b43;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .request-badge-lg.urgent {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #b91c1c;
        }

        .request-badge-lg i {
          font-size: 10px;
        }

        .request-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #13795b;
        }

        .request-status i {
          font-size: 13px;
        }

        .request-title {
          font-size: 26px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          line-height: 1.3;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          word-wrap: break-word;
        }

        /* ===== Meta Grid ===== */
        .request-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 16px 20px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          border-radius: 14px;
        }

        .request-meta-grid .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .request-meta-grid .label {
          font-size: 10.5px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .request-meta-grid .value {
          font-size: 14px;
          font-weight: 700;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ===== Description Card ===== */
        .request-description-card {
          background: linear-gradient(135deg, #f8fdfb 0%, #eef8f3 100%);
          border: 1px solid #d1ede0;
          border-left: 4px solid #13795b;
          border-radius: 14px;
          padding: 18px 22px;
        }

        .request-description-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 12.5px;
          font-weight: 800;
          color: #0b5b43;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .request-description-card-header i {
          width: 28px;
          height: 28px;
          background: white;
          border-radius: 8px;
          display: grid;
          place-items: center;
          color: #13795b;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(19, 121, 91, 0.1);
        }

        .request-description-card-body {
          font-size: 14.5px;
          line-height: 1.8;
          color: #334155;
          font-weight: 500;
          white-space: pre-wrap;
        }

        /* ===== Specs Table ===== */
        .request-specs-wrapper {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 14px;
          overflow: hidden;
        }

        .request-specs-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .request-specs-table tr {
          border-bottom: 1px solid #f1f5f7;
        }

        .request-specs-table tr:last-child {
          border-bottom: none;
        }

        .request-specs-table td {
          padding: 12px 16px;
          font-size: 13.5px;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .request-specs-table .label {
          font-weight: 700;
          color: #0b1f18;
          background: #f5f8f6;
          width: 38%;
          min-width: 140px;
        }

        .request-specs-table .label i {
          color: #13795b;
          margin-right: 10px;
          font-size: 12px;
          width: 14px;
          text-align: center;
        }

        .request-specs-table .label span {
          display: inline;
        }

        .request-specs-table .value {
          color: #334155;
          background: white;
        }

        .request-specs-table .value-with-flag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* ============================================================
           Related Requests
           ============================================================ */
        .related-requests-section {
          margin-top: 12px;
        }

        .related-requests-section .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f7;
          flex-wrap: wrap;
        }

        .related-requests-section .section-title {
          font-size: 20px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .related-requests-section .section-title i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 6px;
          border-radius: 8px;
          font-size: 14px;
        }

        .related-requests-section .section-more {
          color: #13795b;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.2s ease;
        }

        .related-requests-section .section-more:hover {
          gap: 10px;
        }

        .compact-requests-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .related-request-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
          min-width: 0;
        }

        .compact-request-card {
          background: white;
          border: 1px solid #e8edf0;
          border-left: 4px solid #13795b;
          border-radius: 12px;
          padding: 14px 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
          min-width: 0;
        }

        .compact-request-card.wanted {
          border-left-color: #ef4444;
        }

        .related-request-link:hover .compact-request-card {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(19, 121, 91, 0.1);
        }

        .request-badge-sm {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 50px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          width: fit-content;
        }

        .request-badge-sm.verified {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .request-badge-sm.urgent {
          background: #fee2e2;
          color: #b91c1c;
        }

        .related-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0b1f18;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .related-desc {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 34px;
          flex: 1;
        }

        .related-footer {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10.5px;
          color: #94a3b8;
          padding-top: 8px;
          border-top: 1px solid #f1f5f7;
          margin-top: auto;
        }

        .related-footer span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ============================================================
           Responsive
           ============================================================ */

        @media (max-width: 1200px) {
          .request-detail-row {
            grid-template-columns: 320px minmax(0, 1fr);
            gap: 24px;
          }

          .compact-requests-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 992px) {
          .request-detail-row {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .request-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .request-title {
            font-size: 22px;
          }

          .compact-requests-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .request-detail-container {
            padding: 0 16px;
          }

          .request-breadcrumb {
            padding: 12px 0 14px;
          }

          .breadcrumb-list {
            font-size: 12px;
          }

          .request-title {
            font-size: 20px;
          }

          .request-meta-grid {
            padding: 14px 16px;
          }

          .request-meta-grid .value {
            font-size: 13px;
          }

          .request-description-card {
            padding: 16px 18px;
          }

          .request-description-card-body {
            font-size: 13.5px;
          }

          .request-specs-table td {
            padding: 10px 12px;
            font-size: 12.5px;
          }

          .request-specs-table .label {
            width: 45%;
            min-width: 110px;
          }

          .related-requests-section .section-title {
            font-size: 17px;
          }

          .related-requests-section .section-title i {
            padding: 5px;
            font-size: 13px;
          }
        }

        @media (max-width: 500px) {
          .request-detail-container {
            padding: 0 12px;
          }

          .request-detail-row {
            gap: 18px;
            margin-bottom: 24px;
          }

          .request-info {
            gap: 16px;
          }

          .request-title {
            font-size: 18px;
            line-height: 1.35;
          }

          .request-badge-lg {
            padding: 5px 12px;
            font-size: 10px;
          }

          .request-status {
            font-size: 11.5px;
          }

          .request-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            padding: 12px 14px;
          }

          .request-meta-grid .value {
            font-size: 12.5px;
          }

          .request-description-card {
            padding: 14px 16px;
          }

          .request-description-card-body {
            font-size: 13px;
            line-height: 1.7;
          }

          .request-specs-table td {
            padding: 8px 10px;
            font-size: 12px;
          }

          .request-specs-table .label {
            width: 48%;
            min-width: 100px;
          }

          .request-specs-table .label i {
            margin-right: 6px;
            font-size: 11px;
            width: 12px;
          }

          .compact-requests-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .related-requests-section .section-header {
            margin-bottom: 14px;
          }

          .related-requests-section .section-title {
            font-size: 15px;
          }

          .related-requests-section .section-more {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}