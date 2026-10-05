// src/components/support/SupportClient.js
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import TicketListItem from "./TicketListItem";

export default function SupportClient({ tickets = [], counts }) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ===== Filter =====
  const filteredTickets = useMemo(() => {
    let list = tickets;

    // Tab filter
    if (activeTab === "open") {
      // "Open" means all active tickets
      list = list.filter((t) =>
        ["open", "in_progress", "waiting_user"].includes(t.status)
      );
    } else if (activeTab === "resolved") {
      list = list.filter((t) => t.status === "resolved");
    } else if (activeTab === "closed") {
      list = list.filter((t) => t.status === "closed");
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          String(t.ticketNumber).includes(q)
      );
    }

    return list;
  }, [tickets, activeTab, searchQuery]);

  const tabs = [
    {
      id: "all",
      label: "All",
      count: counts.total,
      icon: "fa-list",
    },
    {
      id: "open",
      label: "Open",
      count: counts.open,
      icon: "fa-envelope-open",
    },
    {
      id: "resolved",
      label: "Resolved",
      count: counts.resolved,
      icon: "fa-check-circle",
    },
    {
      id: "closed",
      label: "Closed",
      count: counts.closed,
      icon: "fa-archive",
    },
  ];

  return (
    <>
      <div className="sp-page">
        {/* ============================================================
           Header
           ============================================================ */}
        <div className="sp-header">
          <div className="sp-header-left">
            <h1>
              <i className="fas fa-headset"></i>
              Support Tickets
              {counts.unread > 0 && (
                <span className="sp-header-badge">{counts.unread} new</span>
              )}
            </h1>
            <p>Get help from our team or track your existing tickets</p>
          </div>
          <Link href="/dashboard/support/new" className="sp-new-btn">
            <i className="fas fa-plus"></i>
            <span>New Ticket</span>
          </Link>
        </div>

        {/* ============================================================
           Stats
           ============================================================ */}
        <div className="sp-stats">
          <StatCard
            icon="fa-ticket-alt"
            label="Total Tickets"
            value={counts.total}
            color="indigo"
          />
          <StatCard
            icon="fa-envelope-open"
            label="Open"
            value={counts.open}
            color="blue"
          />
          <StatCard
            icon="fa-check-circle"
            label="Resolved"
            value={counts.resolved}
            color="green"
          />
          <StatCard
            icon="fa-archive"
            label="Closed"
            value={counts.closed}
            color="gray"
          />
        </div>

        {/* ============================================================
           Filters Row: Tabs + Search
           ============================================================ */}
        <div className="sp-filters">
          <div className="sp-tabs-wrapper">
            <div className="sp-tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`sp-tab ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <i className={`fas ${t.icon}`}></i>
                  <span>{t.label}</span>
                  <span className="sp-tab-count">{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sp-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by subject or ticket #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="sp-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================
           List
           ============================================================ */}
        {filteredTickets.length > 0 ? (
          <div className="sp-list">
            {filteredTickets.map((ticket) => (
              <TicketListItem key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="sp-empty">
            <i className="fas fa-headset"></i>
            <h3>
              {searchQuery
                ? "No tickets match your search"
                : activeTab === "all"
                  ? "No tickets yet"
                  : `No ${activeTab} tickets`}
            </h3>
            <p>
              {searchQuery
                ? "Try a different keyword."
                : activeTab === "all"
                  ? "Need help? Our team is ready to assist you."
                  : "Try a different filter to see your other tickets."}
            </p>
            {!searchQuery && activeTab === "all" && (
              <Link href="/dashboard/support/new" className="sp-empty-btn">
                <i className="fas fa-plus"></i>
                Create Your First Ticket
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .sp-page {
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
        .sp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sp-header-left {
          min-width: 0;
        }

        .sp-header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sp-header-left h1 > i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .sp-header-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 12px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
        }

        .sp-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .sp-new-btn {
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

        .sp-new-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Stats
           ============================================================ */
        .sp-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        /* ============================================================
           Filters Row: Tabs + Search
           ============================================================ */
        .sp-filters {
          display: flex;
          gap: 12px;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .sp-tabs-wrapper {
          flex: 1 1 420px;
          min-width: 0;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
        }

        .sp-tabs-wrapper::-webkit-scrollbar {
          height: 4px;
        }

        .sp-tabs-wrapper::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        .sp-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          background: #f1f5f7;
          border-radius: 14px;
          min-width: 100%;
        }

        :global(.sp-tab) {
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

        :global(.sp-tab i) {
          font-size: 12px;
        }

        :global(.sp-tab:hover) {
          color: #0b1f18;
          background: rgba(255, 255, 255, 0.6);
        }

        :global(.sp-tab.active) {
          background: white;
          color: #13795b;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
        }

        .sp-tab-count {
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

        :global(.sp-tab.active) .sp-tab-count {
          background: #eaf7f1;
          color: #0b5b43;
        }

        /* ============================================================
           Search
           ============================================================ */
        .sp-search {
          flex: 1 1 300px;
          min-width: 0;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          background: white;
          border: 1.5px solid #e8edf0;
          border-radius: 14px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }

        .sp-search:focus-within {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }

        .sp-search > i {
          color: #94a3b8;
          font-size: 13px;
          flex-shrink: 0;
        }

        .sp-search input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #0b1f18;
          font-family: inherit;
          height: 100%;
          padding: 0;
        }

        .sp-search input::placeholder {
          color: #94a3b8;
        }

        .sp-search-clear {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 6px;
          font-size: 11px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .sp-search-clear:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        /* ============================================================
           List
           ============================================================ */
        .sp-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ============================================================
           Empty State
           ============================================================ */
        .sp-empty {
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

        .sp-empty i {
          font-size: 48px;
          opacity: 0.35;
          margin-bottom: 6px;
        }

        .sp-empty h3 {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .sp-empty p {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
          max-width: 340px;
          line-height: 1.5;
        }

        .sp-empty-btn {
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

        .sp-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 1100px) {
          .sp-stats {
            gap: 12px;
          }
        }

        @media (max-width: 900px) {
          .sp-header-left h1 {
            font-size: 20px;
          }

          .sp-header-left h1 > i {
            padding: 6px;
            font-size: 15px;
          }

          .sp-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sp-filters {
            flex-direction: column;
            gap: 10px;
          }

          .sp-tabs-wrapper,
          .sp-search {
            flex: 1 1 auto;
            width: 100%;
          }

          :global(.sp-tab) {
            padding: 9px 14px;
            font-size: 12.5px;
            gap: 6px;
          }

          :global(.sp-tab i) {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .sp-page {
            gap: 16px;
          }

          .sp-header-left h1 {
            font-size: 18px;
          }

          .sp-header-left p {
            font-size: 12.5px;
          }

          .sp-new-btn {
            padding: 10px 16px;
            font-size: 12.5px;
            width: 100%;
            justify-content: center;
          }

          .sp-stats {
            gap: 10px;
          }

          .sp-list {
            gap: 12px;
          }

          :global(.sp-tab) {
            padding: 8px 12px;
            font-size: 12px;
          }

          .sp-tab-count {
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            font-size: 10px;
          }

          .sp-search {
            height: 44px;
            padding: 0 12px;
            border-radius: 12px;
          }

          .sp-search input {
            font-size: 13px;
          }

          .sp-empty {
            padding: 40px 18px;
          }

          .sp-empty i {
            font-size: 40px;
          }

          .sp-empty h3 {
            font-size: 15px;
          }

          .sp-empty p {
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
      <div className="sp-stat">
        <div className={`sp-stat-icon ${color}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="sp-stat-info">
          <div className="sp-stat-value">{value}</div>
          <div className="sp-stat-label">{label}</div>
        </div>
      </div>

      <style jsx>{`
        .sp-stat {
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

        .sp-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          border-color: #13795b;
        }

        .sp-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .sp-stat-icon.indigo {
          background: #eef0ff;
          color: #4f46e5;
        }

        .sp-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .sp-stat-icon.green {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .sp-stat-icon.gray {
          background: #f1f5f7;
          color: #475569;
        }

        .sp-stat-info {
          min-width: 0;
          flex: 1;
        }

        .sp-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .sp-stat-label {
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
          .sp-stat {
            gap: 12px;
            padding: 14px;
          }

          .sp-stat-icon {
            width: 40px;
            height: 40px;
            font-size: 15px;
            border-radius: 11px;
          }

          .sp-stat-value {
            font-size: 19px;
          }

          .sp-stat-label {
            font-size: 11px;
          }
        }

        @media (max-width: 500px) {
          .sp-stat {
            padding: 12px;
            gap: 10px;
            border-radius: 14px;
          }

          .sp-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 14px;
            border-radius: 10px;
          }

          .sp-stat-value {
            font-size: 17px;
          }

          .sp-stat-label {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}