// src/lib/imageHelpers.js
// ============================================================
// مدیریت عکس محصول — مرکزی
//
// دو مشکل را با هم حل می‌کند:
//   ۱. محصول اصلاً عکس ندارد (آرایه خالی یا مقدار نامعتبر)
//   ۲. محصول عکس دارد ولی فایل روی دیسک نیست → 404 در runtime
//
// همه‌ی جاهایی که عکس محصول نمایش می‌دهند باید از این helper استفاده کنند
// تا در آینده فقط یک نقطه برای تغییر باشد.
// ============================================================

export const PRODUCT_PLACEHOLDER = "/images/placeholder-product.png";
export const AVATAR_PLACEHOLDER = "/images/placeholder-avatar.png";

/**
 * اولین عکس معتبر محصول را برمی‌گرداند، وگرنه placeholder
 */
export function getProductImage(product) {
  if (!product) return PRODUCT_PLACEHOLDER;

  const imgs = Array.isArray(product.images) ? product.images : [];
  const first = imgs.find(
    (i) => typeof i === "string" && i.trim().length > 0
  );

  return first || PRODUCT_PLACEHOLDER;
}

/**
 * آرایه‌ی عکس‌های محصول — اگر خالی بود، یک placeholder در آرایه
 */
export function getProductImages(product, fallback = PRODUCT_PLACEHOLDER) {
  if (!product) return [fallback];

  const imgs = (Array.isArray(product.images) ? product.images : []).filter(
    (i) => typeof i === "string" && i.trim().length > 0
  );

  return imgs.length > 0 ? imgs : [fallback];
}

/**
 * برای onError در <img>
 * اگر عکس اصلی 404 داد، placeholder جایگزین می‌شود
 */
export function handleImageError(e, fallback = PRODUCT_PLACEHOLDER) {
  const el = e?.currentTarget;
  if (!el) return;
  // جلوگیری از حلقه‌ی بی‌نهایت اگر خود placeholder هم نبود
  if (el.dataset.fallbackApplied === "1") return;
  el.dataset.fallbackApplied = "1";
  el.src = fallback;
}