// src/components/profiles/ProfileFilter.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileFilter({
  currentRole,
  currentCategory,
  currentSearch,
  categories,
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch || "");

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

  const handleRoleChange = (e) => {
    updateUrl({ role: e.target.value });
  };

  const handleCategoryChange = (e) => {
    updateUrl({ category: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  return (
    <div className="filter-bar mb-4">
      <form className="search-box" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search profiles..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary search-btn">
          <i className="fas fa-search"></i> Search
        </button>
      </form>
      <div className="filter-group">
        <select
          name="role"
          onChange={handleRoleChange}
          defaultValue={currentRole || "all"}
        >
          <option value="all">All</option>
          <option value="supplier">Suppliers</option>
          <option value="buyer">Buyers</option>
        </select>

        {/* ====== فیلتر دسته‌بندی ====== */}
        <select
          name="category"
          onChange={handleCategoryChange}
          defaultValue={currentCategory || ""}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}