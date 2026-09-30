// src/app/(public)/loading.js
export default function HomeLoading() {
  return (
    <div className="home-loading">
      {/* ============================================================
         Hero Section
         ============================================================ */}
      <section className="skeleton-hero">
        <div className="container">
          <div className="skeleton-hero-grid">
            <div className="skeleton-hero-text">
              <div
                className="skeleton skeleton-text"
                style={{ width: 260, height: 32, borderRadius: 50 }}
              />

              <div
                className="skeleton skeleton-title"
                style={{ width: "90%", height: 52, marginTop: 20 }}
              />
              <div
                className="skeleton skeleton-title"
                style={{ width: "60%", height: 52, marginTop: 12 }}
              />

              <div
                className="skeleton skeleton-text"
                style={{ width: "100%", height: 14, marginTop: 24 }}
              />
              <div
                className="skeleton skeleton-text"
                style={{ width: "85%", height: 14, marginTop: 10 }}
              />
              <div
                className="skeleton skeleton-text"
                style={{ width: "60%", height: 14, marginTop: 10 }}
              />

              <div
                className="skeleton skeleton-card"
                style={{ width: "100%", maxWidth: 620, height: 60, marginTop: 32 }}
              />

              <div className="skeleton-hero-stats">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton-hero-stat">
                    <div
                      className="skeleton skeleton-title"
                      style={{ width: 90, height: 26, marginBottom: 8 }}
                    />
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: 100, height: 12 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="skeleton-hero-image skeleton skeleton-card" />
          </div>
        </div>
      </section>

      {/* ============================================================
         Trust Bar
         ============================================================ */}
      <section className="skeleton-trust">
        <div className="container">
          <div className="skeleton-trust-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-trust-item">
                <div
                  className="skeleton skeleton-title"
                  style={{ width: 70, height: 25, margin: "0 auto 8px" }}
                />
                <div
                  className="skeleton skeleton-text"
                  style={{ width: 110, height: 12, margin: "0 auto" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
         Featured Products
         ============================================================ */}
      <section className="container" style={{ paddingTop: 40 }}>
        <div className="skeleton-section-header">
          <div>
            <div
              className="skeleton skeleton-title"
              style={{ width: 220, height: 24, marginBottom: 10 }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ width: 320, height: 14 }}
            />
          </div>
          <div
            className="skeleton skeleton-text"
            style={{ width: 100, height: 14 }}
          />
        </div>

        <div className="skeleton-products-grid">
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
      </section>

      {/* ============================================================
         Categories
         ============================================================ */}
      <section className="container" style={{ paddingTop: 40 }}>
        <div className="skeleton-section-header">
          <div>
            <div
              className="skeleton skeleton-title"
              style={{ width: 260, height: 24, marginBottom: 10 }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ width: 300, height: 14 }}
            />
          </div>
          <div
            className="skeleton skeleton-text"
            style={{ width: 120, height: 14 }}
          />
        </div>

        <div className="skeleton-categories-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-category-card">
              <div
                className="skeleton skeleton-card"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  marginBottom: 12,
                }}
              />
              <div
                className="skeleton skeleton-title"
                style={{ width: "80%", height: 14, margin: "0 auto 8px" }}
              />
              <div
                className="skeleton skeleton-text"
                style={{ width: "60%", height: 11, margin: "0 auto" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
         Buying Requests
         ============================================================ */}
      <section className="container" style={{ paddingTop: 40 }}>
        <div className="skeleton-section-header">
          <div>
            <div
              className="skeleton skeleton-title"
              style={{ width: 240, height: 24, marginBottom: 10 }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ width: 300, height: 14 }}
            />
          </div>
          <div
            className="skeleton skeleton-text"
            style={{ width: 100, height: 14 }}
          />
        </div>

        <div className="skeleton-requests-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-request-card">
              <div
                className="skeleton skeleton-request-badge"
                style={{ marginBottom: 12 }}
              />
              <div className="skeleton skeleton-text skeleton-request-title" />
              <div className="skeleton skeleton-text skeleton-request-desc" />
              <div className="skeleton skeleton-text skeleton-request-desc-2" />
              <div className="skeleton skeleton-text skeleton-request-footer" />
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
         Feature Group
         ============================================================ */}
      <section className="container" style={{ paddingTop: 50 }}>
        <div className="skeleton-feature-group">
          <div className="skeleton-feature-image skeleton skeleton-card" />
          <div className="skeleton-feature-content">
            <div
              className="skeleton skeleton-title"
              style={{ width: "70%", height: 32, marginBottom: 16 }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ width: "90%", height: 14, marginBottom: 8 }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ width: "75%", height: 14, marginBottom: 24 }}
            />

            <div className="skeleton-feature-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton skeleton-text"
                  style={{ width: "100%", height: 42, borderRadius: 11 }}
                />
              ))}
            </div>

            <div
              className="skeleton skeleton-button"
              style={{ width: 180, height: 44, marginTop: 24 }}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
         Marketplace
         ============================================================ */}
      <section className="container" style={{ paddingTop: 50 }}>
        <div className="skeleton-section-header">
          <div>
            <div
              className="skeleton skeleton-title"
              style={{ width: 260, height: 24, marginBottom: 10 }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ width: 340, height: 14 }}
            />
          </div>
        </div>

        <div className="skeleton-market-layout">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="skeleton-market-box">
              <div className="skeleton-market-title">
                <div
                  className="skeleton skeleton-card"
                  style={{ width: 42, height: 42, borderRadius: 12 }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    className="skeleton skeleton-title"
                    style={{ width: "60%", height: 16, marginBottom: 6 }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "40%", height: 11 }}
                  />
                </div>
              </div>

              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-company-row">
                  <div
                    className="skeleton skeleton-card"
                    style={{
                      width: 47,
                      height: 47,
                      borderRadius: 13,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="skeleton skeleton-title"
                      style={{ width: "70%", height: 13, marginBottom: 6 }}
                    />
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: "50%", height: 11 }}
                    />
                  </div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: 50, height: 13 }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
         CTA
         ============================================================ */}
      <section className="container" style={{ paddingTop: 60 }}>
        <div className="skeleton-cta">
          <div
            className="skeleton skeleton-title"
            style={{
              width: 380,
              height: 32,
              margin: "0 auto 16px",
              background: "rgba(255, 255, 255, 0.15)",
            }}
          />
          <div
            className="skeleton skeleton-text"
            style={{
              width: 500,
              height: 16,
              margin: "0 auto 24px",
              background: "rgba(255, 255, 255, 0.12)",
            }}
          />
          <div
            className="skeleton skeleton-button"
            style={{
              width: 220,
              height: 48,
              margin: "0 auto",
              borderRadius: 50,
              background: "rgba(255, 255, 255, 0.2)",
            }}
          />
        </div>
      </section>
    </div>
  );
}