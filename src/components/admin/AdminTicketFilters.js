// src/components/admin/AdminTicketFilters.js
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminTicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  const updateUrl = (params) => {
    const url = new URL(window.location.href);
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value && value !== "") {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    router.push(url.toString());
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 16,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* Search form */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          flex: 1,
          minWidth: 220,
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "4px 4px 4px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <i
          className="fa-solid fa-magnifying-glass"
          style={{ color: "#8b9b95", fontSize: 13 }}
        ></i>
        <input
          type="text"
          placeholder="Search by subject or ticket number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            border: 0,
            outline: 0,
            background: "transparent",
            fontSize: 12,
            padding: "8px 0",
            color: "var(--text)",
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--green2)",
            color: "white",
            border: 0,
            borderRadius: 7,
            padding: "7px 14px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {/* Status filter */}
      <select
        value={searchParams.get("status") || ""}
        onChange={(e) => updateUrl({ status: e.target.value })}
        style={filterSelectStyle}
      >
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="waiting_user">Waiting User</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      {/* Priority filter */}
      <select
        value={searchParams.get("priority") || ""}
        onChange={(e) => updateUrl({ priority: e.target.value })}
        style={filterSelectStyle}
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      {/* Category filter */}
      <select
        value={searchParams.get("category") || ""}
        onChange={(e) => updateUrl({ category: e.target.value })}
        style={filterSelectStyle}
      >
        <option value="">All Categories</option>
        <option value="technical">Technical</option>
        <option value="billing">Billing</option>
        <option value="account">Account</option>
        <option value="product">Product</option>
        <option value="dispute">Dispute</option>
        <option value="abuse">Report Abuse</option>
        <option value="feature">Feature Request</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}

const filterSelectStyle = {
  padding: "9px 14px",
  fontSize: 11,
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "#fff",
  color: "var(--text)",
  cursor: "pointer",
  fontFamily: "inherit",
  outline: "none",
};