// src/components/product/ProductFilterBar.js
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories"

export default function ProductFilterBar({
  currentCategory,
  currentSubCategory,
  currentSearch,
  currentSort,
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch || "");
  const { categories } = useCategories();
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
          label: `    ${child.name}`,
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

  const handleSortChange = (e) => {
    updateUrl({ sort: e.target.value });
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
    }
    return "";
  }, [currentCategory, currentSubCategory]);

  return (
    <>
      <div className="products-filter-bar">
        {/* ===== Search ===== */}
        <form className="filter-search" onSubmit={handleSearchSubmit}>
          <i className="fas fa-search filter-search-icon"></i>
          <input
            type="text"
            name="search"
            placeholder="Search products by name, category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="filter-search-btn">
            <span className="btn-text">Search</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        {/* ===== Filters ===== */}
        <div className="filter-selects">
          <div className="filter-select-wrapper">
            <i className="fas fa-layer-group filter-select-icon"></i>
            <select
              name="category"
              onChange={handleCategoryChange}
              value={selectedValue}
              aria-label="Filter by category"
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
          </div>

          <div className="filter-select-wrapper">
            <i className="fas fa-sort filter-select-icon"></i>
            <select
              name="sort"
              onChange={handleSortChange}
              defaultValue={currentSort || "newest"}
              aria-label="Sort products"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ====== Styles ====== */}
      <style jsx>{`
        /* ============================================================
           Filter Bar Container
           ============================================================ */
        .products-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          align-items: stretch;
          flex-wrap: wrap;
          width: 100%;
        }

        /* ============================================================
           Search
           ============================================================ */
        .filter-search {
          flex: 1 1 320px;
          min-width: 0;
          height: 48px;
          display: flex;
          align-items: center;
          background: white;
          border: 1.5px solid #e8edf0;
          border-radius: 14px;
          padding: 0 4px 0 16px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }

        .filter-search:focus-within {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }

        .filter-search-icon {
          color: #94a3b8;
          font-size: 14px;
          flex-shrink: 0;
          margin-right: 10px;
        }

        .filter-search input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #0b1f18;
          font-family: inherit;
          padding: 0;
          height: 100%;
        }

        .filter-search input::placeholder {
          color: #94a3b8;
        }

        .filter-search-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 20px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border: none;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(19, 121, 91, 0.2);
        }

        .filter-search-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.3);
        }

        .filter-search-btn i {
          font-size: 11px;
          transition: transform 0.2s ease;
        }

        .filter-search-btn:hover i {
          transform: translateX(3px);
        }

        /* ============================================================
           Selects
           ============================================================ */
        .filter-selects {
          display: flex;
          gap: 10px;
          align-items: stretch;
          flex-shrink: 0;
        }

        .filter-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          height: 48px;
          background: white;
          border: 1.5px solid #e8edf0;
          border-radius: 14px;
          padding: 0 8px 0 14px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 180px;
        }

        .filter-select-wrapper:focus-within {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }

        .filter-select-icon {
          color: #94a3b8;
          font-size: 13px;
          flex-shrink: 0;
          margin-right: 8px;
          pointer-events: none;
        }

        .filter-select-wrapper select {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13.5px;
          color: #0b1f18;
          font-weight: 600;
          font-family: inherit;
          padding: 0 24px 0 0;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 6px center;
          background-size: 12px;
        }

        /* ============================================================
           Responsive
           ============================================================ */

        /* تبلت بزرگ */
        @media (max-width: 1100px) {
          .filter-search {
            flex: 1 1 100%;
          }

          .filter-selects {
            flex: 1 1 100%;
          }

          .filter-select-wrapper {
            flex: 1;
            min-width: 0;
          }
        }

        /* تبلت */
        @media (max-width: 768px) {
          .products-filter-bar {
            gap: 10px;
            margin-bottom: 18px;
          }

          .filter-search {
            height: 46px;
            padding: 0 4px 0 14px;
            border-radius: 12px;
          }

          .filter-search input {
            font-size: 13.5px;
          }

          .filter-search-btn {
            height: 38px;
            padding: 0 16px;
            font-size: 12.5px;
            border-radius: 10px;
          }

          .filter-search-btn .btn-text {
            display: none;
          }

          .filter-search-btn i {
            font-size: 13px;
          }

          .filter-selects {
            gap: 8px;
          }

          .filter-select-wrapper {
            height: 46px;
            border-radius: 12px;
            padding: 0 6px 0 12px;
          }

          .filter-select-wrapper select {
            font-size: 13px;
          }
        }

        /* موبایل */
        @media (max-width: 500px) {
          .products-filter-bar {
            gap: 8px;
          }

          .filter-search {
            height: 44px;
            border-radius: 11px;
            padding: 0 4px 0 12px;
          }

          .filter-search input {
            font-size: 13px;
          }

          .filter-search-btn {
            height: 36px;
            padding: 0 12px;
            border-radius: 9px;
            gap: 0;
          }

          .filter-search-btn i {
            font-size: 12px;
          }

          .filter-selects {
            flex-direction: row;
            width: 100%;
            gap: 8px;
          }

          .filter-select-wrapper {
            flex: 1 1 0;
            min-width: 0;
            height: 44px;
            border-radius: 11px;
            padding: 0 6px 0 10px;
          }

          .filter-select-icon {
            font-size: 11px;
            margin-right: 6px;
          }

          .filter-select-wrapper select {
            font-size: 12px;
            padding-right: 18px;
            background-size: 10px;
            background-position: right 4px center;
          }
        }
      `}</style>
    </>
  );
}