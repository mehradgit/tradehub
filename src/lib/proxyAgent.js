// src/lib/proxyAgent.js
// ============================================================
// پروکسی خروجی مشترک (تلگرام + GeoIP)
//
// اگر سرور به api.telegram.org یا ipapi.co دسترسی ندارد
// (مثلاً مسدود باشد)، یک پروکسی تنظیم کنید:
//
//   TELEGRAM_PROXY="http://user:pass@host:port"
//   TELEGRAM_PROXY="socks5://127.0.0.1:1080"
//
// از undici (کتابخانه‌ی داخلی fetch در Node) استفاده می‌کند
// و هیچ وابستگی اضافه‌ای به اپ نمی‌آورد.
// ============================================================

let cachedAgent = null;
let cachedUrl = null;

function redact(url) {
  try {
    const u = new URL(url);
    if (u.username) u.username = "***";
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return url;
  }
}

// dispatcher برای fetch (یا undefined اگر پروکسی نیست)
export async function getOutboundDispatcher() {
  const proxyUrl = (process.env.TELEGRAM_PROXY || "").trim();
  if (!proxyUrl) return undefined;

  if (cachedAgent && cachedUrl === proxyUrl) return cachedAgent;

  const { ProxyAgent } = await import("undici");
  cachedAgent = new ProxyAgent(proxyUrl);
  cachedUrl = proxyUrl;

  console.log("[Proxy] outbound proxy enabled:", redact(proxyUrl));
  return cachedAgent;
}

// آیا پروکسی تنظیم شده؟
export function isProxyEnabled() {
  return Boolean((process.env.TELEGRAM_PROXY || "").trim());
}
