// src/components/product/ProductFilterBar.js
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/categories"; // ✅ داده‌های سلسله‌مراتبی

export default function ProductFilterBar({
  currentCategory,
  currentSubCategory,
  currentSearch,
  currentSort,
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch || "");

  // ====== ساخت لیست مسطح از گزینه‌ها با تورفتگی ======
  const categoryOptions = useMemo(() => {
    const options = [{ value: "", label: "All Categories", isParent: false }];
    const parents = categories.filter((c) => c.parent === 0);
    parents.forEach((parent) => {
      // گزینه دسته‌ی اصلی (بولد)
      options.push({
        value: parent.name,
        label: parent.name,
        isParent: true,
      });
      // زیردسته‌ها
      const children = categories.filter((c) => c.parent === parent.id);
      children.forEach((child) => {
        // مقدار ترکیبی: دسته|زیردسته
        options.push({
          value: `${parent.name}|${child.name}`,
          label: `    ${child.name}`, // تورفتگی با فاصله
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
      // همه
      updateUrl({ category: "", subCategory: "" });
    } else if (selected.includes("|")) {
      // زیردسته
      const [cat, sub] = selected.split("|");
      updateUrl({ category: cat, subCategory: sub });
    } else {
      // دسته‌ی اصلی
      updateUrl({ category: selected, subCategory: "" });
    }
  };

  const handleSortChange = (e) => {
    updateUrl({ sort: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  // ====== تعیین مقدار انتخابی برای نمایش ======
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
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary search-btn">
          <i className="fas fa-search"></i> Search
        </button>
      </form>
      <div className="filter-group">
        {/* ====== دراپ‌داون واحد ====== */}
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

        {/* ====== فیلتر مرتب‌سازی ====== */}
        <select
          name="sort"
          onChange={handleSortChange}
          defaultValue={currentSort || "newest"}
        >
          <option value="newest">Sort By: Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}