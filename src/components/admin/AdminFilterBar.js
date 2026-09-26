// src/components/admin/AdminFilterBar.js
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminFilterBar({ filters = [], searchPlaceholder = "Search..." }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "16px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleSearchSubmit}
        style={{
          flex: 1,
          minWidth: "200px",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "4px 4px 4px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <i className="fa-solid fa-magnifying-glass" style={{ color: "#8b9b95", fontSize: "13px" }}></i>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            border: 0,
            outline: 0,
            background: "transparent",
            fontSize: "12px",
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
            borderRadius: "7px",
            padding: "7px 14px",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          Search
        </button>
      </form>

      {filters.map((filter) => (
        <select
          key={filter.name}
          value={searchParams.get(filter.name) || ""}
          onChange={(e) => updateUrl({ [filter.name]: e.target.value })}
          style={{
            padding: "9px 14px",
            fontSize: "11px",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            background: "#fff",
            color: "var(--text)",
            cursor: "pointer",
            fontFamily: "inherit",
            outline: "none",
          }}
        >
          <option value="">{filter.placeholder}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}