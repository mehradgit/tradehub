// src/components/request/SimilarRequests.js
import Link from "next/link";

export default function SimilarRequests({ requests }) {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="similar-requests-section">
      <div className="similar-requests-header">
        <h2>
          <i className="fas fa-arrow-right" style={{ color: "var(--primary)" }}></i>
          Similar Buying Requests
        </h2>
        <Link href="/requests" className="view-all-link">
          View All <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
      <div className="similar-requests-grid">
        {requests.map((req) => (
          <Link key={req.id} href={`/requests/${req.id}`} className="similar-request-card">
            <div className="similar-request-header">
              <span className="similar-request-title">{req.title}</span>
              {req.isUrgent && (
                <span className="similar-request-badge urgent">Urgent</span>
              )}
            </div>
            <p className="similar-request-description">{req.description}</p>
            <div className="similar-request-footer">
              <span className="similar-request-budget">{req.budgetRange || "Negotiable"}</span>
              <span className="similar-request-date">
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}