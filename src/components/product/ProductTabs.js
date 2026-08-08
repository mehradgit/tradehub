// src/components/product/ProductTabs.js
"use client";

import { useState } from "react";

export default function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState("desc");

  const tabs = [
    { id: "desc", label: "Description" },
    { id: "specs", label: "Specifications" },
    { id: "reviews", label: "Reviews" },
  ];

  // تاریخ به‌صورت خوانا
  const formattedDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  // بررسی وجود توضیحات
  const hasShortDesc = product.shortDesc && product.shortDesc.length > 0;
  const hasFullDesc = product.fullDesc && product.fullDesc.length > 0;
  const hasAnyDescription = hasShortDesc || hasFullDesc;

  return (
    <div id="product-description" className="product-tabs-wrapper">
      {/* ====== هدر تب‌ها ====== */}
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== تب Description ====== */}
      <div className={`tab-content ${activeTab === "desc" ? "active" : ""}`}>
        {hasAnyDescription ? (
          <>
            {/* خلاصه */}
            {hasShortDesc && (
              <div className="mb-4">
                <h5 className="description-label">Summary</h5>
                <p className="description-text">{product.shortDesc}</p>
              </div>
            )}
            {/* توضیحات کامل */}
            {hasFullDesc && (
              <div>
                <h5 className="description-label">Full Description</h5>
                <div
                  className="product-full-description"
                  dangerouslySetInnerHTML={{ __html: product.fullDesc }}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-muted">No description available.</p>
        )}
      </div>

      {/* ====== تب Specifications ====== */}
      <div className={`tab-content ${activeTab === "specs" ? "active" : ""}`}>
        <table className="tab-spec-table">
          <tbody>
            <tr>
              <td className="label">
                <i className="fas fa-tag"></i> Product Name
              </td>
              <td className="value">{product.name || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-folder"></i> Category
              </td>
              <td className="value">{product.category || "—"}</td>
            </tr>
            {product.subCategory && (
              <tr>
                <td className="label">
                  <i className="fas fa-folder-open"></i> Sub-Category
                </td>
                <td className="value">{product.subCategory}</td>
              </tr>
            )}
            <tr>
              <td className="label">
                <i className="fas fa-globe"></i> Origin
              </td>
              <td className="value">{product.origin || product.country || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-certificate"></i> Certifications
              </td>
              <td className="value">{product.certifications || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-box"></i> Packaging
              </td>
              <td className="value">{product.packaging || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-weight-hanging"></i> Minimum Order
              </td>
              <td className="value">
                {product.moq || "—"} {product.unit || ""}
              </td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-ship"></i> Shipping Terms
              </td>
              <td className="value">{product.shippingTerms || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-clock"></i> Lead Time
              </td>
              <td className="value">
                {product.leadTime ? `${product.leadTime} days` : "—"}
              </td>
            </tr>
            <tr>
              <td className="label">
                <i className="fas fa-calendar-check"></i> Listed
              </td>
              <td className="value">{formattedDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== تب Reviews ====== */}
      <div className={`tab-content ${activeTab === "reviews" ? "active" : ""}`}>
        <div className="review-item">
          <div className="review-header">
            <span className="reviewer">John Doe</span>
            <span className="review-date">2 weeks ago</span>
          </div>
          <div className="review-rating">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
          </div>
          <p className="review-text">
            Excellent quality! The honey is pure and has a wonderful flavor.
            Highly recommended.
          </p>
        </div>

        <div className="review-item">
          <div className="review-header">
            <span className="reviewer">Sarah Smith</span>
            <span className="review-date">1 month ago</span>
          </div>
          <div className="review-rating">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star-half-alt"></i>
          </div>
          <p className="review-text">
            Great product, fast shipping. Will order again.
          </p>
        </div>

        <div className="review-item">
          <div className="review-header">
            <span className="reviewer">Mike Johnson</span>
            <span className="review-date">2 months ago</span>
          </div>
          <div className="review-rating">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
          </div>
          <p className="review-text">
            Premium quality honey. The packaging was excellent and delivery was
            on time.
          </p>
        </div>

        {/* دکمه افزودن نظر (نمونه) */}
        <div className="text-center mt-4">
          <button className="btn btn-outline-primary rounded-pill px-4">
            <i className="fas fa-plus me-2"></i>Write a Review
          </button>
        </div>
      </div>

      {/* ====== استایل‌های داخلی ====== */}
      <style jsx>{`
        .product-tabs-wrapper {
          width: 100%;
          background: white;
          border-radius: var(--radius-lg);
          padding: 24px 32px;
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-light);
          max-width: 100%; 
          overflow: hidden; 
        }

        .tabs-header {
          display: flex;
          gap: 24px;
          border-bottom: 2px solid var(--gray-light);
          margin-bottom: 24px;
        }

        .tab-btn {
          padding: 10px 0;
          background: none;
          border: none;
          font-weight: 700;
          font-size: 15px;
          color: var(--gray);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: var(--transition);
        }

        .tab-btn:hover {
          color: var(--black);
        }

        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .tab-content {
          display: none;
          animation: fadeIn 0.3s ease;
        }

        .tab-content.active {
          display: block;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ====== تب Description ====== */
        .description-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray);
          margin: 0 0 4px 0;
        }

        .description-text {
          color: var(--gray-dark);
          font-size: 15px;
          line-height: 1.8;
          margin: 0;
        }

        .product-full-description {
          color: var(--gray-dark);
          font-size: 15px;
          line-height: 1.8;
        }

        .product-full-description h1,
        .product-full-description h2,
        .product-full-description h3,
        .product-full-description h4,
        .product-full-description h5,
        .product-full-description h6 {
          margin: 12px 0 8px 0;
          font-family: "Poppins", sans-serif;
        }

        .product-full-description ul,
        .product-full-description ol {
          padding-left: 24px;
          margin: 8px 0;
        }

        .product-full-description li {
          margin-bottom: 4px;
        }

        .product-full-description strong {
          font-weight: 700;
        }

        .product-full-description em {
          font-style: italic;
        }

        .product-full-description u {
          text-decoration: underline;
        }

        .product-full-description a {
          color: var(--primary);
          text-decoration: none;
        }

        .product-full-description a:hover {
          text-decoration: underline;
        }

        .product-full-description img {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
        }

        /* ====== جدول مشخصات ====== */
        .tab-spec-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: var(--radius);
          table-layout: fixed;
          overflow: hidden;
        }

        .tab-spec-table tr {
          border-bottom: 1px solid var(--gray-light);
        }

        .tab-spec-table tr:last-child {
          border-bottom: none;
        }

        .tab-spec-table td {
          padding: 14px 20px;
          font-size: 14px;
          vertical-align: middle;
          word-wrap: break-word;
        }

        .tab-spec-table .label {
          font-weight: 700;
          color: var(--black);
          background: var(--light);
          width: 35%;
          min-width: 140px;
        }

        .tab-spec-table .label i {
          width: 20px;
          color: var(--primary);
          margin-right: 10px;
        }

        .tab-spec-table .value {
          color: var(--gray-dark);
          background: var(--white);
        }

        /* ====== نظرات ====== */
        .review-item {
          border-bottom: 1px solid var(--gray-light);
          padding: 16px 0;
        }

        .review-item:last-child {
          border-bottom: none;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .reviewer {
          font-weight: 700;
          color: var(--black);
        }

        .review-date {
          font-size: 12px;
          color: var(--gray);
        }

        .review-rating {
          color: var(--secondary);
          font-size: 14px;
          margin: 4px 0;
        }

        .review-text {
          color: var(--gray-dark);
          font-size: 14px;
          line-height: 1.6;
          margin: 4px 0 0 0;
        }

        /* ====== ریسپانسیو ====== */
        @media (max-width: 768px) {
          .product-tabs-wrapper {
            padding: 16px;
          }

          .tabs-header {
            flex-wrap: wrap;
            gap: 12px;
          }

          .tab-btn {
            font-size: 13px;
          }

          .tab-spec-table td {
            padding: 10px 12px;
            font-size: 13px;
          }

          .tab-spec-table .label {
            width: 40%;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}