// src/components/home/StatsBar.js
export default function StatsBar() {
  const stats = [
    { number: "100+", label: "Countries" },
    { number: "97%", label: "Satisfaction" },
    { number: "24/7", label: "Support" },
    { number: "5+", label: "Years Experience" },
  ];

  return (
    <div className="row g-3 mb-4">
      {stats.map((stat, index) => (
        <div key={index} className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 h-100">
            <div className="fw-bold fs-4" style={{ color: "var(--color-primary, #e85d3a)" }}>
              {stat.number}
            </div>
            <div className="small text-muted">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}