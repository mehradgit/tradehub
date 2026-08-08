// src/components/home/HeroSection.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection({ stats }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Premium <span>Food</span> Trade Network
            </h1>
            <p className="hero-subtitle">
              Connect with verified suppliers & buyers worldwide. Post requests,
              discover quality products, and grow your food business.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-section">
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search products, suppliers, or requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary search-btn">
                  <i className="fas fa-search"></i> Search
                </button>
              </div>
            </form>

            {/* Stats */}
            <div className="hero-stats">
              <div>
                <div className="hero-stat-number">{stats?.suppliers || 8200}+</div>
                <div className="hero-stat-label">Suppliers</div>
              </div>
              <div>
                <div className="hero-stat-number">{stats?.buyers || 4500}+</div>
                <div className="hero-stat-label">Buyers</div>
              </div>
              <div>
                <div className="hero-stat-number">{stats?.products || 24000}+</div>
                <div className="hero-stat-label">Products</div>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Food Marketplace"
            />
          </div>
        </div>
      </div>
    </section>
  );
}