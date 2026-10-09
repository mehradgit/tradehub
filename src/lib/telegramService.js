// src/lib/telegramService.js
// ============================================================
// ارسال پیام تلگرامی برای اطلاع‌رسانی ادمین
//
// تنظیمات در .env:
//   TELEGRAM_BOT_TOKEN       ← توکن ربات (از @BotFather)
//   TELEGRAM_CHAT_ID         ← آیدی چت مقصد (برای چند چت با کاما جدا کنید)
//   TELEGRAM_ALERTS_ENABLED  ← true (پیش‌فرض) | false
//   TELEGRAM_MAX_PER_MINUTE  ← ۳۰ (سقف پیام در هر دقیقه)
//
// همه‌ی توابع این فایل امن هستند: هرگز خطا برنمی‌گردانند
// و می‌توانند fire-and-forget صدا زده شوند.
// ============================================================

const TELEGRAM_API = "https://api.telegram.org";
const DEFAULT_MAX_PER_MINUTE = 30;
const REQUEST_TIMEOUT_MS = 10_000;

// شمارنده‌ی نرخ — حداکثر N پیام در هر دقیقه (مثلث ساده)
const rateWindow = { start: 0, count: 0 };

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

function isEnabled() {
  if (process.env.TELEGRAM_ALERTS_ENABLED === "false") return false;
  return isTelegramConfigured();
}

function getChatIds() {
  return (process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function allowSend() {
  const configured = parseInt(process.env.TELEGRAM_MAX_PER_MINUTE, 10);
  const limit = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_PER_MINUTE;

  const now = Date.now();
  if (now - rateWindow.start > 60_000) {
    rateWindow.start = now;
    rateWindow.count = 0;
  }
  if (rateWindow.count >= limit) return false;
  rateWindow.count += 1;
  return true;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendToChat(chatId, text) {
  const url = `${TELEGRAM_API}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // از fetch خودِ undici استفاده می‌کنیم تا dispatcher (پروکسی)
    // قطعی اعمال شود و با cache ساختگی Next.js تداخلی نداشته باشد
    const { fetch: undiciFetch } = await import("undici");
    const { getOutboundDispatcher } = await import("@/lib/proxyAgent");
    const dispatcher = await getOutboundDispatcher();

    const res = await undiciFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
      ...(dispatcher ? { dispatcher } : {}),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Telegram API ${res.status}: ${detail.slice(0, 160)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// ارسال متن خام به همه‌ی چت‌های تنظیم‌شده
// برمی‌گرداند: { sent, skipped? } — هرگز throw نمی‌کند
// ============================================================
export async function sendTelegramMessage(text) {
  if (!isEnabled()) return { sent: 0, skipped: "not_configured" };
  if (!allowSend()) {
    console.warn("[Telegram] سقف پیام در دقیقه رسید — پیام حذف شد");
    return { sent: 0, skipped: "rate_limited" };
  }

  const chatIds = getChatIds();
  let sent = 0;
  const errors = [];

  await Promise.allSettled(
    chatIds.map(async (chatId) => {
      try {
        await sendToChat(chatId, text);
        sent += 1;
      } catch (err) {
        console.error("[Telegram] خطا در ارسال:", err.message);
        errors.push(err.message);
      }
    })
  );

  return { sent, errors };
}

// ============================================================
// یک اطلاع‌رسانی قالب‌بندی‌شده بساز و بدون انتظار پاسخ ارسال کن
//
// title: عنوان پیام (پررنگ)
// lines: آرایه‌ای از رشته‌ها یا جفت‌های [برچسب، مقدار]
// options:
//   icon  → ایموجی ابتدای عنوان (پیش‌فرض 🔔)
//   link  → { url, label } → لینک «مشاهده» در انتهای پیام
// ============================================================
export function sendTelegramAlert(title, lines = [], options = {}) {
  const header = `${options.icon ?? "🔔"} <b>${escapeHtml(title)}</b>`;

  const body = lines
    .map((line) =>
      Array.isArray(line)
        ? `${escapeHtml(line[0])}: <b>${escapeHtml(line[1] ?? "—")}</b>`
        : escapeHtml(line)
    )
    .join("\n");

  const parts = [header, body];

  if (options.link?.url) {
    parts.push(
      `<a href="${escapeHtml(options.link.url)}">${escapeHtml(
        options.link.label || "مشاهده"
      )}</a>`
    );
  }

  const text = parts.filter(Boolean).join("\n");

  // fire-and-forget — هیچ‌وقت باعث خطای ناهمگام نمی‌شود
  sendTelegramMessage(text).catch((err) => {
    console.error("[Telegram] خطا در اطلاع‌رسانی:", err);
  });
}
