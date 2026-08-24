// src/components/profiles/ProfileTabs.js
"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";
import CountryFlag from "@/components/ui/CountryFlag";
import DOMPurify from "dompurify";
import { getCountryName } from "@/lib/countries";

export default function ProfileTabs({ user, products, buyingRequests }) {
  const [activeTab, setActiveTab] = useState("overview");
  const isSupplier = user.role === "SUPPLIER";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
  ];

  if (isSupplier) {
    tabs.push({ id: "products", label: `Products (${products?.length || 0})` });
  } else {
    tabs.push({
      id: "requests",
      label: `Requests (${buyingRequests?.length || 0})`,
    });
  }

  const socialLinks = user.socialLinks || {};
  const sanitizedBio = DOMPurify.sanitize(user.bio || "");

  return (
    <div className="profile-tabs">
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

      {/* ====== Overview Tab ====== */}
      <div
        className={`tab-content ${activeTab === "overview" ? "active" : ""}`}
      >
        <div className="overview-grid">
          <div className="bio-section">
            <h4>About {user.companyName || user.name}</h4>
            <div
              className="bio-content"
              dangerouslySetInnerHTML={{ __html: sanitizedBio }}
            />
            {user.website && (
              <p style={{ marginTop: "12px" }}>
                <strong>Website:</strong>{" "}
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--primary)" }}
                >
                  {user.website}
                </a>
              </p>
            )}
            {Object.keys(socialLinks).length > 0 && (
              <div className="social-links mt-3">
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
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
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-map-pin"></i>
              </div>
              <div className="info-text">
                <strong>Location</strong>
                <CountryFlag countryCode={user.countryCode} size="16px" />
                {getCountryName(user.countryCode)}
                {user.address || user.country || "Not specified"}
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-phone"></i>
              </div>
              <div className="info-text">
                <strong>Phone</strong>
                {user.phone || "Not specified"}
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="info-text">
                <strong>Email</strong>
                {user.companyEmail || user.email || "Not specified"}
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="info-text">
                <strong>Team Size</strong>
                {user.employeeCount || "Not specified"} employees
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="info-text">
                <strong>Member Since</strong>
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-tag"></i>
              </div>
              <div className="info-text">
                <strong>Role</strong>
                <span
                  className="badge"
                  style={{
                    background: isSupplier ? "var(--primary)" : "var(--accent)",
                    color: "white",
                    padding: "4px 12px",
                  }}
                >
                  {isSupplier ? "Supplier" : "Buyer"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Details Tab ====== */}
      <div className={`tab-content ${activeTab === "details" ? "active" : ""}`}>
        <div className="details-grid">
          <div className="detail-item">
            <div className="label">Company Name</div>
            <div className="value">{user.companyName || user.name || "—"}</div>
          </div>
          <div className="detail-item">
            <div className="label">Business Type</div>
            <div className="value">{user.businessType || "—"}</div>
          </div>
          <div className="detail-item">
            <div className="label">Country</div>
            <div className="value">{user.country || "—"}</div>
          </div>
          <div className="detail-item">
            <div className="label">Membership Plan</div>
            <div className="value">
              <span
                className="badge"
                style={{
                  background:
                    user.plan === "GOLD"
                      ? "var(--secondary)"
                      : "var(--primary)",
                  color: "white",
                  padding: "4px 12px",
                }}
              >
                {user.plan || "FREE"}
              </span>
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Email</div>
            <div className="value">
              {user.companyEmail || user.email || "—"}
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Phone</div>
            <div className="value">{user.phone || "—"}</div>
          </div>
          <div className="detail-item">
            <div className="label">Website</div>
            <div className="value">
              {user.website ? (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--primary)" }}
                >
                  {user.website}
                </a>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Address</div>
            <div className="value">{user.address || "—"}</div>
          </div>
          <div className="detail-item">
            <div className="label">Employee Count</div>
            <div className="value">{user.employeeCount || "—"}</div>
          </div>
          <div className="detail-item">
            <div className="label">Member Since</div>
            <div className="value">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====== Products Tab ====== */}
      {isSupplier && (
        <div
          className={`tab-content ${activeTab === "products" ? "active" : ""}`}
        >
          {products && products.length > 0 ? (
            <div className="supplier-products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No products listed yet</h5>
              <p className="text-muted small">
                This supplier hasn't added any products.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ====== Requests Tab ====== */}
      {!isSupplier && (
        <div
          className={`tab-content ${activeTab === "requests" ? "active" : ""}`}
        >
          {buyingRequests && buyingRequests.length > 0 ? (
            <div className="requests-grid">
              {buyingRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="text-decoration-none"
                >
                  <div
                    className={`request-card ${request.isUrgent ? "wanted" : ""}`}
                  >
                    <div className="request-header">
                      <h3 className="request-title">{request.title}</h3>
                      <span
                        className={`request-badge ${request.isUrgent ? "urgent" : "verified"}`}
                      >
                        {request.isUrgent ? "Urgent" : "Open"}
                      </span>
                    </div>
                    <p className="request-description">{request.description}</p>
                    <div className="request-meta">
                      <span className="meta-item">
                        <i className="fas fa-tag"></i>
                        <span className="budget">
                          {request.budgetRange || "Negotiable"}
                        </span>
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-map-pin"></i>
                        {request.deliveryCountry || "—"}
                      </span>
                      <span className="meta-item">
                        <i className="far fa-calendar-alt"></i>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No buying requests yet</h5>
              <p className="text-muted small">
                This buyer hasn't posted any requests.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}