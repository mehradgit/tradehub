// src/components/dashboard/Topbar.js
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Topbar({ onMenuToggle }) {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="top-icon mobile-menu"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <div className="page-title">
          <h1>Business Dashboard</h1>
          <p>Manage your B2B food marketplace activities</p>
        </div>
      </div>

      <div className="topbar-actions">
        <Link href="/" className="top-icon" title="Go to Homepage">
          <i className="fa-solid fa-house"></i>
        </Link>
        <div className="search-box">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Search products, requests..." />
        </div>
        <button className="top-icon">
          <i className="fa-regular fa-bell"></i>
          <span className="notification-dot"></span>
        </button>
        <div className="profile">
          <div className="avatar">{initials}</div>
          <div>
            <div className="profile-name">{user?.companyName || user?.name || "User"}</div>
            <div className="profile-role">Account Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}