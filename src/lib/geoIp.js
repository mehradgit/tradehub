// src/lib/geoIp.js
// ============================================================
// تشخیص کشور بازدیدکننده
//
// ترتیب تشخیص:
// ۱. هدرهای پلتفرم (Vercel / Cloudflare / Nginx+geoip2) —
//    رایگان و فوری
// ۲. ipwho.is   (HTTPS، ۱۰,۰۰۰ درخواست/ماه رایگان، بدون کلید)
// ۳. ipapi.co   (HTTPS، رایگان محدود)
// ۴. ip-api.com (HTTP، ۴۵ درخواست/دقیقه رایگان)
//
// حفاظت از سهمیه:
// - کش ۲۴ ساعته در حافظه (IP تکراری lookup نمی‌شود)
// - حداکثر ۱۰ lookup در دقیقه (با حمله بات‌ها، بقیه
//   «نامشخص» می‌شوند نه اینکه سهمیه تمام شود)
//
// ⚠️ فقط سمت سرور استفاده می‌شود.
// ============================================================
import { countries } from "@/lib/countries";

// هدرهایی که پلتفرم‌های هاستینگ کد کشور را در آن‌ها می‌گذارند
const PLATFORM_COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-geo-country",
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // ۲۴ ساعت
const LOOKUP_TIMEOUT_MS = 4000;
const MAX_LOOKUPS_PER_MIN = 10;

const ipCache = new Map(); // ip → { code, expiresAt }
const lookupWindow = { start: 0, count: 0 };

// ====== ارائه‌دهندگان GeoIP (به ترتیب اولویت) ======
const GEOIP_PROVIDERS = [
  {
    name: "ipwho.is",
    url: (ip) => `https://ipwho.is/${ip}`,
    extract: (d) => d?.country_code || null,
  },
  {
    name: "ipapi.co",
    url: (ip) => `https://ipapi.co/${ip}/json/`,
    extract: (d) => d?.country_code || null,
  },
  {
    name: "ip-api.com",
    url: (ip) => `http://ip-api.com/json/${ip}?fields=status,countryCode`,
    extract: (d) => (d?.status === "success" ? d.countryCode || null : null),
  },
];

function normalizeCode(code) {
  const clean = String(code || "").trim().toUpperCase();
  return clean.length === 2 ? clean : null;
}

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

function allowLookup() {
  const now = Date.now();
  if (now - lookupWindow.start > 60_000) {
    lookupWindow.start = now;
    lookupWindow.count = 0;
  }
  if (lookupWindow.count >= MAX_LOOKUPS_PER_MIN) return false;
  lookupWindow.count += 1;
  return true;
}

async function fetchCountry(provider, ip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const res = await fetch(provider.url(ip), {
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(
        `[GeoIP] ${provider.name}: HTTP ${res.status} for ${ip}`
      );
      return null;
    }

    const data = await res.json();
    return normalizeCode(provider.extract(data));
  } catch (err) {
    console.error(
      `[GeoIP] ${provider.name} error for ${ip}: ${err.message}`
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupByIp(ip) {
  if (!ip || isPrivateIp(ip)) return null;

  // کش ۲۴ ساعته
  const cached = ipCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.code;

  // حفاظت از سهمیه‌ی ماهانه ارائه‌دهندگان
  if (!allowLookup()) {
    console.warn("[GeoIP] سقف lookup در دقیقه رسید — نادیده گرفته شد");
    return null;
  }

  // با اولین ارائه‌دهنده‌ای که جواب داد کار تمام است
  for (const provider of GEOIP_PROVIDERS) {
    const code = await fetchCountry(provider, ip);
    if (code) {
      ipCache.set(ip, { code, expiresAt: Date.now() + CACHE_TTL_MS });
      return code;
    }
  }

  return null;
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
