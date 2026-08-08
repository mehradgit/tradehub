// src/components/dashboard/RecentMessages.js
"use client";

import Link from "next/link";

export default function RecentMessages({ messages }) {
  return (
    <div className="recent-messages">
      <h3>
        <span>
          <i className="fas fa-envelope" style={{ color: "var(--primary)" }}></i> Recent Messages
        </span>
        <Link href="/messages">View All</Link>
      </h3>
      {messages.map((msg) => (
        <div key={msg.id} className="message-item">
          <div className="message-avatar">{msg.initials}</div>
          <div className="message-content">
            <div className="msg-sender">{msg.sender}</div>
            <div className="msg-preview">{msg.preview}</div>
            <div className="msg-time">{msg.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}