// src/components/admin/AdminPaymentsFilter.js
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminPaymentsFilter({ plans = [] }) {
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
    url.searchParams.set("page", "1");
    router.push(url.toString());
  };

  const handleSearch = (e) => {
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
      {/* Search */}
      <form
        onSubmit={handleSearch}
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
          placeholder="Search by invoice, reference, email, or name..."
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

      {/* Status */}
      <select
        value={searchParams.get("status") || ""}
        onChange={(e) => updateUrl({ status: e.target.value })}
        style={filterSelectStyle}
      >
        <option value="">All Statuses</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {/* Plan */}
      <select
        value={searchParams.get("planId") || ""}
        onChange={(e) => updateUrl({ planId: e.target.value })}
        style={filterSelectStyle}
      >
        <option value="">All Plans</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
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