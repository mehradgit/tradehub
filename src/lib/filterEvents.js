// src/lib/filterEvents.js
"use client";

// ============================================================
// گذرگاه رویداد کوچک بین هدر و نوار فیلتر صفحات
//
// چرا: مدال فیلترها به داده‌ی سمت سرور نیاز دارد (گزینه‌ها، درخت
// دسته، تعاریف اتریبیوت، facet). آن داده فقط در خودِ صفحه موجود
// است، نه در هدر. پس هدر داده را نمی‌سازد؛ فقط رویداد می‌فرستد و
// صفحه مدال را باز می‌کند. این کار از ساختن یک API جدید برای facet
// و از تکرار منطق جلوگیری می‌کند.
// ============================================================
import { useEffect } from "react";

export const FILTER_EVENTS = {
  // دکمه‌ی Filters هدر → مدال همان صفحه باز شود
  OPEN_FILTERS: "foodhub:open-filters",
  // فیلد مصنوعی داخل صفحه → نوار مگا سرچ هدر باز شود
  OPEN_MEGA: "foodhub:open-mega-search",
};

export function emitFilterEvent(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function useFilterEvent(name, handler) {
  useEffect(() => {
    if (!name || typeof handler !== "function") return;
    const listener = (e) => handler(e.detail);
    window.addEventListener(name, listener);
    return () => window.removeEventListener(name, listener);
  }, [name, handler]);
}
