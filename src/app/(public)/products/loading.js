// src/app/(public)/products/loading.js
export default function ProductsLoading() {
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
          style={{ width: 220, height: 28, marginBottom: 8 }}
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
      <div className="products-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton-product-card">
            <div className="skeleton skeleton-product-image" />
            <div className="skeleton skeleton-text skeleton-product-category" />
            <div className="skeleton skeleton-text skeleton-product-title" />
            <div className="skeleton skeleton-text skeleton-product-title-2" />
            <div className="skeleton skeleton-product-divider" />
            <div className="skeleton skeleton-text skeleton-product-meta" />
            <div className="skeleton skeleton-text skeleton-product-country" />
          </div>
        ))}
      </div>
    </div>
  );
}