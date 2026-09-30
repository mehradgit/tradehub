// src/components/dashboard/ProductsClient.js
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ProductListItem from "./ProductListItem";

export default function ProductsClient({ products = [], stats }) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    const status = activeTab.toUpperCase();
    return products.filter((p) => p.status === status);
  }, [products, activeTab]);

  const tabs = [
    { id: "all", label: "All", count: stats.total, icon: "fa-list" },
    { id: "pending", label: "Pending", count: stats.pending, icon: "fa-clock" },
    { id: "approved", label: "Approved", count: stats.approved, icon: "fa-check-circle" },
    { id: "rejected", label: "Rejected", count: stats.rejected, icon: "fa-times-circle" },
  ];

  return (
    <>
      <div className="dp-page">
        {/* ============================================================
           Header
           ============================================================ */}
        <div className="dp-header">
          <div className="dp-header-left">
            <h1>
              <i className="fas fa-box"></i>
              My Products
            </h1>
            <p>Manage your product listings and track performance</p>
          </div>
          <Link href="/products/new" className="dp-new-btn">
            <i className="fas fa-plus"></i>
            <span>Add New Product</span>
          </Link>
        </div>

        {/* ============================================================
           Stats
           ============================================================ */}
        <div className="dp-stats">
          <StatCard
            icon="fa-list"
            label="Total"
            value={stats.total}
            color="green"
          />
          <StatCard
            icon="fa-clock"
            label="Pending"
            value={stats.pending}
            color="amber"
          />
          <StatCard
            icon="fa-check-circle"
            label="Approved"
            value={stats.approved}
            color="blue"
          />
          <StatCard
            icon="fa-times-circle"
            label="Rejected"
            value={stats.rejected}
            color="rose"
          />
        </div>

        {/* ============================================================
           Tabs
           ============================================================ */}
        <div className="dp-tabs-wrapper">
          <div className="dp-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`dp-tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`fas ${t.icon}`}></i>
                <span>{t.label}</span>
                <span className="dp-tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
           List
           ============================================================ */}
        {filteredProducts.length > 0 ? (
          <div className="dp-list">
            {filteredProducts.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="dp-empty">
            <i className="fas fa-box-open"></i>
            <h3>
              {activeTab === "all"
                ? "No products yet"
                : `No ${activeTab} products`}
            </h3>
            <p>
              {activeTab === "all"
                ? "Start listing your products to reach global buyers."
                : "Try a different filter to see your other products."}
            </p>
            {activeTab === "all" && (
              <Link href="/products/new" className="dp-empty-btn">
                <i className="fas fa-plus"></i>
                Add Your First Product
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .dp-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* ============================================================
           Header
           ============================================================ */
        .dp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dp-header-left {
          min-width: 0;
        }

        .dp-header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dp-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .dp-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .dp-new-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
        }

        .dp-new-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Stats
           ============================================================ */
        .dp-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        /* ============================================================
           Tabs
           ============================================================ */
        .dp-tabs-wrapper {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          margin: 0 -4px;
          padding: 0 4px;
        }

        .dp-tabs-wrapper::-webkit-scrollbar {
          height: 4px;
        }

        .dp-tabs-wrapper::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        .dp-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          background: #f1f5f7;
          border-radius: 14px;
          min-width: 100%;
        }

        :global(.dp-tab) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
          flex-shrink: 0;
        }

        :global(.dp-tab i) {
          font-size: 12px;
        }

        :global(.dp-tab:hover) {
          color: #0b1f18;
          background: rgba(255, 255, 255, 0.6);
        }

        :global(.dp-tab.active) {
          background: white;
          color: #13795b;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
        }

        .dp-tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 20px;
          padding: 0 7px;
          background: rgba(100, 116, 139, 0.12);
          color: #64748b;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          transition: all 0.2s ease;
        }

        :global(.dp-tab.active) .dp-tab-count {
          background: #eaf7f1;
          color: #0b5b43;
        }

        /* ============================================================
           List
           ============================================================ */
        .dp-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ============================================================
           Empty State
           ============================================================ */
        .dp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          background: white;
          border: 1px dashed #e8edf0;
          border-radius: 18px;
          color: #94a3b8;
          gap: 10px;
        }

        .dp-empty i {
          font-size: 48px;
          opacity: 0.35;
          margin-bottom: 6px;
        }

        .dp-empty h3 {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .dp-empty p {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
          max-width: 340px;
          line-height: 1.5;
        }

        .dp-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          margin-top: 12px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .dp-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 1100px) {
          .dp-stats {
            gap: 12px;
          }
        }

        @media (max-width: 900px) {
          .dp-header-left h1 {
            font-size: 20px;
          }

          .dp-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          .dp-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          :global(.dp-tab) {
            padding: 9px 14px;
            font-size: 12.5px;
            gap: 6px;
          }

          :global(.dp-tab i) {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .dp-page {
            gap: 16px;
          }

          .dp-header-left h1 {
            font-size: 18px;
          }

          .dp-header-left p {
            font-size: 12.5px;
          }

          .dp-new-btn {
            padding: 10px 16px;
            font-size: 12.5px;
            width: 100%;
            justify-content: center;
          }

          .dp-stats {
            gap: 10px;
          }

          .dp-list {
            gap: 12px;
          }

          :global(.dp-tab) {
            padding: 8px 12px;
            font-size: 12px;
          }

          .dp-tab-count {
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            font-size: 10px;
          }

          .dp-empty {
            padding: 40px 18px;
          }

          .dp-empty i {
            font-size: 40px;
          }

          .dp-empty h3 {
            font-size: 15px;
          }

          .dp-empty p {
            font-size: 12.5px;
          }
        }
      `}</style>
    </>
  );
}

// ============================================================
// StatCard
// ============================================================
function StatCard({ icon, label, value, color }) {
  return (
    <>
      <div className="dp-stat">
        <div className={`dp-stat-icon ${color}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="dp-stat-info">
          <div className="dp-stat-value">{value}</div>
          <div className="dp-stat-label">{label}</div>
        </div>
      </div>

      <style jsx>{`
        .dp-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          transition: all 0.25s ease;
          cursor: pointer;
          min-width: 0;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }

        .dp-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          border-color: #13795b;
        }

        .dp-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .dp-stat-icon.green {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .dp-stat-icon.amber {
          background: #fff7e6;
          color: #b45309;
        }

        .dp-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .dp-stat-icon.rose {
          background: #fef2f2;
          color: #dc2626;
        }

        .dp-stat-info {
          min-width: 0;
          flex: 1;
        }

        .dp-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .dp-stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 900px) {
          .dp-stat {
            gap: 12px;
            padding: 14px;
          }

          .dp-stat-icon {
            width: 40px;
            height: 40px;
            font-size: 15px;
            border-radius: 11px;
          }

          .dp-stat-value {
            font-size: 19px;
          }

          .dp-stat-label {
            font-size: 11px;
          }
        }

        @media (max-width: 500px) {
          .dp-stat {
            padding: 12px;
            gap: 10px;
            border-radius: 14px;
          }

          .dp-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 14px;
            border-radius: 10px;
          }

          .dp-stat-value {
            font-size: 17px;
          }

          .dp-stat-label {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}