// src/components/profiles/ProfileTabs.js
"use client";

import { useState } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";
import ProductCard from "@/components/home/ProductCard";
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryName } from "@/lib/countries";

export default function ProfileTabs({ user, products = [] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxImage, setLightboxImage] = useState(null);

  const isSupplier = user.role === "SUPPLIER";

  // ✅ گالری تصاویر از ثبت‌نام
  const galleryImages = Array.isArray(user.galleryImages)
    ? user.galleryImages
    : [];

  // ✅ تب‌ها (بدون Requests)
  const tabs = [
    { id: "overview", label: "Overview", icon: "fa-info-circle" },
    { id: "products", label: "Products", count: products.length, icon: "fa-box" },
    {
      id: "gallery",
      label: "Gallery",
      count: galleryImages.length,
      icon: "fa-images",
    },
    { id: "details", label: "Details", icon: "fa-list" },
  ];

  const sanitizedBio = DOMPurify.sanitize(user.bio || "");
  const socialLinks = user.socialLinks || {};

  return (
    <>
      <div className="profile-tabs-wrapper">
        {/* ===== Tabs Header ===== */}
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ============================================================
           Tab: Overview
           ============================================================ */}
        <div className={`tab-content ${activeTab === "overview" ? "active" : ""}`}>
          <div className="overview-grid">
            {/* Bio */}
            <div className="overview-bio">
              <h3 className="section-title">
                <i className="fas fa-building"></i>
                About {user.companyName || user.name}
              </h3>
              {sanitizedBio ? (
                <div
                  className="bio-content"
                  dangerouslySetInnerHTML={{ __html: sanitizedBio }}
                />
              ) : (
                <p className="text-muted">No description available yet.</p>
              )}

              {/* Social */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="social-links">
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Website"
                    >
                      <i className="fas fa-globe"></i>
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Twitter"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="LinkedIn"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Instagram"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Facebook"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Info cards */}
            <div className="overview-cards">
              <InfoCard
                icon="fa-map-marker-alt"
                label="Location"
                value={
                  <>
                    {user.countryCode && (
                      <CountryFlag countryCode={user.countryCode} size="14px" />
                    )}{" "}
                    {user.address || user.country || "Not specified"}
                  </>
                }
              />
              <InfoCard
                icon="fa-phone"
                label="Phone"
                value={user.phone || "Not specified"}
              />
              <InfoCard
                icon="fa-envelope"
                label="Email"
                value={user.companyEmail || user.email || "Not specified"}
              />
              <InfoCard
                icon="fa-users"
                label="Team Size"
                value={user.employeeCount || "Not specified"}
              />
              <InfoCard
                icon="fa-calendar-alt"
                label="Member Since"
                value={new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              />
              <InfoCard
                icon="fa-tag"
                label="Role"
                value={
                  <span className={`role-pill ${isSupplier ? "supplier" : "buyer"}`}>
                    {isSupplier ? "Supplier" : "Buyer"}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* ============================================================
           Tab: Products
           ============================================================ */}
        <div className={`tab-content ${activeTab === "products" ? "active" : ""}`}>
          {products.length > 0 ? (
            <div className="profile-products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fa-box-open"
              title="No products listed yet"
              subtitle="This company hasn't added any products."
            />
          )}
        </div>

        {/* ============================================================
           Tab: Gallery
           ============================================================ */}
        <div className={`tab-content ${activeTab === "gallery" ? "active" : ""}`}>
          {galleryImages.length > 0 ? (
            <div className="profile-gallery-grid">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  className="gallery-item"
                  onClick={() => setLightboxImage(img)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={img} alt={`Gallery ${index + 1}`} loading="lazy" />
                  <div className="gallery-overlay">
                    <i className="fas fa-expand"></i>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fa-images"
              title="No images in gallery"
              subtitle="This company hasn't uploaded any gallery images yet."
            />
          )}
        </div>

        {/* ============================================================
           Tab: Details
           ============================================================ */}
        <div className={`tab-content ${activeTab === "details" ? "active" : ""}`}>
          <div className="details-table">
            <DetailRow label="Company Name" value={user.companyName || user.name || "—"} />
            <DetailRow label="Business Type" value={user.businessType || "—"} />
            <DetailRow
              label="Country"
              value={
                <>
                  {user.countryCode && (
                    <CountryFlag countryCode={user.countryCode} size="14px" />
                  )}{" "}
                  {getCountryName(user.countryCode) || user.country || "—"}
                </>
              }
            />
            <DetailRow label="Email" value={user.companyEmail || user.email || "—"} />
            <DetailRow label="Phone" value={user.phone || "—"} />
            <DetailRow
              label="Website"
              value={
                user.website ? (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    {user.website}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="Address" value={user.address || "—"} />
            <DetailRow label="Employees" value={user.employeeCount || "—"} />
            <DetailRow
              label="Primary Category"
              value={user.primaryCategory || "—"}
            />
            <DetailRow
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <DetailRow
              label="Plan"
              value={<span className="plan-text">{user.plan || "FREE"}</span>}
            />
          </div>
        </div>
      </div>

      {/* ===== Lightbox ===== */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button
            className="lightbox-close"
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
          <img
            src={lightboxImage}
            alt="Gallery"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ====== Styles ====== */}
      <style jsx>{`
        .profile-tabs-wrapper {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        }

        /* ============================================================
           Tabs Header
           ============================================================ */
        .tabs-header {
          display: flex;
          gap: 4px;
          padding: 8px 20px 0;
          border-bottom: 2px solid #f1f5f7;
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .tabs-header::-webkit-scrollbar {
          height: 4px;
        }
        .tabs-header::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 13.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          white-space: nowrap;
          margin-bottom: -2px;
        }

        .tab-btn:hover {
          color: #0b1f18;
          background: #f8fafc;
        }

        .tab-btn.active {
          color: #13795b;
          border-bottom-color: #13795b;
        }

        .tab-btn i {
          font-size: 13px;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: #f1f5f7;
          color: #64748b;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
        }

        .tab-btn.active .tab-count {
          background: #eaf7f1;
          color: #0b5b43;
        }

        /* ============================================================
           Tab Content
           ============================================================ */
        .tab-content {
          display: none;
          padding: 24px;
          animation: fadeIn 0.3s ease;
        }

        .tab-content.active {
          display: block;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ============================================================
           Overview Tab
           ============================================================ */
        .overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
          gap: 32px;
          align-items: start;
        }

        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          margin: 0 0 14px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-title i {
          color: #13795b;
          font-size: 14px;
        }

        .bio-content {
          font-size: 14.5px;
          line-height: 1.8;
          color: #334155;
          word-wrap: break-word;
        }

        .bio-content :global(p) {
          margin: 0 0 12px 0;
        }

        .bio-content :global(ul),
        .bio-content :global(ol) {
          padding-left: 22px;
          margin: 8px 0;
        }

        .text-muted {
          font-size: 14px;
          color: #94a3b8;
          font-style: italic;
        }

        .social-links {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .social-link {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          color: #334155;
          display: grid;
          place-items: center;
          font-size: 14px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .social-link:hover {
          background: #13795b;
          color: white;
          border-color: #13795b;
          transform: translateY(-2px);
        }

        /* ===== Overview Cards ===== */
        .overview-cards {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :global(.info-card) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          border-radius: 12px;
          min-width: 0;
        }

        :global(.info-card-icon) {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: white;
          color: #13795b;
          display: grid;
          place-items: center;
          font-size: 14px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(19, 121, 91, 0.08);
        }

        :global(.info-card-content) {
          flex: 1;
          min-width: 0;
        }

        :global(.info-card-label) {
          font-size: 10.5px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
        }

        :global(.info-card-value) {
          font-size: 13px;
          font-weight: 700;
          color: #0b1f18;
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        :global(.role-pill) {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        :global(.role-pill.supplier) {
          background: #eaf7f1;
          color: #0b5b43;
        }

        :global(.role-pill.buyer) {
          background: #eef0ff;
          color: #4f46e5;
        }

        /* ============================================================
           Products Tab
           ============================================================ */
        .profile-products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        /* ============================================================
           Gallery Tab
           ============================================================ */
        .profile-gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .gallery-item {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          padding: 0;
          border: 1px solid #e8edf0;
          background: #f5f8f6;
          transition: all 0.25s ease;
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .gallery-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: grid;
          place-items: center;
          color: white;
          font-size: 22px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .gallery-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.15);
        }

        .gallery-item:hover img {
          transform: scale(1.08);
        }

        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }

        /* ============================================================
           Details Tab
           ============================================================ */
        .details-table {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid #e8edf0;
          border-radius: 14px;
          overflow: hidden;
        }

        :global(.detail-row) {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f7;
          font-size: 13.5px;
        }

        :global(.detail-row:last-child) {
          border-bottom: none;
        }

        :global(.detail-row-label) {
          font-weight: 700;
          color: #64748b;
          font-size: 12.5px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        :global(.detail-row-value) {
          color: #0b1f18;
          font-weight: 600;
          word-wrap: break-word;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        :global(.detail-row-value .link) {
          color: #13795b;
          text-decoration: none;
        }

        :global(.detail-row-value .link:hover) {
          text-decoration: underline;
        }

        :global(.detail-row-value .plan-text) {
          display: inline-block;
          padding: 2px 10px;
          background: #eaf7f1;
          color: #0b5b43;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        /* ============================================================
           Empty State
           ============================================================ */
        :global(.empty-tab-state) {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }

        :global(.empty-tab-state i) {
          font-size: 46px;
          opacity: 0.3;
          display: block;
          margin-bottom: 14px;
        }

        :global(.empty-tab-state h4) {
          font-size: 15px;
          font-weight: 800;
          color: #334155;
          margin: 0 0 6px 0;
          font-family: "Manrope", sans-serif;
        }

        :global(.empty-tab-state p) {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        /* ============================================================
           Lightbox
           ============================================================ */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
          padding: 20px;
        }

        .lightbox-overlay img {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 18px;
          display: grid;
          place-items: center;
          transition: all 0.2s ease;
        }

        .lightbox-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 1100px) {
          .profile-products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .profile-gallery-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .overview-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .overview-cards {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
        }

        @media (max-width: 768px) {
          .tab-content {
            padding: 18px 16px;
          }

          .tabs-header {
            padding: 6px 12px 0;
          }

          .tab-btn {
            padding: 10px 14px;
            font-size: 12.5px;
            gap: 6px;
          }

          .tab-btn i {
            font-size: 12px;
          }

          .tab-count {
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            font-size: 10px;
          }

          .profile-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .profile-gallery-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }

          :global(.detail-row) {
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 10px 14px;
          }

          :global(.detail-row-label) {
            font-size: 10.5px;
          }

          :global(.detail-row-value) {
            font-size: 13px;
          }
        }

        @media (max-width: 500px) {
          .tab-content {
            padding: 16px 14px;
          }

          .tab-btn {
            padding: 10px 12px;
            font-size: 12px;
          }

          .tab-btn span:not(.tab-count) {
            font-size: 12px;
          }

          .overview-cards {
            grid-template-columns: 1fr;
          }

          .profile-products-grid {
            grid-template-columns: 1fr;
          }

          .profile-gallery-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .social-link {
            width: 34px;
            height: 34px;
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}

// ============================================================
// Sub Components
// ============================================================
function InfoCard({ icon, label, value }) {
  return (
    <div className="info-card">
      <div className="info-card-icon">
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="info-card-content">
        <div className="info-card-label">{label}</div>
        <div className="info-card-value">{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <div className="detail-row-label">{label}</div>
      <div className="detail-row-value">{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty-tab-state">
      <i className={`fas ${icon}`}></i>
      <h4>{title}</h4>
      <p>{subtitle}</p>
    </div>
  );
}