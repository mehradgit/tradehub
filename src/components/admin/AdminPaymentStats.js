// src/components/admin/AdminPaymentStats.js
export default function AdminPaymentStats({ stats }) {
  const items = [
    {
      label: "Total Revenue",
      value: `$${(stats.totalRevenue || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: "fa-dollar-sign",
      cls: "green",
      sub: "All-time paid",
    },
    {
      label: "Paid",
      value: stats.paidCount || 0,
      icon: "fa-check-circle",
      cls: "indigo",
      sub: "Successful payments",
    },
    {
      label: "Pending",
      value: stats.pendingCount || 0,
      icon: "fa-clock",
      cls: "amber",
      sub: "Awaiting confirmation",
    },
    {
      label: "Failed",
      value: stats.failedCount || 0,
      icon: "fa-times-circle",
      cls: "rose",
      sub: "Unsuccessful attempts",
    },
  ];

  return (
    <div
      className="admin-kpis"
      style={{ marginBottom: 16, gridTemplateColumns: "repeat(4, 1fr)" }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="admin-kpi"
          style={{ minHeight: "auto", padding: 16 }}
        >
          <div className={`admin-kpi-icon ${item.cls === "green" ? "green-bg" : item.cls === "indigo" ? "blue-bg" : item.cls === "amber" ? "orange-bg" : "purple-bg"}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          <h4>{item.label}</h4>
          <strong>{item.value}</strong>
          <small>{item.sub}</small>
        </div>
      ))}
    </div>
  );
}