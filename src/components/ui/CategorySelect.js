// src/components/ui/CategorySelect.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import {
  normalizeForSearch,
  scoreMatch,
} from "@/lib/searchNormalize";

// ============================================================
// Category picker — search-based, built for first-time users
//
// The old UI forced the user to understand three levels and hunt
// through 24 categories and 98 sub-categories by hand.
//
// Now they just type "honey" — matches from all three levels are
// listed with their full path and picked with one click.
//
// The component's API is UNCHANGED: the same three callbacks are
// called with the same arguments, so no form breaks. Search is
// only an extra way in.
//
// The site is English-only: no Persian strings, no Persian input
// matching, no localized text anywhere.
// ============================================================

// Popular search terms (not slugs, so this works with any taxonomy)
const POPULAR = [
  { label: "🍯 Honey", q: "honey" },
  { label: "🌾 Rice", q: "rice" },
  { label: "🫒 Olive oil", q: "olive" },
  { label: "☕ Coffee", q: "coffee" },
  { label: "🧂 Spices", q: "spice" },
  { label: "🥜 Nuts", q: "nut" },
];

const LEVEL_LABEL = { 1: "Category", 2: "Sub-category", 3: "Product type" };

// ============================================================
// Build a flat, searchable index out of the category list
// (the same flat shape useCategories already returns)
// ============================================================
function buildIndex(categories) {
  const out = [];
  if (!Array.isArray(categories)) return out;

  const parents = categories
    .filter((c) => c.parent === 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const p of parents) {
    if (!p?.id) continue;

    out.push({
      level: 1,
      name: p.name || p.id,
      icon: p.icon || "",
      path: p.name || p.id,
      parentId: p.id,
      subId: "",
      productType: "",
    });

    const subs = categories
      .filter((c) => c.parent === p.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    for (const s of subs) {
      if (!s?.id) continue;

      out.push({
        level: 2,
        name: s.name || s.id,
        icon: s.icon || p.icon || "",
        path: `${p.name} › ${s.name}`,
        parentId: p.id,
        subId: s.id,
        productType: "",
      });

      for (const t of s.productTypes || []) {
        if (!t) continue;
        out.push({
          level: 3,
          name: String(t),
          icon: s.icon || p.icon || "",
          path: `${p.name} › ${s.name} › ${t}`,
          parentId: p.id,
          subId: s.id,
          productType: String(t),
        });
      }
    }
  }

  return out;
}

// ============================================================
export default function CategorySelect({
  categoryValue = "",
  subCategoryValue = "",
  productTypeValue = "",
  onCategoryChange,
  onSubCategoryChange,
  onProductTypeChange,
  categoryRequired = false,
  subCategoryRequired = false,
  productTypeRequired = false,
}) {
  const { categories } = useCategories();

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // ====== Index ======
  const index = useMemo(() => buildIndex(categories), [categories]);

  // ====== Manual picker lists ======
  const mainCategories = useMemo(
    () =>
      (categories || [])
        .filter((c) => c.parent === 0)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  // Category and subcategory ids come from the names (the props only carry names)
  const selectedCategory = useMemo(
    () =>
      mainCategories.find(
        (c) => c.name === categoryValue || c.id === categoryValue
      ) || null,
    [mainCategories, categoryValue]
  );

  const subCategories = useMemo(
    () =>
      selectedCategory
        ? (categories || [])
            .filter((c) => c.parent === selectedCategory.id)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        : [],
    [categories, selectedCategory]
  );

  const selectedSub = useMemo(
    () =>
      subCategories.find(
        (c) => c.name === subCategoryValue || c.id === subCategoryValue
      ) || null,
    [subCategories, subCategoryValue]
  );

  const productTypes = selectedSub?.productTypes || [];

  // ====== Search results ======
  const results = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q || q.length < 2) return [];

    const words = q.split(" ").filter(Boolean);
    const scored = [];

    for (const it of index) {
      const base = scoreMatch({
        name: it.name,
        path: it.path,
        query: q,
        words,
      });
      if (base === 0) continue;
      // A shallower level has priority → a beginner reaches a result sooner
      scored.push({ it, score: base + (4 - it.level) * 12 });
    }

    scored.sort(
      (a, b) => b.score - a.score || a.it.name.localeCompare(b.it.name)
    );

    const seen = new Set();
    return scored
      .filter(({ it }) => {
        const k = `${it.level}|${it.parentId}|${it.subId}|${it.productType}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 30)
      .map(({ it }) => it);
  }, [index, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // ====== Pick one result ======
  const choose = (it) => {
    if (!it) return;

    const parent = categories.find((c) => c.id === it.parentId);
    const sub = categories.find((c) => c.id === it.subId);

    // Order matters: each handler resets the state of the next level
    onCategoryChange?.(parent?.name || "", it.parentId);

    if (it.level >= 2) onSubCategoryChange?.(sub?.name || "", it.subId);
    else onSubCategoryChange?.("", "");

    if (it.level === 3) onProductTypeChange?.(it.productType);
    else onProductTypeChange?.("");

    setQuery("");
    setEditing(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) =>
        results.length ? (c - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      // Prevent the form from being submitted
      e.preventDefault();
      choose(results[cursor]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  // ====== Manual picker ======
  const handleMainChange = (e) => {
    const id = e.target.value;
    const name = categories.find((c) => c.id === id)?.name || "";
    onCategoryChange?.(name, id);
    onSubCategoryChange?.("", "");
    onProductTypeChange?.("");
  };

  const handleSubChange = (e) => {
    const id = e.target.value;
    const name = categories.find((c) => c.id === id)?.name || "";
    onSubCategoryChange?.(name, id);
    onProductTypeChange?.("");
  };

  const hasProductType = productTypes.length > 0;
  const colClass = hasProductType ? "col-md-4" : "col-md-6";

  const pickedPath = [categoryValue, subCategoryValue, productTypeValue]
    .filter(Boolean)
    .join(" › ");

  const showSearch = !categoryValue || editing;

  return (
    <div className="catpick">
      {/* ================= Selected state ================= */}
      {categoryValue && !editing && (
        <div className="catpick-picked">
          <span className="catpick-picked-ic">
            <i className="fa-solid fa-check" />
          </span>
          <span className="catpick-picked-tx">
            <strong>{productTypeValue || subCategoryValue || categoryValue}</strong>
            <small>{pickedPath}</small>
          </span>
          <button
            type="button"
            className="catpick-change"
            onClick={() => setEditing(true)}
          >
            <i className="fa-solid fa-pen" /> Change
          </button>
        </div>
      )}

      {/* ================= Search ================= */}
      {showSearch && (
        <div className="catpick-search">
          <label className="catpick-label" htmlFor="catpick-q">
            What are you selling?{" "}
            {categoryRequired && <span className="text-danger">*</span>}
          </label>

          <div className="catpick-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              id="catpick-q"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder='Try "honey", "rice", "olive oil", "basmati"…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {query && (
              <button
                type="button"
                className="catpick-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Popular chips — shown while nothing is typed */}
          {!query && (
            <div className="catpick-popular">
              <span>Popular:</span>
              {POPULAR.map((p) => (
                <button
                  key={p.q}
                  type="button"
                  onClick={() => setQuery(p.q)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {query.length === 1 && (
            <p className="catpick-hint">Type at least 2 letters…</p>
          )}

          {/* Results */}
          {query.length >= 2 && (
            <div className="catpick-results">
              {results.length === 0 ? (
                <div className="catpick-nores">
                  Nothing found for <b>“{query}”</b>.
                  <br />
                  Try a simpler word, or browse the tree below.
                </div>
              ) : (
                <>
                  <div className="catpick-results-head">
                    {results.length} result{results.length > 1 ? "s" : ""}
                  </div>
                  <div className="catpick-list">
                    {results.map((it, i) => (
                      <button
                        key={`${it.level}-${it.parentId}-${it.subId}-${it.productType}`}
                        type="button"
                        className={`catpick-r ${i === cursor ? "active" : ""}`}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => choose(it)}
                      >
                        <span className="catpick-r-ic">
                          <i className={`fa-solid fa-${it.icon || "tag"}`} />
                        </span>
                        <span className="catpick-r-tx">
                          <span className="catpick-r-nm">{it.name}</span>
                          <span className="catpick-r-pt">{it.path}</span>
                        </span>
                        <span className={`catpick-lv l${it.level}`}>
                          {LEVEL_LABEL[it.level]}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= Manual picker (optional) ================= */}
      <div className="catpick-manual">
        <button
          type="button"
          className="catpick-toggle"
          onClick={() => setShowManual((v) => !v)}
        >
          <i className={`fa-solid fa-chevron-${showManual ? "down" : "right"}`} />
          {showManual ? "Hide the full category tree" : "Browse the full category tree"}
        </button>

        {showManual && (
          <div className="row g-3 mt-1">
            <div className={colClass}>
              <label className="form-label fw-semibold">
                Category{" "}
                {categoryRequired && <span className="text-danger">*</span>}
              </label>
              <select
                className="form-select"
                value={selectedCategory?.id || ""}
                onChange={handleMainChange}
                required={categoryRequired}
              >
                <option value="">Select category</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={colClass}>
              <label className="form-label fw-semibold">
                Sub-Category{" "}
                {subCategoryRequired && <span className="text-danger">*</span>}
              </label>
              <select
                className="form-select"
                value={selectedSub?.id || ""}
                onChange={handleSubChange}
                disabled={!selectedCategory}
                required={subCategoryRequired}
              >
                <option value="">Select sub-category</option>
                {subCategories.length > 0 ? (
                  subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {selectedCategory
                      ? "No sub-categories available"
                      : "Select a category first"}
                  </option>
                )}
              </select>
            </div>

            {hasProductType && (
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Product Type{" "}
                  {productTypeRequired && (
                    <span className="text-danger">*</span>
                  )}
                </label>
                <select
                  className="form-select"
                  value={productTypeValue}
                  onChange={(e) => onProductTypeChange?.(e.target.value)}
                  required={productTypeRequired}
                >
                  <option value="">Select product type</option>
                  {productTypes.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-12">
              <p className="catpick-hint mb-0">
                Choosing a sub-category is usually enough — the product type is
                optional.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
