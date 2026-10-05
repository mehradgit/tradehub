"use client";

import { useSession } from "next-auth/react";

export default function AdminTopbar({ onMenuToggle }) {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <header className="admin-topbar">
      {/* Hamburger button, mobile only */}
      <button className="admin-mobile-toggle" onClick={onMenuToggle}>
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="admin-search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input placeholder="Search users, products, suppliers..." />
      </div>

      <div className="admin-top-right">
        <button className="admin-top-btn">
          <i className="fa-regular fa-bell"></i>
          <span className="admin-notification"></span>
        </button>

        <button className="admin-lang">
          <i className="fa-solid fa-globe"></i> English ⌄
        </button>

        <div className="admin-user">
          <div className="admin-user-avatar">{initials}</div>
          <div>
            <b>{user?.name || "Admin"}</b>
            <span>Super Admin</span>
          </div>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: 8, color: "#76857f" }}></i>
        </div>
      </div>
    </header>
  );
}