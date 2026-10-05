// src/lib/categoryTree.js
// ============================================================
// Three-level category tree
//
// The current structure (categories.json / Setting["categories"]) has two
// levels plus a "productTypes" list on each subcategory. That list is in fact
// the third level, so a three-level tree is built from it:
//
//   Level 1: grains-cereals        (Grains & Cereals)
//   Level 2: rice                  (Rice)
//   Level 3: basmati               (Basmati)
//
// The path is a unique key: "grains-cereals/rice/basmati"
// and it is stored on Product/BuyingRequest in the categoryPath column
// so that prefix filtering can run on the index.
//
// This file is PURE (no prisma) so it can be used on both the server
// and the client.
// ============================================================
import { categories as staticCategories } from "@/lib/categories";

export const MAX_CATEGORY_LEVEL = 3;

// ============================================================
// slugify — build a machine name from a display name
// ============================================================
export function slugify(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function bySortOrder(a, b) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

// ============================================================
// Build a three-level tree from a flat list
// ============================================================
export function buildCategoryTree(flat = staticCategories) {
  const list = Array.isArray(flat) ? flat : [];

  const mains = list
    .filter((c) => c && (c.parent === 0 || c.parent === null))
    .sort(bySortOrder);

  return mains.map((l1) => {
    const l1Slug = l1.slug || l1.id;
    const subs = list
      .filter((c) => c && c.parent === l1.id)
      .sort(bySortOrder);

    return {
      id: l1.id,
      slug: l1Slug,
      name: l1.name,
      icon: l1.icon || null,
      description: l1.description || null,
      sortOrder: l1.sortOrder ?? 0,
      isActive: l1.isActive !== false,
      level: 1,
      parentId: null,
      path: l1Slug,
      children: subs.map((l2) => {
        const l2Slug = l2.slug || l2.id;
        const types = Array.isArray(l2.productTypes) ? l2.productTypes : [];

        return {
          id: l2.id,
          slug: l2Slug,
          name: l2.name,
          icon: l2.icon || null,
          description: l2.description || null,
          sortOrder: l2.sortOrder ?? 0,
          isActive: l2.isActive !== false,
          level: 2,
          parentId: l1.id,
          path: `${l1Slug}/${l2Slug}`,
          children: types
            .filter(Boolean)
            .map((typeName, idx) => {
              const tSlug = slugify(typeName) || `type-${idx}`;
              return {
                id: `${l2.id}--${tSlug}`,
                slug: tSlug,
                name: String(typeName),
                icon: null,
                description: null,
                sortOrder: idx * 10,
                isActive: true,
                level: 3,
                parentId: l2.id,
                path: `${l1Slug}/${l2Slug}/${tSlug}`,
                children: [],
              };
            }),
        };
      }),
    };
  });
}

// ============================================================
// Flatten the tree (with path and level)
// ============================================================
export function flattenTree(tree) {
  const out = [];

  const walk = (nodes) => {
    for (const node of nodes || []) {
      out.push({
        id: node.id,
        slug: node.slug,
        name: node.name,
        icon: node.icon,
        description: node.description,
        sortOrder: node.sortOrder,
        isActive: node.isActive,
        level: node.level,
        parentId: node.parentId,
        path: node.path,
      });
      if (node.children?.length) walk(node.children);
    }
  };

  walk(tree);
  return out;
}

// ============================================================
// Indexes for fast lookup
// ============================================================
export function buildCategoryIndex(tree) {
  const byPath = new Map();
  const byId = new Map();
  const byNameKey = new Map(); // "level1 name|level2 name|level3 name" → path

  const walk = (nodes) => {
    for (const node of nodes || []) {
      byPath.set(node.path, node);
      byId.set(node.id, node);

      const levels = node.path.split("/");
      const key = levels.join("|").toLowerCase();
      if (!byNameKey.has(key)) byNameKey.set(key, node.path);

      if (node.children?.length) walk(node.children);
    }
  };

  walk(tree);

  return { byPath, byId, byNameKey, flat: flattenTree(tree) };
}

// ============================================================
// Convert a path into display names
// ============================================================
export function describePath(path, index) {
  if (!path) return "";
  const node = index?.byPath?.get(path);
  if (node) {
    const parts = path
      .split("/")
      .map((p) => index.byPath.get(p)?.name || index.byPath.get(p)?.slug || p);
    return parts.join(" › ");
  }
  // If we have no index, build the names from the slugs
  return path
    .split("/")
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" › ");
}

// ============================================================
// Resolve (category, subCategory, productType) → path
//
// Match by name first, then by slug, and finally case-insensitively.
// ============================================================
export function resolveCategoryPath(
  { category, subCategory, productType },
  tree = buildCategoryTree()
) {
  if (!category) return null;

  const norm = (v) => String(v || "").trim().toLowerCase();
  const catTarget = norm(category);

  const main = tree.find(
    (l1) => norm(l1.name) === catTarget || norm(l1.slug) === catTarget
  );
  if (!main) return null;
  if (!subCategory) return main.path;

  const subTarget = norm(subCategory);
  const sub = (main.children || []).find(
    (l2) => norm(l2.name) === subTarget || norm(l2.slug) === subTarget
  );
  if (!sub) return main.path;
  if (!productType) return sub.path;

  const typeTarget = norm(productType);
  const type = (sub.children || []).find(
    (l3) => norm(l3.name) === typeTarget || norm(l3.slug) === typeTarget
  );

  return type ? type.path : sub.path;
}

// ============================================================
// Ancestor paths (for prefix filtering)
//   "a/b/c" → ["a", "a/b", "a/b/c"]
// ============================================================
export function getAncestorPaths(path) {
  if (!path) return [];
  const parts = String(path).split("/").filter(Boolean);
  const out = [];
  let current = "";
  for (const p of parts) {
    current = current ? `${current}/${p}` : p;
    out.push(current);
    if (out.length >= MAX_CATEGORY_LEVEL) break;
  }
  return out;
}

// ============================================================
// Is this path a descendant of the given parent path?
// ============================================================
export function isPathUnder(childPath, parentPath) {
  if (!childPath || !parentPath) return false;
  return childPath === parentPath || childPath.startsWith(`${parentPath}/`);
}

// ============================================================
// Next-level options for a path (for the cascader)
// ============================================================
export function getChildrenByPath(path, index) {
  if (!path) return index.flat.filter((n) => n.level === 1);
  const node = index.byPath.get(path);
  return node ? node.children || [] : [];
}

// ============================================================
// Build an index from a flat list (helper for server and client)
// ============================================================
export function makeCategoryIndex(flat) {
  return buildCategoryIndex(buildCategoryTree(flat));
}

export { staticCategories };
