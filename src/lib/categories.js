// src/lib/categories.js
import categoriesData from "./categories.json";

// ============================================================
// ساختار flat برای سازگاری با کدهای فعلی
// ============================================================
function flattenCategories() {
  const flat = [];

  (categoriesData.categories || []).forEach((cat) => {
    // غ±. دسته اصلی
    flat.push({
      id: cat.id,
      name: cat.name_en,
      nameFa: cat.name_fa || null,
      slug: cat.slug || cat.id,
      icon: cat.icon || null,
      description: cat.description || null,
      sortOrder: cat.sortOrder ?? 0,
      parent: 0,                      // عدد صفر برای دسته اصلی
      productTypes: [],
      isActive: true,
    });

    // غ². زیردسته‌ها
    (cat.subcategories || []).forEach((sub) => {
      flat.push({
        id: sub.id,
        name: sub.name_en,
        nameFa: sub.name_fa || null,
        slug: sub.slug || sub.id,
        icon: sub.icon || null,
        description: sub.description || null,
        sortOrder: sub.sortOrder ?? 0,
        parent: cat.id,               // رشته: id دسته اصلی
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
// توابع کمکی
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