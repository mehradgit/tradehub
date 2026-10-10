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
// سرویس‌های تولید عکس placeholder — عکس واقعی نیستند
// (اگر کاربر لینک این سرویس‌ها را وارد کند، به عنوان
//  «بدون عکس» رفتار می‌کنیم و placeholder محلی را نشان می‌دهیم)
// ============================================================
const PLACEHOLDER_HOSTS = [
  "placehold.co",
  "via.placeholder.com",
  "placeholder.com",
  "dummyimage.com",
  "fakeimg.pl",
];

export function isPlaceholderUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const host = new URL(url, "https://example.com").hostname.replace(
      /^www\./,
      ""
    );
    return PLACEHOLDER_HOSTS.some(
      (h) => host === h || host.endsWith("." + h)
    );
  } catch {
    return false;
  }
}

// آیا رشته‌ی داده‌شده عکس قابل استفاده است؟
export function isRealImageUrl(url) {
  return (
    typeof url === "string" &&
    url.trim().length > 0 &&
    !isPlaceholderUrl(url)
  );
}

// ============================================================
// مقادیر امن برای src
// ============================================================
export function getProductImage(product) {
  if (!product) return PRODUCT_PLACEHOLDER;
  const imgs = Array.isArray(product.images) ? product.images : [];
  const first = imgs.find((i) => isRealImageUrl(i));
  return first || PRODUCT_PLACEHOLDER;
}

export function getProductImages(product, fallback = PRODUCT_PLACEHOLDER) {
  if (!product) return [fallback];
  const imgs = (Array.isArray(product.images) ? product.images : []).filter(
    (i) => isRealImageUrl(i)
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