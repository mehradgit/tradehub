// src/lib/geoIp.js
// ============================================================
// تشخیص کشور بازدیدکننده
//
// ۱. اول هدرهای پلتفرم را می‌خواند (Vercel / Cloudflare /
//    Nginx با config مناسب) — بدون درخواست خارجی
// ۲. اگر نبود: IP کلاینت (از x-forwarded-for) را با
//    ipapi.co چک می‌کند و نتیجه ۶ ساعت در حافظه کش می‌شود
//
// ⚠️ این فایل فقط سمت سرور استفاده می‌شود.
// ============================================================
import { countries } from "@/lib/countries";

// هدرهایی که پلتفرم‌های هاستینگ کد کشور را در آن‌ها می‌گذارند
const PLATFORM_COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-geo-country",
];

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // ۶ ساعت
const LOOKUP_TIMEOUT_MS = 4000;
const ipCache = new Map(); // ip → { code, expiresAt }

function normalizeCode(code) {
  const clean = String(code || "").trim().toUpperCase();
  return clean.length === 2 ? clean : null;
}

// IP‌های داخلی/لوکال قابل جغرافیایی‌سازی نیستند
function isPrivateIp(ip) {
  return /^(127\.|10\.|192\.168\.|::1$|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

function extractClientIp(request) {
  const headers = request?.headers;
  if (!headers) return null;

  // x-forwarded-for: client, proxy1, proxy2 — اولی = کلاینت
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim() || null;
  }

  return headers.get("x-real-ip") || null;
}

async function lookupByIp(ip) {
  if (!ip || isPrivateIp(ip)) return null;

  const cached = ipCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.code;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const code = normalizeCode(data?.country_code);

    if (code) {
      ipCache.set(ip, { code, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return code;
  } catch (err) {
    // timeout / rate-limit / بدون اینترنت — هرگز بازدید را خراب نکن
    console.error("[GeoIP] خطا در شناسایی کشور:", err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// کد کشور بازدیدکننده (مثل "IR") یا null
// ============================================================
export async function getViewerCountry(request) {
  const headers = request?.headers;

  if (headers) {
    for (const name of PLATFORM_COUNTRY_HEADERS) {
      const code = normalizeCode(headers.get(name));
      if (code) return code;
    }
  }

  return lookupByIp(extractClientIp(request));
}

// ============================================================
// نام کشور از کد (از لیست countries.js)
// ============================================================
export function countryLabel(code) {
  const found = countries.find((c) => c.code === code);
  return found ? found.name : null;
}
