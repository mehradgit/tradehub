// src/components/dashboard/BillingFilters.js
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function BillingFilters({ currentStatus, currentSearch }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch || "");

  const statuses = [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

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
        gap: 12,
        marginBottom: 20,
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
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--d-bg, #f6f8f9)",
          borderRadius: 10,
          padding: "4px 4px 4px 14px",
          border: "1px solid var(--d-border, #e8edf0)",
        }}
      >
        <i
          className="fas fa-search"
          style={{ color: "var(--d-muted, #94a3b8)", fontSize: 13 }}
        ></i>
        <input
          type="text"
          placeholder="Search by invoice or reference..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            border: 0,
            outline: 0,
            background: "transparent",
            fontSize: 13,
            padding: "8px 0",
            color: "var(--d-dark, #0b1f18)",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "7px 16px",
            background: "var(--d-primary, #0f9e6e)",
            color: "white",
            border: 0,
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {statuses.map((s) => {
          const isActive = (currentStatus || "all") === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => updateUrl({ status: s.value })}
              style={{
                padding: "8px 14px",
                borderRadius: 50,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: isActive ? "var(--d-primary, #0f9e6e)" : "white",
                color: isActive ? "white" : "var(--d-text, #334155)",
                border: `1px solid ${
                  isActive
                    ? "var(--d-primary, #0f9e6e)"
                    : "var(--d-border, #e8edf0)"
                }`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}