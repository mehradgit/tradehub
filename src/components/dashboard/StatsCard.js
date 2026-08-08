// src/components/dashboard/StatsCard.js
"use client";

export default function StatsCard({ stats }) {
  const items = [
    {
      icon: "fa-box",
      color: "blue",
      number: stats.products,
      label: "Active Products",
      onClick: () => alert("📦 View your products"),
    },
    {
      icon: "fa-file-invoice",
      color: "orange",
      number: stats.requests,
      label: "Open Requests",
      onClick: () => alert("📋 View your requests"),
    },
    {
      icon: "fa-shopping-cart",
      color: "gold",
      number: stats.orders,
      label: "Orders This Month",
      onClick: () => alert("🛒 View your orders"),
    },
    {
      icon: "fa-envelope",
      color: "purple",
      number: stats.messages,
      label: "Unread Messages",
      onClick: () => alert("💬 View messages"),
    },
  ];

  return (
    <div className="stats-grid">
      {items.map((item, index) => (
        <div key={index} className="stat-card" onClick={item.onClick}>
          <div className={`stat-icon ${item.color}`}>
            <i className={`fas ${item.icon}`}></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{item.number}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}