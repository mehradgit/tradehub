// src/components/requests/FilterBar.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FilterBar({ categories, currentCategory, currentSearch, currentFilter }) {
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
    // Reset page to 1 when filters change
    url.searchParams.set("page", "1");
    router.push(url.toString());
  };

  const handleCategoryChange = (e) => {
    updateUrl({ category: e.target.value });
  };

  const handleFilterClick = (filter) => {
    updateUrl({ filter });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  return (
    <div className="filter-bar">
      <form className="search-box" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          name="search"
          placeholder="Search requests..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary search-btn">
          <i className="fas fa-search"></i> Search
        </button>
      </form>
      <div className="filter-group">
        <select
          name="category"
          onChange={handleCategoryChange}
          defaultValue={currentCategory || ""}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category} value={cat.category}>
              {cat.category}
            </option>
          ))}
        </select>
        <select
          name="sort"
          onChange={(e) => updateUrl({ sort: e.target.value })}
          defaultValue="newest"
        >
          <option value="newest">Sort By: Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <button
          className={`btn-filter ${currentFilter === "all" || !currentFilter ? "active" : ""}`}
          onClick={() => handleFilterClick("all")}
        >
          All
        </button>
        <button
          className={`btn-filter ${currentFilter === "urgent" ? "active" : ""}`}
          onClick={() => handleFilterClick("urgent")}
        >
          Urgent
        </button>
        <button
          className={`btn-filter ${currentFilter === "verified" ? "active" : ""}`}
          onClick={() => handleFilterClick("verified")}
        >
          Verified
        </button>
      </div>
    </div>
  );
}