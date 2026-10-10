// src/lib/imageHelpers.js
// ============================================================
// مدیریت عکس‌ها — مرکزی
//
//   ۱. اگر مقدار خالی بود → placeholder مناسب
//   ۲. اگر URL داده شد ولی 404 شد → onError placeholder می‌گذارد
//
// سه نوع placeholder:
//   • محصول     → /images/placeholder-product.png
//   • آواتار    → /images/company-avatar.webp
//   • کاور      → /images/company-cover.webp
// ============================================================

export const PRODUCT_PLACEHOLDER = "/images/placeholder-product.png";
export const AVATAR_PLACEHOLDER = "/images/company-avatar.webp";
export const COVER_PLACEHOLDER = "/images/company-cover.webp";

// ============================================================
// مقادیر امن برای src
// ============================================================
export function getProductImage(product) {
  if (!product) return PRODUCT_PLACEHOLDER;
  const imgs = Array.isArray(product.images) ? product.images : [];
  const first = imgs.find((i) => typeof i === "string" && i.trim().length > 0);
  return first || PRODUCT_PLACEHOLDER;
}

export function getProductImages(product, fallback = PRODUCT_PLACEHOLDER) {
  if (!product) return [fallback];
  const imgs = (Array.isArray(product.images) ? product.images : []).filter(
    (i) => typeof i === "string" && i.trim().length > 0
  );
  return imgs.length > 0 ? imgs : [fallback];
}

// ============================================================
// for <img onError>
// ============================================================
export function handleImageError(e, fallback = PRODUCT_PLACEHOLDER) {
  const el = e?.currentTarget;
  if (!el) return;
  if (el.dataset.fallbackApplied === "1") return;
  el.dataset.fallbackApplied = "1";
  el.src = fallback;
}