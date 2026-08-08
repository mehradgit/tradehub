// src/components/suppliers/SupplierFilterBar.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupplierFilterBar({
  countries,
  currentCountry,
  currentSearch,
  currentSort,
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

  const handleCountryChange = (e) => {
    updateUrl({ country: e.target.value });
  };

  const handleSortChange = (e) => {
    updateUrl({ sort: e.target.value });
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
          placeholder="Search suppliers..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary search-btn">
          <i className="fas fa-search"></i> Search
        </button>
      </form>
      <div className="filter-group">
        <select
          name="country"
          onChange={handleCountryChange}
          defaultValue={currentCountry || ""}
        >
          <option value="">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          name="sort"
          onChange={handleSortChange}
          defaultValue={currentSort || "newest"}
        >
          <option value="newest">Sort By: Newest</option>
          <option value="oldest">Oldest</option>
          <option value="products">Most Products</option>
        </select>
      </div>
    </div>
  );
}