// src/app/(public)/requests/[requestNumber]/[slug]/loading.js
export default function RequestDetailLoading() {
  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div style={{ padding: "16px 0 20px" }}>
        <div className="skeleton skeleton-text" style={{ width: 300 }} />
      </div>

      {/* Main row */}
      <div className="skeleton-detail-row" style={{ gridTemplateColumns: "380px 1fr" }}>
        {/* Gallery */}
        <div className="skeleton skeleton-detail-gallery" />

        {/* Info */}
        <div className="skeleton-detail-info">
          {/* Badges */}
          <div style={{ display: "flex", gap: 10 }}>
            <div className="skeleton skeleton-request-badge" />
            <div className="skeleton skeleton-request-badge" style={{ width: 100 }} />
          </div>

          {/* Title */}
          <div className="skeleton skeleton-title" style={{ width: "70%", height: 26 }} />

          {/* Meta grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              padding: 16,
              background: "#f8fafc",
              borderRadius: 14,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton skeleton-text" style={{ width: "60%", height: 10 }} />
                <div className="skeleton skeleton-text" style={{ width: "80%", height: 14 }} />
              </div>
            ))}
          </div>

          {/* Description */}
          <div
            style={{
              background: "#f8fdfb",
              border: "1px solid #d1ede0",
              borderLeft: "4px solid #d1ede0",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div className="skeleton skeleton-text" style={{ width: 120, height: 12, marginBottom: 12 }} />
            <div className="skeleton skeleton-text" style={{ width: "100%", marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: "95%", marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: "80%" }} />
          </div>

          {/* Specs Table */}
          <div
            style={{
              background: "white",
              border: "1px solid #e8edf0",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "38% 1fr",
                  gap: 16,
                  padding: "12px 16px",
                  borderBottom: i < 5 ? "1px solid #f1f5f7" : "none",
                }}
              >
                <div className="skeleton skeleton-text" style={{ width: "70%", height: 12 }} />
                <div className="skeleton skeleton-text" style={{ width: "60%", height: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}