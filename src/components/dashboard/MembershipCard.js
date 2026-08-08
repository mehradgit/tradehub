// src/components/dashboard/MembershipCard.js
"use client";

export default function MembershipCard({ plan, currentPlan }) {
  return (
    <div className="membership-card">
      <div className="plan-badge">
        <i className="fas fa-crown"></i> {plan.badge} Plan
      </div>
      <div className="plan-price">
        {plan.price} <small>{plan.period}</small>
      </div>
      <ul className="plan-features">
        {plan.features.map((feature, index) => (
          <li key={index}>
            <i className="fas fa-check-circle"></i> {feature}
          </li>
        ))}
      </ul>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
        Manage Plan
      </button>
      <button
        className="btn btn-outline-secondary"
        style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
      >
        View Plans
      </button>
    </div>
  );
}