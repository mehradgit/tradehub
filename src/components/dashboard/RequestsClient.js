// src/components/dashboard/RequestsClient.js
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import RequestListItem from "./RequestListItem";

export default function RequestsClient({ requests = [], stats }) {
  const [activeTab, setActiveTab] = useState("all");

  // ===== Filter =====
  const filteredRequests = useMemo(() => {
    if (activeTab === "all") return requests;
    const status = activeTab.toUpperCase();
    return requests.filter((r) => r.status === status);
  }, [requests, activeTab]);

  const tabs = [
    { id: "all", label: "All", count: stats.total, icon: "fa-list" },
    { id: "pending", label: "Pending", count: stats.pending, icon: "fa-clock" },
    { id: "approved", label: "Approved", count: stats.approved, icon: "fa-check-circle" },
    { id: "rejected", label: "Rejected", count: stats.rejected, icon: "fa-times-circle" },
  ];

  return (
    <>
      <div className="dr-page">
        {/* ============================================================
           Header
           ============================================================ */}
        <div className="dr-header">
          <div className="dr-header-left">
            <h1>
              <i className="fas fa-cart-shopping"></i>
              My Buying Requests
            </h1>
            <p>Manage your requests and track received quotes</p>
          </div>
          <Link href="/requests/new" className="dr-new-btn">
            <i className="fas fa-plus"></i>
            <span>Post New Request</span>
          </Link>
        </div>

        {/* ============================================================
           Stats
           ============================================================ */}
        <div className="dr-stats">
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
        <div className="dr-tabs-wrapper">
          <div className="dr-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`dr-tab ${activeTab === t.id ? "active" : ""} ${
                  t.id
                }`}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`fas ${t.icon}`}></i>
                <span>{t.label}</span>
                <span className="dr-tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
           List
           ============================================================ */}
        {filteredRequests.length > 0 ? (
          <div className="dr-list">
            {filteredRequests.map((request) => (
              <RequestListItem key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="dr-empty">
            <i className="fas fa-inbox"></i>
            <h3>
              {activeTab === "all"
                ? "No buying requests yet"
                : `No ${activeTab} requests`}
            </h3>
            <p>
              {activeTab === "all"
                ? "Start posting buying requests to find the best suppliers."
                : "Try a different filter to see your other requests."}
            </p>
            {activeTab === "all" && (
              <Link href="/requests/new" className="dr-empty-btn">
                <i className="fas fa-plus"></i>
                Post Your First Request
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .dr-page {
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
        .dr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dr-header-left {
          min-width: 0;
        }

        .dr-header-left h1 {
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

        .dr-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .dr-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .dr-new-btn {
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

        .dr-new-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Stats
           ============================================================ */
        .dr-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        /* ============================================================
           Tabs
           ============================================================ */
        .dr-tabs-wrapper {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          margin: 0 -4px;
          padding: 0 4px;
        }

        .dr-tabs-wrapper::-webkit-scrollbar {
          height: 4px;
        }

        .dr-tabs-wrapper::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        .dr-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          background: #f1f5f7;
          border-radius: 14px;
          min-width: 100%;
        }

        :global(.dr-tab) {
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

        :global(.dr-tab i) {
          font-size: 12px;
        }

        :global(.dr-tab:hover) {
          color: #0b1f18;
          background: rgba(255, 255, 255, 0.6);
        }

        :global(.dr-tab.active) {
          background: white;
          color: #13795b;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
        }

        .dr-tab-count {
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

        :global(.dr-tab.active) .dr-tab-count {
          background: #eaf7f1;
          color: #0b5b43;
        }

        /* ============================================================
           List
           ============================================================ */
        .dr-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ============================================================
           Empty State
           ============================================================ */
        .dr-empty {
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

        .dr-empty i {
          font-size: 48px;
          opacity: 0.35;
          margin-bottom: 6px;
        }

        .dr-empty h3 {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .dr-empty p {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
          max-width: 340px;
          line-height: 1.5;
        }

        .dr-empty-btn {
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

        .dr-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Responsive
           ============================================================ */

        @media (max-width: 1100px) {
          .dr-stats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 900px) {
          .dr-header-left h1 {
            font-size: 20px;
          }

          .dr-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          .dr-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          :global(.dr-tab) {
            padding: 9px 14px;
            font-size: 12.5px;
            gap: 6px;
          }

          :global(.dr-tab i) {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .dr-page {
            gap: 16px;
          }

          .dr-header-left h1 {
            font-size: 18px;
          }

          .dr-header-left p {
            font-size: 12.5px;
          }

          .dr-new-btn {
            padding: 10px 16px;
            font-size: 12.5px;
            width: 100%;
            justify-content: center;
          }

          .dr-new-btn span {
            display: inline;
          }

          .dr-stats {
            gap: 10px;
          }

          .dr-list {
            gap: 12px;
          }

          :global(.dr-tab) {
            padding: 8px 12px;
            font-size: 12px;
          }

          .dr-tab-count {
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            font-size: 10px;
          }

          .dr-empty {
            padding: 40px 18px;
          }

          .dr-empty i {
            font-size: 40px;
          }

          .dr-empty h3 {
            font-size: 15px;
          }

          .dr-empty p {
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
      <div className={`dr-stat ${color}`}>
        <div className={`dr-stat-icon ${color}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="dr-stat-info">
          <div className="dr-stat-value">{value}</div>
          <div className="dr-stat-label">{label}</div>
        </div>
      </div>

      <style jsx>{`
        .dr-stat {
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

        .dr-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          border-color: #13795b;
        }

        .dr-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .dr-stat-icon.green {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .dr-stat-icon.amber {
          background: #fff7e6;
          color: #b45309;
        }

        .dr-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .dr-stat-icon.rose {
          background: #fef2f2;
          color: #dc2626;
        }

        .dr-stat-info {
          min-width: 0;
          flex: 1;
        }

        .dr-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .dr-stat-label {
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
          .dr-stat {
            gap: 12px;
            padding: 14px;
          }

          .dr-stat-icon {
            width: 40px;
            height: 40px;
            font-size: 15px;
            border-radius: 11px;
          }

          .dr-stat-value {
            font-size: 19px;
          }

          .dr-stat-label {
            font-size: 11px;
          }
        }

        @media (max-width: 500px) {
          .dr-stat {
            padding: 12px;
            gap: 10px;
            border-radius: 14px;
          }

          .dr-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 14px;
            border-radius: 10px;
          }

          .dr-stat-value {
            font-size: 17px;
          }

          .dr-stat-label {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}