// src/app/(public)/about/page.js
import Link from "next/link";

export const metadata = {
  title: "About Us | FoodTradeLink",
  description:
    "FoodTradeLink  is a global B2B marketplace connecting verified food suppliers, manufacturers, and buyers across 120+ countries.",
};

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* ====== HERO ====== */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-inner">
            <span className="about-eyebrow">
              <i className="fa-solid fa-leaf"></i>
              About FoodTradeLink 
            </span>
            <h1>
              Connecting the World's Food
              <br />
              <span>Trade, One Deal at a Time.</span>
            </h1>
            <p>
              We are a global B2B marketplace built to make international food
              trade simple, transparent, and trustworthy. From premium saffron
              to bulk grains, from verified honey producers to established
              importers — we bring the right partners together.
            </p>
          </div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="about-stats">
        <div className="container">
          <div className="about-stats-grid">
            <div className="about-stat">
              <div className="about-stat-value">18,500+</div>
              <div className="about-stat-label">Verified Suppliers</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-value">72,000+</div>
              <div className="about-stat-label">Food Products Listed</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-value">120+</div>
              <div className="about-stat-label">Countries Served</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-value">24/7</div>
              <div className="about-stat-label">Global Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STORY ====== */}
      <section className="about-section">
        <div className="container">
          <div className="about-two-col">
            <div className="about-text">
              <span className="about-tag">
                <i className="fa-solid fa-book-open"></i>
                Our Story
              </span>
              <h2>Built by people who understand food trade.</h2>
              <p>
                FoodTradeLink was founded with one goal: to remove the friction
                from cross-border food trading. Traditional B2B platforms were
                either too complex, too expensive, or too opaque for small and
                mid-sized businesses. We set out to change that.
              </p>
              <p>
                Today, we serve suppliers, manufacturers, exporters, importers,
                and distributors from every corner of the world. Whether you
                are a family-owned honey farm in New Zealand or a wholesale
                distributor in Oman looking for premium saffron — you will find
                the right partner here.
              </p>
              <p>
                Our platform is designed to be simple enough for a first-time
                exporter, yet powerful enough for established trading houses
                processing hundreds of orders a month.
              </p>
            </div>
            <div className="about-visual">
              <div className="about-visual-card">
                <i className="fa-solid fa-globe"></i>
                <div>
                  <strong>Global Reach</strong>
                  <small>Trade across 6 continents</small>
                </div>
              </div>
              <div className="about-visual-card">
                <i className="fa-solid fa-shield-halved"></i>
                <div>
                  <strong>Verified Network</strong>
                  <small>Every account manually reviewed</small>
                </div>
              </div>
              <div className="about-visual-card">
                <i className="fa-solid fa-handshake"></i>
                <div>
                  <strong>Trusted Deals</strong>
                  <small>Thousands of completed trades</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== VALUES ====== */}
      <section className="about-values">
        <div className="container">
          <div className="about-values-header">
            <span className="about-tag">
              <i className="fa-solid fa-star"></i>
              Our Values
            </span>
            <h2>What we stand for.</h2>
          </div>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div className="about-value-icon">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h3>Trust & Transparency</h3>
              <p>
                Every supplier and buyer on our platform is verified. We
                prioritize transparency in pricing, communication, and
                documentation.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <h3>Simplicity at Scale</h3>
              <p>
                Food trade is complex. Our job is to make it feel simple — from
                the first inquiry to the last shipping document.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">
                <i className="fa-solid fa-earth-asia"></i>
              </div>
              <h3>Global Inclusion</h3>
              <p>
                We believe small producers deserve the same global access as
                large corporations. Our platform levels the playing field.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">
                <i className="fa-solid fa-seedling"></i>
              </div>
              <h3>Sustainable Trade</h3>
              <p>
                We promote ethical sourcing, sustainable farming, and
                environmentally responsible supply chains.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHAT WE OFFER ====== */}
      <section className="about-section about-section-alt">
        <div className="container">
          <div className="about-values-header">
            <span className="about-tag">
              <i className="fa-solid fa-list-check"></i>
              What We Offer
            </span>
            <h2>Everything you need to trade globally.</h2>
          </div>
          <div className="about-offer-grid">
            <div className="about-offer-item">
              <i className="fa-solid fa-box"></i>
              <div>
                <strong>Product Listings</strong>
                <span>Showcase your products to thousands of buyers</span>
              </div>
            </div>
            <div className="about-offer-item">
              <i className="fa-solid fa-cart-shopping"></i>
              <div>
                <strong>Buying Requests</strong>
                <span>Post your requirements and receive quotes</span>
              </div>
            </div>
            <div className="about-offer-item">
              <i className="fa-solid fa-comments"></i>
              <div>
                <strong>Direct Messaging</strong>
                <span>Communicate securely with your trade partners</span>
              </div>
            </div>
            <div className="about-offer-item">
              <i className="fa-solid fa-file-signature"></i>
              <div>
                <strong>Quotes & Negotiation</strong>
                <span>Send and receive offers within the platform</span>
              </div>
            </div>
            <div className="about-offer-item">
              <i className="fa-solid fa-chart-line"></i>
              <div>
                <strong>Analytics Dashboard</strong>
                <span>Track views, inquiries, and performance</span>
              </div>
            </div>
            <div className="about-offer-item">
              <i className="fa-solid fa-headset"></i>
              <div>
                <strong>Dedicated Support</strong>
                <span>Real humans ready to help you close deals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta-inner">
            <h2>Ready to grow your food business?</h2>
            <p>
              Join thousands of suppliers and buyers trading on FoodTradeHub
              today. It's free to get started.
            </p>
            <div className="about-cta-actions">
              <Link href="/register" className="btn-cta-primary">
                <i className="fa-solid fa-user-plus"></i>
                Create Free Account
              </Link>
              <Link href="/contact" className="btn-cta-ghost">
                <i className="fa-solid fa-envelope"></i>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}