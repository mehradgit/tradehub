// src/components/filters/CategoryCascader.js
"use client";

import { useMemo } from "react";

// ============================================================
// Three-level category cascader
//
// Three selects in a row; each one takes its options from the
// level above. The output is a path: "grains-cereals/rice/basmati"
//
// If only level 1 is selected, the path is just "grains-cereals"
// and the prefix filter returns all of its descendants.
// ============================================================
export default function CategoryCascader({
  tree = [],
  value = "",
  onChange,
  selectStyle = {},
}) {
  const parts = String(value || "").split("/").filter(Boolean);
  const [l1Slug, l2Slug, l3Slug] = parts;

  // ===== Options for each level =====
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
      {/* Level 1 */}
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

      {/* Level 2 */}
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

      {/* Level 3 */}
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
