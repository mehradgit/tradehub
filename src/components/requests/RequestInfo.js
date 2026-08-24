// src/components/request/RequestInfo.js
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryCode } from "@/utils/countryHelpers";

export default function RequestInfo({ request }) {
  const isUrgent = request.isUrgent;
  const isOpen = request.isVisible;
  const createdAt = new Date(request.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const deadline = request.deadline
    ? new Date(request.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Flexible";

  const deliveryCountryCode = getCountryCode(request.deliveryCountry);

  return (
    <div className="request-info-wrapper">
      <div className="request-info-header">
        <div className="request-badges">
          {isUrgent && (
            <span className="request-badge-urgent">
              <i className="fas fa-exclamation-triangle"></i> Urgent
            </span>
          )}
          {isOpen ? (
            <span className="request-badge-open">
              <i className="fas fa-check-circle"></i> Open
            </span>
          ) : (
            <span className="request-badge-closed">
              <i className="fas fa-lock"></i> Closed
            </span>
          )}
          <span className="request-badge-verified">
            <i className="fas fa-shield-alt"></i> Verified Buyer
          </span>
        </div>
        <h1 className="request-title">{request.title}</h1>
        <div className="request-meta">
          <span className="request-meta-item">
            <i className="far fa-calendar-alt"></i> Posted: {createdAt}
          </span>
          <span className="request-meta-divider"></span>
          <span className="request-meta-item">
            <i className="far fa-clock"></i> Deadline: {deadline}
          </span>
        </div>
      </div>

      <div className="request-specs-grid">
        <div className="request-specs-column">
          <div className="request-spec-item">
            <span className="spec-label">Category</span>
            <span className="spec-value">{request.category || "—"}</span>
          </div>
          {request.subCategory && (
            <div className="request-spec-item">
              <span className="spec-label">Sub-Category</span>
              <span className="spec-value">{request.subCategory}</span>
            </div>
          )}
          <div className="request-spec-item">
            <span className="spec-label">Quantity</span>
            <span className="spec-value">
              {request.quantity} {request.unit}
            </span>
          </div>
        </div>
        <div className="request-specs-column">
          <div className="request-spec-item">
            <span className="spec-label">Budget Range</span>
            <span className="spec-value">{request.budgetRange || "Negotiable"}</span>
          </div>
          <div className="request-spec-item">
            <span className="spec-label">Delivery Location</span>
            <div className="spec-value-with-flag">
              <CountryFlag countryCode={deliveryCountryCode} size="20px" />
              <span>{request.deliveryCountry || "—"}</span>
            </div>
          </div>
          {request.shippingTerms && (
            <div className="request-spec-item">
              <span className="spec-label">Shipping Terms</span>
              <span className="spec-value">{request.shippingTerms}</span>
            </div>
          )}
        </div>
      </div>

      <div className="request-description-section">
        <h3 className="request-description-title">
          <i className="fas fa-align-left"></i> Description
        </h3>
        <p className="request-description-text">{request.description}</p>
      </div>

      {(request.certifications || request.packagingReq) && (
        <div className="request-additional-info">
          {request.certifications && (
            <div className="request-additional-item">
              <span className="additional-label">Certifications</span>
              <span className="additional-value">{request.certifications}</span>
            </div>
          )}
          {request.packagingReq && (
            <div className="request-additional-item">
              <span className="additional-label">Packaging Requirements</span>
              <span className="additional-value">{request.packagingReq}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}