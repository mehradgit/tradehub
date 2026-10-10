"use client";

import {
  PRODUCT_PLACEHOLDER,
  AVATAR_PLACEHOLDER,
  COVER_PLACEHOLDER,
  handleImageError,
  isRealImageUrl,
} from "@/lib/imageHelpers";

// ============================================================
// <SafeImage />
//
// یک <img> که:
//   • در Server Component قابل استفاده است
//   • اگر src خالی بود → placeholder
//   • اگر 404 داد → placeholder
//
// نوع placeholder با prop "fallbackType" انتخاب می‌شود:
//   <SafeImage src={...} fallbackType="avatar" />
// ============================================================
export default function SafeImage({
  src,
  alt = "",
  fallbackType = "product",   // "product" | "avatar" | "cover"
  fallbackSrc,
  ...rest
}) {
  const fallback =
    fallbackSrc ||
    (fallbackType === "avatar"
      ? AVATAR_PLACEHOLDER
      : fallbackType === "cover"
      ? COVER_PLACEHOLDER
      : PRODUCT_PLACEHOLDER);

  // اگر src خالی باشد یا لینک یک سرویس placeholder باشد → fallback
  const initialSrc = isRealImageUrl(src) ? src : fallback;

  return (
    <img
      src={initialSrc}
      alt={alt}
      onError={(e) => handleImageError(e, fallback)}
      {...rest}
    />
  );
}