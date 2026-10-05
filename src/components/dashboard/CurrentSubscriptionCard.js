// src/components/dashboard/CurrentSubscriptionCard.js
import Link from "next/link";

const PLAN_META = {
  Basic:  { cls: "basic",  icon: "fa-leaf" },
  Bronze: { cls: "bronze", icon: "fa-medal" },
  Silver: { cls: "silver", icon: "fa-award" },
  Gold:   { cls: "gold",   icon: "fa-crown" },
  FREE:   { cls: "basic",  icon: "fa-leaf" },
};

export default function CurrentSubscriptionCard({ subscription, planName }) {
  const meta = PLAN_META[planName] || PLAN_META.Basic;

  const now = Date.now();
  const end = subscription ? new Date(subscription.endDate).getTime() : null;
  const start = subscription ? new Date(subscription.startDate).getTime() : null;

  let percentUsed = 0;
  let daysRemaining = 0;

  if (subscription) {
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    percentUsed = totalDays > 0 ? Math.min(100, (elapsed / totalDays) * 100) : 0;
  }

  const formattedEnd = subscription
    ? new Date(subscription.endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  // Bar colour based on usage percentage
  let barColor = "linear-gradient(90deg, #0f9e6e, #14b881)";
  if (percentUsed >= 80) barColor = "linear-gradient(90deg, #f59e0b, #d97706)";
  if (percentUsed >= 95) barColor = "linear-gradient(90deg, #ef4444, #dc2626)";

  return (
    <div
      className="d-card"
      style={{
        marginBottom: 24,
        background: `linear-gradient(135deg, var(--d-white), #f8fdfb)`,
      }}
    >
      <div className="d-card-head">
        <div>
          <div className="d-card-title">Current Subscription</div>
          <div className="d-card-sub">
            Your active plan and its validity
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/plans" className="btn-upgrade" style={{ fontSize: 12 }}>
            <i className="fas fa-arrow-up"></i> Upgrade
          </Link>
          <Link
            href="/plans"
            style={{
              padding: "10px 18px",
              borderRadius: 11,
              background: "white",
              border: "1px solid var(--d-border, #e8edf0)",
              color: "var(--d-text, #334155)",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="fas fa-rotate-right"></i> Renew
          </Link>
        </div>
      </div>

      {subscription ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                className={`d-sub-plan-badge ${meta.cls}`}
                style={{ fontSize: 11 }}
              >
                <i className={`fas ${meta.icon}`}></i> {planName}
              </span>
              <span
                style={{
                  fontSize: 13.5,
                  color: "var(--d-muted-2, #64748b)",
                }}
              >
                Expires on{" "}
                <strong style={{ color: "var(--d-dark, #0b1f18)" }}>
                  {formattedEnd}
                </strong>
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: daysRemaining < 15 ? "#dc2626" : "var(--d-primary, #0f9e6e)",
              }}
            >
              <i className="far fa-clock me-1"></i>
              {daysRemaining} days remaining
            </div>
          </div>

          <div
            style={{
              height: 8,
              background: "var(--d-border-2, #f1f5f7)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${percentUsed}%`,
                background: barColor,
                borderRadius: 4,
                transition: "width 0.6s ease",
              }}
            ></div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 11.5,
              color: "var(--d-muted, #94a3b8)",
            }}
          >
            <span>{Math.round(percentUsed)}% used</span>
            <span>{100 - Math.round(percentUsed)}% remaining</span>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "var(--d-muted, #94a3b8)",
            fontSize: 13,
            background: "var(--d-bg, #f6f8f9)",
            borderRadius: 12,
          }}
        >
          <i
            className="fas fa-info-circle"
            style={{ fontSize: 18, marginBottom: 8, display: "block" }}
          ></i>
          You're currently on the Basic (free) plan. Upgrade to unlock more
          features.
        </div>
      )}
    </div>
  );
}