// src/components/home/HeroSection.js
"use client";

import HeroSearch from "./HeroSearch";

export default function HeroSection({ stats }) {
  return (
    <section className="hero-new">
      <div className="container">
        <div className="hero-new-grid">
          <div>
            <div className="eyebrow">
              <i className="fa-solid fa-globe"></i>
              GLOBAL B2B FOOD MARKETPLACE
            </div>

            <h1>
              Trade Food Products <br />
              <span>Without Borders.</span>
            </h1>

            <p>
              Connect with verified food suppliers, manufacturers, wholesalers
              and buyers from around the world. Discover products, send
              inquiries and grow your international food business.
            </p>

            {/* ✅ کامپوننت جدید سرچ */}
            <HeroSearch />

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{stats?.suppliers || "18,500"}+</strong>
                <span>Verified Suppliers</span>
              </div>
              <div className="hero-stat">
                <strong>{stats?.products || "72,000"}+</strong>
                <span>Food Products</span>
              </div>
              <div className="hero-stat">
                <strong>{stats?.countries || "120"}+</strong>
                <span>Countries</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img src="/images/hero.jpg" alt="Global food marketplace" />
            <div className="floating-card">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Verified Trading</strong>
                <small>Trusted B2B connections</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}