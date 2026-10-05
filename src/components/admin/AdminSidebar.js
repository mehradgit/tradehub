"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react"; // ✅ Added
export default function AdminSidebar({ isOpen, onClose }) {
  const [stats, setStats] = useState({ openTickets: 0 }); // ✅ Added
  const pathname = usePathname();

  // ✅ fetch admin stats
  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => { });
  }, []);
  const menuItems = [
    // Main Menu section (verify these match the structure)
    { label: "Dashboard", icon: "fa-house", href: "/admin" },
    { label: "Users", icon: "fa-users", href: "/admin/users" },
    { label: "Suppliers", icon: "fa-people-group", href: "/admin/suppliers" },
    { label: "Buyers", icon: "fa-user-tag", href: "/admin/buyers" },
    { label: "Products", icon: "fa-box", href: "/admin/products" },
    { label: "Requests", icon: "fa-box", href: "/admin/requests" },
    { label: "Categories", icon: "fa-layer-group", href: "/admin/categories" },
    {
      label: "Attributes",
      icon: "fa-list-check",
      href: "/admin/attributes",
    },
    {
      label: "Vocabularies",
      icon: "fa-spell-check",
      href: "/admin/vocabularies",
    },
    { label: "Homepage", icon: "fa-house-chimney", href: "/admin/homepage" },
    {
      label: "Inquiries",
      icon: "fa-inbox",
      href: "/admin/inquiries",
      count: 3,
    },
    {
      label: "Messages",
      icon: "fa-message",
      href: "/admin/messages",
      count: 12,
    },

    // Management section
  ];

  const managementItems = [
    { label: "Subscriptions", icon: "fa-crown", href: "/admin/subscriptions" },
    { label: "Payments", icon: "fa-credit-card", href: "/admin/payments" },
    { label: "Coupons", icon: "fa-tag", href: "/admin/coupons" },
    { label: "Plans", icon: "fa-chart-simple", href: "/admin/plans" },
    {
      label: "Tickets",
      icon: "fa-headset",
      href: "/admin/tickets",
      badgeKey: "openTickets",
    },
    {
      label: "Approvals",
      icon: "fa-clipboard-check",
      href: "/admin/approvals",
    },
    { label: "Email Queue", icon: "fa-envelope-open-text", href: "/admin/emails" },
    {
      label: "Email Templates",
      icon: "fa-file-code",
      href: "/admin/email-templates",
    },
    {
      label: "Scheduled Jobs",
      icon: "fa-clock-rotate-left",
      href: "/admin/scheduled-jobs",
    },
    { label: "Analytics", icon: "fa-chart-line", href: "/admin/analytics" },
    {
      label: "Access Control",
      icon: "fa-shield-halved",
      href: "/admin/settings/access-control",
    },
    { label: "Email Users", icon: "fa-envelope", href: "/admin/email-users" },
    { label: "Reports", icon: "fa-file-lines", href: "/admin/reports" },
    { label: "Settings", icon: "fa-gear", href: "/admin/settings" },
    { label: "Backup & Restore", icon: "fa-database", href: "/admin/backup" },
    // System tools: rebuild indexes and normalize legacy vocabulary values
    {
      label: "Maintenance",
      icon: "fa-screwdriver-wrench",
      href: "/admin/maintenance",
    },
    {
      label: "Reset Site",
      icon: "fa-triangle-exclamation",
      href: "/admin/reset",
    },
  ];

  const renderItem = (item) => {
    // ✅ Sub-paths also activate their parent
    //    (e.g. /admin/emails/123 → Email Queue)
    const isActive =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={isActive ? "active" : ""}
        onClick={onClose} // ✅ Close the sidebar when any link is clicked
      >
        <i className={`fa-solid ${item.icon}`}></i>
        {item.label}
        {item.count && <span className="nav-count">{item.count}</span>}
      </Link>
    );
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="admin-logo">
        <div className="admin-logo-mark">
          <i className="fa-solid fa-leaf"></i>
        </div>
        <div>
          <b>FoodTradeLink</b>
          <span>B2B Food Marketplace</span>
        </div>
      </div>

      <nav className="admin-nav">
        <div className="admin-nav-label">Main Menu</div>
        {menuItems.map(renderItem)}

        <div className="admin-nav-label">Management</div>
        {managementItems.map(renderItem)}
      </nav>

      <div className="admin-side-promo">
        <div className="admin-side-photo"></div>
        <div className="admin-side-copy">
          <b>
            Better Food
            <br />
            Bigger Opportunities
          </b>
          <p>
            Connect with trusted global partners and grow your food business.
          </p>
          <button>Explore Marketplace →</button>
        </div>
      </div>
    </aside>
  );
}
