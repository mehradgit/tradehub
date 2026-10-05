// src/lib/categories.js
import categoriesData from "./categories.json";

// ============================================================
// Flat structure for compatibility with the current code
// ============================================================
function flattenCategories() {
  const flat = [];

  (categoriesData.categories || []).forEach((cat) => {
    // 1. Main category
    flat.push({
      id: cat.id,
      name: cat.name_en,
      slug: cat.slug || cat.id,
      icon: cat.icon || null,
      description: cat.description || null,
      sortOrder: cat.sortOrder ?? 0,
      parent: 0,                      // zero means a main category
      productTypes: [],
      isActive: true,
    });

    // 2. Subcategories
    (cat.subcategories || []).forEach((sub) => {
      flat.push({
        id: sub.id,
        name: sub.name_en,
        slug: sub.slug || sub.id,
        icon: sub.icon || null,
        description: sub.description || null,
        sortOrder: sub.sortOrder ?? 0,
        parent: cat.id,               // string: id of the main category
        productTypes: Array.isArray(sub.productTypes) ? sub.productTypes : [],
        isActive: true,
      });
    });
  });

  return flat;
}

export const categories = flattenCategories();
export const rawCategories = categoriesData.categories || [];

// ============================================================
// Helper functions
// ============================================================
export function getCategoryById(id) {
  return categories.find((c) => c.id === id)?.name || "";
}

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug);
}

export function getMainCategories() {
  return categories
    .filter((c) => c.parent === 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getSubcategories(parentId) {
  return categories
    .filter((c) => c.parent === parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getProductTypes(categoryId) {
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.productTypes || [];
}