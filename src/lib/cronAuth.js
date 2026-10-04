// src/lib/cronAuth.js
import { timingSafeEqual } from "crypto";

// ============================================================
// بررسی مجوز فراخوانی endpoint های cron
//
// قواعد امنیتی (fail-closed):
//   ۱. اگر CRON_SECRET ست نشده باشد، هیچ درخواستی مجاز نیست.
//      (قبلاً بررسی کلاً رد می‌شد و endpoint عمومی می‌شد.)
//   ۲. راز فقط از هدر خوانده می‌شود، نه query string؛
//      چون ?secret= در access logهای Nginx/Cloudflare ثبت می‌شود.
//   ۳. مقایسه به‌صورت timing-safe انجام می‌شود.
//
// هدرهای پذیرفته‌شده:
//   x-cron-secret: <secret>
//   Authorization: Bearer <secret>     ← برای Vercel Cron و سرویس‌های ابری
// ============================================================
export function isAuthorizedCron(request) {
  const secret = process.env.CRON_SECRET;

  // ✅ fail-closed
  if (!secret) return false;

  const headers = request.headers;
  const provided =
    headers.get("x-cron-secret") ||
    (headers.get("authorization") || "").replace(/^Bearer\s+/i, "");

  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);

  // timingSafeEqual روی طول‌های نابرابر خطا می‌دهد
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
