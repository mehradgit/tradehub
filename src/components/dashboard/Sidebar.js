// src/components/dashboard/Sidebar.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, onClose }) {
  const [stats, setStats] = useState({ unreadMessages: 0, unseenInquiries: 0 });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // گوش دادن به رویداد به‌روزرسانی پیام‌ها
    const handleMessagesRead = () => {
      fetchStats(); // دوباره آمار را دریافت کن
    };
    window.addEventListener("messages-read", handleMessagesRead);
    return () => {
      window.removeEventListener("messages-read", handleMessagesRead);
    };
  }, []);

  const menuItems = [
    { label: "Dashboard", icon: "fa-chart-pie", href: "/dashboard" },
    { label: "My Products", icon: "fa-box", href: "/dashboard/products" },
    {
      label: "My Buying Requests",
      icon: "fa-cart-shopping",
      href: "/dashboard/requests",
    },
    {
      label: "Messages",
      icon: "fa-message",
      href: "/dashboard/messages",
      badgeKey: "unreadMessages",
    },
    {
      label: "Inquiries",
      icon: "fa-file-invoice",
      href: "/dashboard/inquiries",
      badgeKey: "unseenInquiries",
    },
    { divider: true },
    { label: "Analytics", icon: "fa-chart-line", href: "/dashboard/analytics" },
    { label: "Customers", icon: "fa-users", href: "/dashboard/customers" },
    {
      label: "Saved Items",
      icon: "fa-heart",
      href: "/dashboard/saved-products",
    },
    { divider: true },
    {
      label: "Company Profile",
      icon: "fa-building",
      href: "/dashboard/profile",
    },
    { label: "Settings", icon: "fa-gear", href: "/dashboard/settings" },
  ];

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <i className="fa-solid fa-leaf"></i>
        </div>
        <div>
          <div className="brand-title">FoodTrade</div>
          <div className="brand-subtitle">B2B Food Marketplace</div>
        </div>
      </div>

      <div className="sidebar-content">
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <div key={index} className="menu-title">
                {" "}
              </div>
            );
          }
          const isActive = pathname === item.href;
          const badgeValue = item.badgeKey ? stats[item.badgeKey] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`menu-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
              {badgeValue !== null && badgeValue > 0 && (
                <span className="menu-badge">
                  {badgeValue > 99 ? "99+" : badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="plan-box">
        <div className="plan-title">CURRENT PLAN</div>
        <div className="plan-name">Gold Business</div>
        <Link href="/plans" onClick={onClose}>
          Manage Subscription <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>
    </aside>
  );
}
