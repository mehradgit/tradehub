// src/app/(public)/requests/loading.js
export default function RequestsLoading() {
  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div style={{ padding: "16px 0 8px", marginBottom: 16 }}>
        <div className="skeleton skeleton-text" style={{ width: 200 }} />
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          className="skeleton skeleton-title"
          style={{ width: 240, height: 28, marginBottom: 8 }}
        />
        <div className="skeleton skeleton-text" style={{ width: 340 }} />
      </div>

      {/* Filter Bar */}
      <div className="skeleton-filter-bar">
        <div className="skeleton skeleton-filter-search" />
        <div className="skeleton skeleton-filter-select" />
        <div className="skeleton skeleton-filter-select" />
      </div>

      {/* Grid */}
      <div className="requests-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton-request-card">
            <div className="skeleton skeleton-request-badge" />
            <div className="skeleton skeleton-text skeleton-request-title" />
            <div className="skeleton skeleton-text skeleton-request-desc" />
            <div className="skeleton skeleton-text skeleton-request-desc-2" />
            <div className="skeleton skeleton-text skeleton-request-desc-3" />
            <div className="skeleton skeleton-text skeleton-request-footer" />
          </div>
        ))}
      </div>
    </div>
  );
}