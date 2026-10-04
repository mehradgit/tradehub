// src/components/filters/CategoryCascader.js
"use client";

import { useMemo } from "react";

// ============================================================
// انتخابگر دسته‌بندی سه‌سطحی
//
// سه select پشت‌سرهم؛ هر کدام گزینه‌هایش را از سطح بالاتر
// می‌گیرد. خروجی یک path است: "grains-cereals/rice/basmati"
//
// اگر فقط سطح ۱ انتخاب شود، path همان "grains-cereals" است و
// فیلتر پیشوندی همه‌ی زیرشاخه‌ها را برمی‌گرداند.
// ============================================================
export default function CategoryCascader({
  tree = [],
  value = "",
  onChange,
  selectStyle = {},
}) {
  const parts = String(value || "").split("/").filter(Boolean);
  const [l1Slug, l2Slug, l3Slug] = parts;

  // ===== گزینه‌های هر سطح =====
  const level1 = useMemo(() => tree || [], [tree]);

  const level2 = useMemo(() => {
    if (!l1Slug) return [];
    const node = (tree || []).find((n) => n.slug === l1Slug);
    return node?.children || [];
  }, [tree, l1Slug]);

  const level3 = useMemo(() => {
    if (!l1Slug || !l2Slug) return [];
    const node = (tree || [])
      .find((n) => n.slug === l1Slug)
      ?.children?.find((n) => n.slug === l2Slug);
    return node?.children || [];
  }, [tree, l1Slug, l2Slug]);

  const baseStyle = {
    width: "100%",
    padding: "8px 11px",
    border: "1px solid var(--line)",
    borderRadius: "8px",
    fontSize: "11px",
    fontFamily: "inherit",
    color: "var(--text)",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
    ...selectStyle,
  };

  const emit = (next) => {
    const path = next.filter(Boolean).join("/");
    onChange?.(path);
  };

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {/* سطح ۱ */}
      <select
        style={baseStyle}
        value={l1Slug || ""}
        onChange={(e) => emit([e.target.value])}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {level1.map((n) => (
          <option key={n.id} value={n.slug}>
            {n.name}
          </option>
        ))}
      </select>

      {/* سطح ۲ */}
      {l1Slug && level2.length > 0 && (
        <select
          style={baseStyle}
          value={l2Slug || ""}
          onChange={(e) => emit([l1Slug, e.target.value])}
          aria-label="Subcategory"
        >
          <option value="">All subcategories</option>
          {level2.map((n) => (
            <option key={n.id} value={n.slug}>
              {n.name}
            </option>
          ))}
        </select>
      )}

      {/* سطح ۳ */}
      {l1Slug && l2Slug && level3.length > 0 && (
        <select
          style={baseStyle}
          value={l3Slug || ""}
          onChange={(e) => emit([l1Slug, l2Slug, e.target.value])}
          aria-label="Product type"
        >
          <option value="">All product types</option>
          {level3.map((n) => (
            <option key={n.id} value={n.slug}>
              {n.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
