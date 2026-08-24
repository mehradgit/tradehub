// src/components/requests/FilterBar.js
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/categories";

export default function FilterBar({
  currentCategory,
  currentSubCategory,
  currentSearch,
  currentFilter,
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch || "");

  // ====== ساخت لیست سلسله‌مراتبی برای دراپ‌داون ======
  const categoryOptions = useMemo(() => {
    const options = [{ value: "", label: "All Categories", isParent: false }];
    const parents = categories.filter((c) => c.parent === 0);
    parents.forEach((parent) => {
      options.push({
        value: parent.name,
        label: parent.name,
        isParent: true,
      });
      const children = categories.filter((c) => c.parent === parent.id);
      children.forEach((child) => {
        options.push({
          value: `${parent.name}|${child.name}`,
          label: `    ${child.name}`,
          isParent: false,
        });
      });
    });
    return options;
  }, []);

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

  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    if (selected === "") {
      updateUrl({ category: "", subCategory: "" });
    } else if (selected.includes("|")) {
      const [cat, sub] = selected.split("|");
      updateUrl({ category: cat, subCategory: sub });
    } else {
      updateUrl({ category: selected, subCategory: "" });
    }
  };

  const handleFilterChange = (e) => {
    updateUrl({ filter: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  const selectedValue = useMemo(() => {
    if (currentCategory && currentSubCategory) {
      return `${currentCategory}|${currentSubCategory}`;
    } else if (currentCategory) {
      return currentCategory;
    } else {
      return "";
    }
  }, [currentCategory, currentSubCategory]);

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
        {/* ====== دراپ‌داون واحد دسته‌ها ====== */}
        <select
          name="category"
          onChange={handleCategoryChange}
          value={selectedValue}
          style={{ minWidth: "180px" }}
        >
          {categoryOptions.map((opt, idx) => (
            <option
              key={idx}
              value={opt.value}
              style={
                opt.isParent
                  ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                  : {}
              }
            >
              {opt.label}
            </option>
          ))}
        </select>

        {/* ====== فیلتر وضعیت (فقط Urgent / All) ====== */}
        <select
          name="filter"
          onChange={handleFilterChange}
          defaultValue={currentFilter || "all"}
        >
          <option value="all">All Requests</option>
          <option value="urgent">Urgent Only</option>
        </select>
      </div>
    </div>
  );
}