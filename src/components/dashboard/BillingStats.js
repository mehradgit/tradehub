// src/components/dashboard/BillingStats.js
export default function BillingStats({ totalPaid, invoiceCount, planName, daysRemaining }) {
  const stats = [
    {
      label: "Current Plan",
      value: planName || "Basic",
      sub: daysRemaining > 0 ? `${daysRemaining} days left` : "No active plan",
      icon: "fa-crown",
      cls: "amber",
    },
    {
      label: "Total Paid",
      value: `$${(totalPaid || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: "All-time",
      icon: "fa-dollar-sign",
      cls: "green",
    },
    {
      label: "Invoices",
      value: invoiceCount || 0,
      sub: "Available downloads",
      icon: "fa-file-invoice",
      cls: "indigo",
    },
  ];

  return (
    <div className="d-stats" style={{ marginBottom: 24 }}>
      {stats.map((s, i) => (
        <div
          key={i}
          className="d-stat"
          style={{ cursor: "default", gridColumn: i === 0 ? "span 1" : undefined }}
        >
          <div className="stat-head">
            <div className={`stat-icon ${s.cls}`}>
              <i className={`fas ${s.icon}`}></i>
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: s.label === "Current Plan" ? 22 : 28 }}>
            {s.value}
          </div>
          <div className="stat-label">{s.label}</div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--d-muted, #94a3b8)",
              marginTop: 4,
            }}
          >
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}