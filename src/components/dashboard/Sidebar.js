// src/components/dashboard/Sidebar.js
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const PLAN_DISPLAY = {
  Basic: { name: "Basic", color: "basic", icon: "fa-leaf" },
  Bronze: { name: "Bronze", color: "bronze", icon: "fa-medal" },
  Silver: { name: "Silver", color: "silver", icon: "fa-award" },
  Gold: { name: "Gold", color: "gold", icon: "fa-crown" },
  FREE: { name: "Basic", color: "basic", icon: "fa-leaf" },
};

export default function Sidebar({ isOpen, onClose }) {
  const [stats, setStats] = useState({
    unreadMessages: 0,
    unseenInquiries: 0,
    openTickets: 0,
    unreadNotifications: 0,
  });
  const [userPlan, setUserPlan] = useState("Basic");
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, subRes] = await Promise.all([
        fetch("/api/user/dashboard-stats"),
        fetch("/api/user/subscription"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        const rawName = subData.plan?.name || "Basic";

        // Normalise: "SILVER" / "silver" / "Silver" -> "Silver"
        const normalized =
          rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

        // Check that the key exists in PLAN_DISPLAY
        const validKey = PLAN_DISPLAY[normalized] ? normalized : "Basic";

        console.log("🔍 Sidebar plan:", { rawName, normalized, validKey });

        setUserPlan(validKey);
      }
    } catch (err) {
      console.error("Sidebar fetch error:", err);
      setUserPlan("Basic");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener("messages-read", handleRefresh);
    window.addEventListener("notifications-updated", handleRefresh);
    window.addEventListener("plan-updated", handleRefresh);
    return () => {
      window.removeEventListener("messages-read", handleRefresh);
      window.removeEventListener("notifications-updated", handleRefresh);
      window.removeEventListener("plan-updated", handleRefresh);
    };
  }, [fetchData]);

  const menuItems = [
    { label: "Dashboard", icon: "fa-gauge-high", href: "/dashboard" },
    {
      label: "Notifications",
      icon: "fa-bell",
      href: "/dashboard/notifications",
      badgeKey: "unreadNotifications",
    },
    { label: "My Products", icon: "fa-box", href: "/dashboard/products" },
    {
      label: "Buying Requests",
      icon: "fa-cart-shopping",
      href: "/dashboard/requests",
    },
    {
      label: "Messages",
      icon: "fa-comment-dots",
      href: "/dashboard/messages",
      badgeKey: "unreadMessages",
    },
    {
      label: "Inquiries",
      icon: "fa-file-invoice",
      href: "/dashboard/inquiries",
      badgeKey: "unseenInquiries",
    },
  ];

  const workspaceItems = [
    { label: "Analytics", icon: "fa-chart-line", href: "/dashboard/analytics" },
    { label: "Customers", icon: "fa-users", href: "/dashboard/customers" },
    {
      label: "Saved Items",
      icon: "fa-bookmark",
      href: "/dashboard/saved-products",
    },
    {
      label: "Support",
      icon: "fa-headset",
      href: "/dashboard/support",
      badgeKey: "openTickets",
    },
  ];

  const accountItems = [
    {
      label: "Billing & Payments",
      icon: "fa-credit-card",
      href: "/dashboard/billing",
    },
    {
      label: "Company Profile",
      icon: "fa-building",
      href: "/dashboard/profile",
    },
    { label: "Settings", icon: "fa-gear", href: "/dashboard/settings" },
  ];

  const renderItem = (item) => {
    const isActive = pathname === item.href;
    const badgeValue = item.badgeKey ? stats[item.badgeKey] : null;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-item ${isActive ? "active" : ""}`}
        onClick={onClose}
      >
        <i className={`fas ${item.icon}`}></i>
        <span>{item.label}</span>
        {badgeValue > 0 && (
          <span className="nav-badge">
            {badgeValue > 99 ? "99+" : badgeValue}
          </span>
        )}
      </Link>
    );
  };

  const planDisplay = PLAN_DISPLAY[userPlan] || PLAN_DISPLAY.Basic;
  const isFree = !userPlan || userPlan === "Basic" || userPlan === "FREE";

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand">
        <Image
          src="/images/logo-foodtradelink.svg"
          alt="FoodTradeLink"
          width={220}
          height={60}
          className="sidebar-logo"
        />
      </div>

      <nav className="nav-section">
        <div className="nav-label">Main</div>
        {menuItems.map(renderItem)}

        <div className="nav-label">Workspace</div>
        {workspaceItems.map(renderItem)}

        <div className="nav-label">Account</div>
        {accountItems.map(renderItem)}
      </nav>

      <div className={`plan-card ${planDisplay.color}`}>
        <div className="plan-top">
          <i className={`fas ${planDisplay.icon}`}></i>
          Current Plan
        </div>
        <div className="plan-name">{planDisplay.name}</div>
        <Link href="/plans" className="plan-link" onClick={onClose}>
          <span>{isFree ? "Upgrade Plan" : "Manage Subscription"}</span>
          <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
    </aside>
  );
}
