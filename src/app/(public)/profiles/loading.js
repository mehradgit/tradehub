// src/app/(public)/profiles/loading.js
export default function ProfilesLoading() {
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
          style={{ width: 180, height: 28, marginBottom: 8 }}
        />
        <div className="skeleton skeleton-text" style={{ width: 320 }} />
      </div>

      {/* Filter Bar */}
      <div className="skeleton-filter-bar">
        <div className="skeleton skeleton-filter-search" />
        <div className="skeleton skeleton-filter-select" />
        <div className="skeleton skeleton-filter-select" />
      </div>

      {/* Grid */}
      <div className="profiles-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-profile-card">
            <div className="skeleton-profile-header">
              <div className="skeleton skeleton-profile-avatar" />
              <div className="skeleton-profile-info">
                <div className="skeleton skeleton-text skeleton-profile-name" />
                <div className="skeleton skeleton-text skeleton-profile-location" />
              </div>
            </div>
            <div className="skeleton-profile-badges">
              <div className="skeleton skeleton-profile-badge" />
              <div className="skeleton skeleton-profile-badge" />
            </div>
            <div className="skeleton-profile-stats">
              <div className="skeleton-profile-stat">
                <div className="skeleton skeleton-profile-stat-value" />
                <div className="skeleton skeleton-profile-stat-label" />
              </div>
              <div className="skeleton-profile-stat">
                <div className="skeleton skeleton-profile-stat-value" />
                <div className="skeleton skeleton-profile-stat-label" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}