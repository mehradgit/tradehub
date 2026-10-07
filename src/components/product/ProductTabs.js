// src/components/product/ProductTabs.js
"use client";

import { useState } from "react";
import ProductReviews from "./ProductReviews";
// ============================================================
// Dynamic attributes (EAV) — formatting for display
//
// getProductAttributes() returns the following for each attribute:
//   { attributeId, key, label, dataType, unit, options, values, value }
//   - value  : an array for multiSelect, otherwise a single value
//   - values : always the raw array (string | number | boolean)
// ============================================================
function formatAttributeLabel(attr) {
  const base = attr?.label || attr?.key;
  if (!base) return null;
  // Measurement unit in parentheses next to the label
  return attr?.unit ? `${base} (${attr.unit})` : String(base);
}

function formatAttributeValue(attr) {
  if (!attr) return null;

  // Normalise the raw values into a single shape (array or single value)
  const rawList =
    Array.isArray(attr.values) && attr.values.length > 0
      ? attr.values
      : Array.isArray(attr.value)
        ? attr.value
        : attr.value === null || attr.value === undefined
          ? []
          : [attr.value];

  // Empty rows ("" / null / undefined / []) are not displayed
  const list = rawList.filter(
    (v) =>
      v !== null &&
      v !== undefined &&
      !(typeof v === "string" && v.trim() === "") &&
      !(Array.isArray(v) && v.length === 0),
  );

  if (list.length === 0) return null;

  const unit = attr.unit ? ` ${attr.unit}` : "";

  // boolean → Yes / No
  if (attr.dataType === "boolean" || typeof list[0] === "boolean") {
    const truthy =
      list[0] === true ||
      list[0] === "true" ||
      list[0] === 1 ||
      list[0] === "1";
    return truthy ? "Yes" : "No";
  }

  // number → number (together with the unit, if any)
  if (attr.dataType === "number") {
    const nums = list.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    if (nums.length === 0) return null;
    return `${nums.join(", ")}${unit}`;
  }

  // text | select | multiSelect → strings joined together with ", "
  const parts = list.map((v) => String(v).trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

export default function ProductTabs({ product, attributes }) {
  const [activeTab, setActiveTab] = useState("desc");

  // attributes can be passed as a prop or come from inside product
  const attributeList = Array.isArray(attributes)
    ? attributes
    : Array.isArray(product?.attributes)
      ? product.attributes
      : [];

  // Only rows that have both a displayable label and a displayable value
  const attributeRows = attributeList
    .map((attr) => ({
      id: attr?.attributeId || attr?.key,
      label: formatAttributeLabel(attr),
      value: formatAttributeValue(attr),
    }))
    .filter((row) => row.label && row.value !== null);

  const tabs = [
    { id: "desc", label: "Description" },
    { id: "specs", label: "Specifications" },
    { id: "reviews", label: "Reviews" },
  ];

  // Human-readable date
  const formattedDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "—";

  // Check whether a description exists
  const hasShortDesc = product.shortDesc && product.shortDesc.length > 0;
  const hasFullDesc = product.fullDesc && product.fullDesc.length > 0;
  const hasAnyDescription = hasShortDesc || hasFullDesc;

  return (
    <div id="product-description" className="product-tabs-wrapper">
      {/* ====== Tabs header ====== */}
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

      {/* ====== Description tab ====== */}
      <div className={`tab-content ${activeTab === "desc" ? "active" : ""}`}>
        {hasAnyDescription ? (
          <>
            {/* Full description */}
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

      {/* ====== Specifications tab ====== */}
      <div className={`tab-content ${activeTab === "specs" ? "active" : ""}`}>
        <table className="tab-spec-table">
          <tbody>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-tag"></i>
                  <span className="label-text">Product Name</span>
                </div>
              </td>
              <td className="value">{product.name || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-folder"></i>
                  <span className="label-text">Category</span>
                </div>
              </td>
              <td className="value">{product.category || "—"}</td>
            </tr>
            {product.subCategory && (
              <tr>
                <td className="label">
                  <div className="label-inner">
                    <i className="fas fa-folder-open"></i>
                    <span className="label-text">Sub-Category</span>
                  </div>
                </td>
                <td className="value">{product.subCategory}</td>
              </tr>
            )}
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-globe"></i>
                  <span className="label-text">Origin</span>
                </div>
              </td>
              <td className="value">
                {product.origin || product.country || "—"}
              </td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-certificate"></i>
                  <span className="label-text">Certifications</span>
                </div>
              </td>
              <td className="value">{product.certifications || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-box"></i>
                  <span className="label-text">Packaging</span>
                </div>
              </td>
              <td className="value">{product.packaging || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-weight-hanging"></i>
                  <span className="label-text">Minimum Order</span>
                </div>
              </td>
              <td className="value">
                {product.moq || "—"} {product.unit || ""}
              </td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-ship"></i>
                  <span className="label-text">Shipping Terms</span>
                </div>
              </td>
              <td className="value">{product.shippingTerms || "—"}</td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-clock"></i>
                  <span className="label-text">Lead Time</span>
                </div>
              </td>
              <td className="value">
                {product.leadTime ? `${product.leadTime} days` : "—"}
              </td>
            </tr>
            <tr>
              <td className="label">
                <div className="label-inner">
                  <i className="fas fa-calendar-check"></i>
                  <span className="label-text">Listed</span>
                </div>
              </td>
              <td className="value">{formattedDate}</td>
            </tr>
          </tbody>
        </table>

        {/* ============================================================
            Dynamic attributes (EAV) — only when a value has been stored
            (if there are no attributes, no empty heading/table is rendered)
            ============================================================ */}
        {attributeRows.length > 0 && (
          <>
            <h5 className="description-label mt-3">Specifications</h5>
            <table className="tab-spec-table">
              <tbody>
                {attributeRows.map((row, index) => (
                  <tr key={row.id || index}>
                    <td className="label">
                      <div className="label-inner">
                        <i className="fas fa-list-alt"></i>
                        <span className="label-text" title={row.label}>
                          {row.label}
                        </span>
                      </div>
                    </td>
                    <td className="value">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* ====== Reviews tab ====== */}
      <div className={`tab-content ${activeTab === "reviews" ? "active" : ""}`}>
        <ProductReviews productId={product.id} productOwnerId={product.userId} />
      </div>

      {/* ====== Scoped styles ====== */}
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

        /* ====== Description tab ====== */
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

        /* ====== Specifications table ====== */
        .tab-spec-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border-radius: 12px;
  overflow: hidden;
}

.tab-spec-table tr {
  border-bottom: 1px solid #f1f5f7;
}

.tab-spec-table tr:last-child {
  border-bottom: none;
}

.tab-spec-table td {
  padding: 12px 16px;
  font-size: 13.5px;
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Label cell — icon and text on a single line */
.tab-spec-table td.label {
  font-weight: 700;
  color: #0b1f18;
  background: #f5f8f6;
  width: 38%;
  min-width: 120px;
}

/* Key fix: icon and text in a single flex row */
.tab-spec-table td.label .label-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tab-spec-table td.label i {
  color: #13795b;
  font-size: 12px;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}

.tab-spec-table td.label .label-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-spec-table td.value {
  color: #33413d;
  background: white;
}
  @media (max-width: 650px) {
  .tab-spec-table td {
    padding: 10px 12px;
    font-size: 12.5px;
  }

  .tab-spec-table td.label {
    width: 45%;
    min-width: 110px;
  }

  .tab-spec-table td.label .label-inner {
    gap: 6px;
  }

  .tab-spec-table td.label i {
    font-size: 11px;
    width: 12px;
  }

  /* Keep the label text nowrap on mobile too */
  .tab-spec-table td.label .label-text {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-spec-table td.value {
    font-size: 12.5px;
    word-break: break-word;
  }
}

@media (max-width: 400px) {
  .tab-spec-table td {
    padding: 8px 10px;
    font-size: 12px;
  }

  .tab-spec-table td.label {
    width: 48%;
    min-width: 100px;
  }

  .tab-spec-table td.label .label-text {
    font-size: 11.5px;
  }

  .tab-spec-table td.label i {
    font-size: 10px;
    width: 10px;
  }
}

        /* ====== Reviews ====== */
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

        /* ====== Responsive ====== */
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