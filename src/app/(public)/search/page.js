// src/app/(public)/search/page.js
// ============================================================
// این صفحه حذف شده است.
//
// با اضافه‌شدن «مگا سرچ» در هدر و انتخابگر حوزه (Products /
// Requests / Companies)، جست‌وجو همیشه به یکی از صفحات فیلتردار
// می‌رود. صفحه‌ی جست‌وجوی ترکیبی دیگر لازم نیست.
//
// برای حفظ لینک‌های قدیمی و بوکمارک‌ها، به‌جای ۴۰۴ به صفحه‌ی
// محصولات با همان عبارت جست‌وجو ریدایرکت می‌شود.
//
// این فایل را می‌توانی دستی حذف کنی (کل پوشه‌ی search).
// ============================================================
import { redirect } from "next/navigation";

export default async function SearchPage({ searchParams }) {
  const params = (await searchParams) || {};
  const q = String(params.q || params.search || "").trim();

  const target = new URLSearchParams();
  if (q) target.set("search", q);
  const query = target.toString();

  redirect(query ? `/products?${query}` : "/products");
}
