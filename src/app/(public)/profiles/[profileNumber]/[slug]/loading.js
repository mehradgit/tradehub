// src/app/(public)/products/[productNumber]/[slug]/loading.js
export default function ProductDetailLoading() {
  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div style={{ padding: "16px 0 20px" }}>
        <div className="skeleton skeleton-text" style={{ width: 300 }} />
      </div>

      {/* Main row */}
      <div className="skeleton-detail-row">
        {/* Gallery */}
        <div className="skeleton skeleton-detail-gallery" />

        {/* Info */}
        <div className="skeleton-detail-info">
          <div className="skeleton skeleton-title skeleton-detail-title" />
          <div className="skeleton skeleton-text skeleton-detail-meta" />
          <div className="skeleton-detail-specs">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-detail-spec">
                <div className="skeleton skeleton-detail-spec-label" />
                <div className="skeleton skeleton-detail-spec-value" />
              </div>
            ))}
          </div>
        </div>

        {/* Supplier */}
        <div className="skeleton skeleton-detail-supplier" />
      </div>

      {/* Description */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          className="skeleton skeleton-title"
          style={{ width: 160, height: 18, marginBottom: 14 }}
        />
        <div className="skeleton skeleton-text" style={{ width: "100%", marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: "95%", marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: "70%" }} />
      </div>
    </div>
  );
}