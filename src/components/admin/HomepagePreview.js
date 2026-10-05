// src/components/admin/HomepagePreview.js
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

export default function HomepagePreview({ isOpen, onClose, sections }) {
  const [mounted, setMounted] = useState(false);
  const [previewData, setPreviewData] = useState({}); // sectionId → items[]
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  const activeSections = useMemo(
    () =>
      sections
        .filter((s) => s.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [sections]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // ===== Fetch preview data =====
  useEffect(() => {
    if (!isOpen || activeSections.length === 0) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/homepage-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: activeSections }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        if (cancelled) return;

        setPreviewData(data.preview || {});
      } catch (err) {
        console.error("Preview fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeSections]);

  // ===== ESC to close =====
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const previewContent = (
    <div className="hp-overlay" onClick={onClose}>
      <div className="hp-container" onClick={(e) => e.stopPropagation()}>
        {/* ===== Header ===== */}
        <div className="hp-header">
          <div className="hp-header-left">
            <div className="hp-header-icon">
              <i className="fa-solid fa-eye"></i>
            </div>
            <div>
              <div className="hp-title">Live Preview</div>
              <div className="hp-subtitle">
                {activeSections.length} active section
                {activeSections.length !== 1 ? "s" : ""} · how visitors see your
                homepage
              </div>
            </div>
          </div>
          <button className="hp-close" onClick={onClose} title="Close (Esc)">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="hp-body">
          {loading ? (
            <div className="hp-loading">
              <div className="hp-spinner" />
              <p>Loading preview...</p>
            </div>
          ) : activeSections.length === 0 ? (
            <div className="hp-empty">
              <i className="fa-solid fa-layer-group"></i>
              <h3>No active sections</h3>
              <p>Activate at least one section to see a preview.</p>
            </div>
          ) : (
            <div className="hp-page">
              {/* ===== Fake Hero ===== */}
              <div className="hp-fake-hero">
                <div className="hp-fake-hero-content">
                  <div className="hp-fake-badge">HERO SECTION</div>
                  <h1>Trade Food Products Without Borders</h1>
                  <p>
                    Connect with verified food suppliers and buyers from
                    around the world.
                  </p>
                </div>
              </div>

              {/* ===== Fake Trust Bar ===== */}
              <div className="hp-fake-trust">
                <div>98% Buyer Satisfaction</div>
                <div>24/7 Global Support</div>
                <div>15K+ Trade Opportunities</div>
                <div>Secure Verification</div>
              </div>

              {/* ===== Sections ===== */}
              {activeSections.map((section, idx) => (
                <div key={section.id} className="hp-section">
                  <div className="hp-section-header">
                    <div>
                      <h2 className="hp-section-title">
                        {section.icon && (
                          <i className={`fas ${section.icon}`}></i>
                        )}
                        {section.title}
                      </h2>
                      {section.subtitle && (
                        <p className="hp-section-subtitle">
                          {section.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="hp-section-more">
                      View All <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>

                  {/* Items */}
                  {previewData[section.id]?.length > 0 ? (
                    section.type === "products" ? (
                      <div className="hp-products-grid">
                        {previewData[section.id].map((p) => (
                          <PreviewProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    ) : (
                      <div className="hp-requests-grid">
                        {previewData[section.id].map((r) => (
                          <PreviewRequestCard key={r.id} request={r} />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="hp-section-empty">
                      <i className="fa-solid fa-inbox"></i>
                      No items match this section&apos;s criteria
                    </div>
                  )}

                  {/* Insert marker for Categories + Feature Group */}
                  {idx === 0 && (
                    <div className="hp-insert-marker">
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Categories + Feature Group</span>
                    </div>
                  )}
                </div>
              ))}

              {/* ===== Fake Sections (bottom) ===== */}
              <div className="hp-fake-bottom">
                <div className="hp-fake-bottom-block">Company Ads</div>
                <div className="hp-fake-bottom-block">Marketplace</div>
                <div className="hp-fake-bottom-block">CTA</div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Footer ===== */}
        <div className="hp-footer">
          <div className="hp-footer-info">
            <i className="fa-solid fa-info-circle"></i>
            Preview uses current data. Changes are visible after saving.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="hp-btn ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: hpFadeIn 0.2s ease;
        }

        @keyframes hpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .hp-container {
          background: #f6f8f9;
          border-radius: 20px;
          width: 100%;
          max-width: 1100px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
          animation: hpSlideUp 0.3s ease;
        }

        @keyframes hpSlideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Header */
        .hp-header {
          padding: 16px 22px;
          background: white;
          border-bottom: 1px solid #e8edf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .hp-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .hp-header-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          display: grid;
          place-items: center;
          font-size: 16px;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
        }

        .hp-title {
          font: 800 15px "Manrope", sans-serif;
          color: #0b1f18;
          letter-spacing: -0.01em;
        }

        .hp-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .hp-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f1f5f7;
          border: 0;
          color: #64748b;
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 14px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .hp-close:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Body */
        .hp-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .hp-loading,
        .hp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 12px;
          text-align: center;
          color: #94a3b8;
        }

        .hp-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e8edf0;
          border-top-color: #13795b;
          border-radius: 50%;
          animation: hpSpin 0.8s linear infinite;
        }

        @keyframes hpSpin {
          to { transform: rotate(360deg); }
        }

        .hp-empty i {
          font-size: 48px;
          opacity: 0.3;
        }

        .hp-empty h3 {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
          margin: 4px 0;
          font-family: "Manrope", sans-serif;
        }

        .hp-empty p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        .hp-page {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Fake Hero */
        .hp-fake-hero {
          padding: 40px 32px;
          background: linear-gradient(135deg, #eff9f4, #e9f5ef);
          border-radius: 16px;
          border: 2px dashed #a7f3d0;
          opacity: 0.7;
        }

        .hp-fake-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 50px;
          background: white;
          color: #0b5b43;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .hp-fake-hero h1 {
          font: 800 24px "Manrope", sans-serif;
          color: #0b1f18;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .hp-fake-hero p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        /* Fake Trust */
        .hp-fake-trust {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 14px;
          background: white;
          border-radius: 14px;
          border: 2px dashed #e8edf0;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-align: center;
          opacity: 0.6;
        }

        /* Section */
        .hp-section {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .hp-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f7;
          flex-wrap: wrap;
        }

        .hp-section-title {
          font: 800 18px "Manrope", sans-serif;
          color: #0b1f18;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }

        .hp-section-title i {
          color: #13795b;
          background: #eaf7f1;
          padding: 6px;
          border-radius: 8px;
          font-size: 13px;
        }

        .hp-section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .hp-section-more {
          color: #13795b;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .hp-section-more i {
          margin-left: 4px;
          font-size: 10px;
        }

        /* Products Grid */
        .hp-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }

        /* Requests Grid */
        .hp-requests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }

        .hp-section-empty {
          padding: 30px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          background: #f8fafc;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .hp-section-empty i {
          font-size: 24px;
          opacity: 0.4;
        }

        /* Insert Marker */
        .hp-insert-marker {
          margin-top: 16px;
          padding: 12px;
          border: 2px dashed #cbd5d1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #fafcfb;
        }

        /* Fake Bottom */
        .hp-fake-bottom {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          opacity: 0.5;
        }

        .hp-fake-bottom-block {
          padding: 30px 16px;
          background: #f8fafc;
          border: 2px dashed #e8edf0;
          border-radius: 14px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Footer */
        .hp-footer {
          padding: 12px 22px;
          background: white;
          border-top: 1px solid #e8edf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        .hp-footer-info {
          font-size: 11.5px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hp-footer-info i {
          color: #13795b;
        }

        .hp-btn {
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .hp-btn.ghost {
          background: white;
          border: 1px solid #e8edf0;
          color: #334155;
        }

        .hp-btn.ghost:hover {
          border-color: #13795b;
          color: #13795b;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .hp-overlay {
            padding: 0;
          }

          .hp-container {
            border-radius: 0;
            height: 100vh;
            max-width: 100%;
          }

          .hp-body {
            padding: 16px;
          }

          .hp-fake-hero {
            padding: 24px 20px;
          }

          .hp-fake-hero h1 {
            font-size: 18px;
          }

          .hp-fake-trust {
            grid-template-columns: repeat(2, 1fr);
          }

          .hp-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 8px;
          }

          .hp-section-title {
            font-size: 15px;
          }

          .hp-section {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(previewContent, document.body);
}

// ===== Product Card (compact) =====
function PreviewProductCard({ product }) {
  const img =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : null;

  return (
    <div className="ppc-card">
      <div className="ppc-image">
        {img ? (
          <img src={img} alt={product.name} />
        ) : (
          <div className="ppc-placeholder">
            <i className="fas fa-image"></i>
          </div>
        )}
      </div>
      <div className="ppc-body">
        <div className="ppc-category">{product.category || "—"}</div>
        <div className="ppc-title">{product.name}</div>
        <div className="ppc-price">
          {product.currency || "USD"} {product.price}
          <span className="ppc-unit">/{product.unit}</span>
        </div>
      </div>

      <style jsx>{`
        .ppc-card {
          background: #f8fafc;
          border: 1px solid #e8edf0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .ppc-card:hover {
          border-color: #13795b;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.08);
        }

        .ppc-image {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #f5f8f6;
          overflow: hidden;
        }

        .ppc-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ppc-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #cbd5d1;
          font-size: 24px;
        }

        .ppc-body {
          padding: 10px;
        }

        .ppc-category {
          font-size: 9.5px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .ppc-title {
          font-size: 12px;
          font-weight: 700;
          color: #0b1f18;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 32px;
        }

        .ppc-price {
          font-size: 12px;
          font-weight: 800;
          color: #13795b;
          margin-top: 6px;
          font-family: "Manrope", sans-serif;
        }

        .ppc-unit {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

// ===== Request Card (compact) =====
function PreviewRequestCard({ request }) {
  return (
    <div className="prc-card">
      <div className="prc-top">
        <span className="prc-category">{request.category || "—"}</span>
        {request.isUrgent && <span className="prc-urgent">Urgent</span>}
      </div>
      <div className="prc-title">{request.title}</div>
      <div className="prc-desc">{request.description}</div>
      <div className="prc-meta">
        <span>
          <i className="fas fa-cube"></i> {request.quantity} {request.unit}
        </span>
        {request.deliveryCountry && (
          <span>
            <i className="fas fa-map-marker-alt"></i>{" "}
            {request.deliveryCountry}
          </span>
        )}
      </div>

      <style jsx>{`
        .prc-card {
          background: white;
          border: 1px solid #e8edf0;
          border-left: 4px solid #13795b;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .prc-card:hover {
          border-color: #13795b;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.08);
        }

        .prc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .prc-category {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .prc-urgent {
          padding: 2px 8px;
          border-radius: 50px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .prc-title {
          font-size: 13px;
          font-weight: 800;
          color: #0b1f18;
          line-height: 1.35;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .prc-desc {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .prc-meta {
          display: flex;
          gap: 12px;
          font-size: 10.5px;
          color: #94a3b8;
          padding-top: 8px;
          border-top: 1px solid #f1f5f7;
          flex-wrap: wrap;
        }

        .prc-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .prc-meta i {
          font-size: 9px;
        }
      `}</style>
    </div>
  );
}