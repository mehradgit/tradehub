// src/components/home/HeroSection.js
"use client";

import Link from "next/link";

export default function HeroSection({ stats }) {
  return (
    <section className="hero-new">
      <div className="container">
        <div className="hero-new-grid">
          {/* ====== Text + CTA ====== */}
          <div className="hero-content">
            <div className="eyebrow">
              <i className="fa-solid fa-globe"></i>
              GLOBAL B2B FOOD MARKETPLACE
            </div>

            <h1>
              Smarter Connections. <br />
              <span>Better Food Trade.</span>
            </h1>

            <p className="hero-description">
              Connect with verified food buyers and suppliers worldwide.
              Discover products, compare opportunities, and build trusted
              international trade relationships — all in one place.
            </p>

            {/* ====== CTA buttons ====== */}
            <div className="hero-actions">
              <Link href="/profiles" className="btn-hero-primary">
                <i className="fa-solid fa-magnifying-glass"></i>
                Find Suppliers
              </Link>
              <Link href="/requests/new" className="btn-hero-secondary">
                <i className="fa-solid fa-cart-plus"></i>
                Post a Buy Request
              </Link>
            </div>

            {/* ====== Features ====== */}
            <div className="hero-features">
              <div className="hero-feature">
                <i className="fa-solid fa-circle-check"></i>
                <span>Verified Businesses</span>
              </div>
              <div className="hero-feature">
                <i className="fa-solid fa-circle-check"></i>
                <span>Global Marketplace</span>
              </div>
              <div className="hero-feature">
                <i className="fa-solid fa-circle-check"></i>
                <span>Direct Communication</span>
              </div>
            </div>
          </div>

          {/* ====== Image ====== */}
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