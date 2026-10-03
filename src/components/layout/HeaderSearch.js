// src/components/layout/HeaderSearch.js
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";

export default function HeaderSearch() {
  const router = useRouter();
  const { categories } = useCategories();   // âœ… دسته‌ها از DB

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState({
    value: "",
    label: "All Categories",
    icon: "fa-border-all",
  });
  const [query, setQuery] = useState("");

  const inputRef = useRef(null);
  const categoryRef = useRef(null);

  // ============================================================
  // âœ… ساخت لیست دسته‌ها داینامیک از DB
  // ============================================================
  const categoryOptions = useMemo(() => {
    const options = [
      { value: "", label: "All Categories", icon: "fa-border-all" },
    ];

    const parents = categories
      .filter((c) => c.parent === 0 && c.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    parents.forEach((cat) => {
      options.push({
        value: cat.id,                          // âœ… ID به جای name
        label: cat.name,
        icon: cat.icon ? `fa-${cat.icon}` : "fa-tag",
      });
    });

    return options;
  }, [categories]);

  // ============================================================
  // Toggle search bar
  // ============================================================
  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setDropdownOpen(false);
      return next;
    });
  };

  const closeSearch = () => {
    setIsOpen(false);
    setDropdownOpen(false);
  };

  // ============================================================
  // Submit → /search?q=...&category=...
  // ============================================================
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCategory.value)
      params.set("category", selectedCategory.value);

    if (!params.toString()) {
      inputRef.current?.focus();
      return;
    }

    router.push(`/search?${params.toString()}`);
    closeSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      if (dropdownOpen) setDropdownOpen(false);
      else closeSearch();
    }
  };

  // ============================================================
  // Focus input when opened
  // ============================================================
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ============================================================
  // Close dropdown on outside click
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <>
      {/* ==================== TOGGLE BUTTON ==================== */}
      <button
        type="button"
        className={`hs-toggle ${isOpen ? "active" : ""}`}
        onClick={handleToggle}
        aria-label="Toggle search"
        aria-expanded={isOpen}
        aria-controls="hs-search-bar"
      >
        <i className="fa-solid fa-magnifying-glass hs-icon-search" />
        <i className="fa-solid fa-xmark hs-icon-close" />
      </button>

      {/* ==================== SEARCH BAR ==================== */}
      <div
        id="hs-search-bar"
        className={`hs-bar ${isOpen ? "open" : ""}`}
        role="search"
      >
        <div className="container">
          <form className="hs-pill" onSubmit={handleSubmit}>
            <i className="fa-solid fa-magnifying-glass hs-pill-icon" />

            <input
              ref={inputRef}
              type="text"
              className="hs-input"
              placeholder="Search for products, suppliers, or trade requests..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <span className="hs-divider" />

            {/* Category Dropdown */}
            <div className="hs-category" ref={categoryRef}>
              <button
                type="button"
                className={`hs-category-trigger ${
                  dropdownOpen ? "open" : ""
                }`}
                onClick={() => setDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <i
                  className={`fa-solid ${selectedCategory.icon} hs-grid-icon`}
                />
                <span className="hs-category-label">
                  {selectedCategory.label}
                </span>
                <i className="fa-solid fa-chevron-down hs-chevron" />
              </button>

              {dropdownOpen && (
                <ul className="hs-category-menu" role="listbox">
                  {categoryOptions.map((cat) => (
                    <li
                      key={cat.value || "all"}
                      role="option"
                      aria-selected={selectedCategory.value === cat.value}
                      className={
                        selectedCategory.value === cat.value
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        setSelectedCategory(cat);
                        setDropdownOpen(false);
                      }}
                    >
                      <i className={`fa-solid ${cat.icon}`} />
                      {cat.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="hs-submit">
              <i className="fa-solid fa-magnifying-glass" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}