// src/components/dashboard/Topbar.js
"use client";

import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import GlobalSearch from "./GlobalSearch";

export default function Topbar({ onMenuToggle }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn mobile-menu"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          style={{ display: "none" }}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="page-info">
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Welcome back, here's your activity overview</div>
        </div>
      </div>

      <div className="topbar-right">
        <GlobalSearch />
        <NotificationBell />
        <UserMenu />
      </div>

      <style jsx global>{`
        @media (max-width: 992px) {
          .dashboard-layout .topbar .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}