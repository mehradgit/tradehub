// src/components/dashboard/QuickActions.js
"use client";

import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      icon: "fa-box",
      text: "My Products",
      sub: "Manage your product listings",
      href: "/dashboard/products",
    },
    {
      icon: "fa-plus",
      text: "Add New Product",
      sub: "List your products for sale",
      href: "/products/new",
    },
    // ====== گزینه جدید اضافه شده ======
    {
      icon: "fa-shopping-cart",
      text: "My Buying Requests",
      sub: "Manage your buying requests",
      href: "/dashboard/requests",
    },
    // ===================================
    {
      icon: "fa-file-alt",
      text: "Post Buying Request",
      sub: "Find new suppliers",
      href: "/requests/new",
    },
    {
      icon: "fa-envelope",
      text: "View Messages",
      sub: "18 unread messages",
      href: "/messages",
    },
    {
      icon: "fa-chart-line",
      text: "Analytics Report",
      sub: "View your performance",
      href: "/dashboard/analytics",
    },
    {
      icon: "fa-bookmark",
      text: "Saved Products",
      sub: "View your saved products",
      href: "/dashboard/saved-products",
    },
    {
      icon: "fa-file-invoice",
      text: "My Inquiries",
      sub: "View your product inquiries",
      href: "/dashboard/inquiries",
    },
    {
      icon: "fa-envelope",
      text: "Messages",
      sub: "View your conversations",
      href: "/dashboard/messages",
    },
  ];

  return (
    <div className="quick-actions">
      <h3>
        <i className="fas fa-bolt" style={{ color: "var(--primary)" }}></i>{" "}
        Quick Actions
      </h3>
      {actions.map((action, index) => (
        <Link key={index} href={action.href} className="action-item">
          <i className={`fas ${action.icon}`}></i>
          <div>
            <div className="action-text">{action.text}</div>
            <div className="action-sub">{action.sub}</div>
          </div>
        </Link>
      ))}
      <Link href="/dashboard/edit-profile" className="action-item">
        <i className="fas fa-user-edit"></i>
        <div>
          <div className="action-text">Edit Profile</div>
          <div className="action-sub">
            Update your personal and business information
          </div>
        </div>
      </Link>
    </div>
  );
}