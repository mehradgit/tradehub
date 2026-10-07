"use client";

import { getProductImage, handleImageError } from "@/lib/imageHelpers";

// ============================================================
// <SafeImage />
// یک <img> که:
//   â€¢ در Server Component قابل استفاده است (خودش Client است)
//   â€¢ اگر src خالی باشد placeholder می‌گذارد
//   â€¢ اگر src خطا داد (404)، onError placeholder جایگزین می‌کند
// ============================================================
export default function SafeImage({
  src,
  fallback = null,
  alt = "",
  ...rest
}) {
  // اگر src خالی بود، از ابتدا fallback
  const initialSrc = src && String(src).trim() ? src : fallback || undefined;

  return (
    <img
      src={initialSrc}
      alt={alt}
      onError={(e) => handleImageError(e, fallback || undefined)}
      {...rest}
    />
  );
}