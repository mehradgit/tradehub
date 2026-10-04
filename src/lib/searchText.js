// src/lib/searchText.js
// ============================================================
// متن یکجای جست‌وجو (searchText)
//
// هدف: تمام متن‌های قابل‌جست‌وجوی یک محصول/درخواست خرید را در
// یک ستون واحد (@db.Text) جمع کنیم تا بعداً با FULLTEXT ایندکس
// شود و جست‌وجوی رتبه‌بندی‌شده (MATCH ... AGAINST) ممکن باشد.
//
// این فایل PURE است (بدون prisma) تا هم در API و هم در جاهای
// دیگر قابل استفاده باشد و تست‌پذیر بماند.
//
// قاعده‌ی کلی: هیچ ورودی null/undefined/خالی نباید throw کند؛
// خروجی در بدترین حالت "" است.
// ============================================================

// حداکثر طول متن جست‌وجو.
// ستون @db.Text ظرفیت بیشتری دارد، ولی ۴۰۰۰ کاراکتر برای FULLTEXT
// سبک‌تر و معقول‌تر است (max_ft_word_len هم به همین ترتیب کوچک می‌ماند).
export const MAX_SEARCH_TEXT_LENGTH = 4000;

// ============================================================
// انتیتی‌های رایج HTML
// ============================================================
const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

// ============================================================
// normalizeForSearch
//
//  ۱) تگ‌های HTML حذف می‌شوند  (<p> ... </p>)
//  ۲) انتیتی‌های رایج decode می‌شوند (&amp; → &)
//  ۳) به حروف کوچک تبدیل می‌شود
//  ۴) همه‌ی فاصله‌ها (فاصله، تب، newline، NBSP) به یک فاصله
//     (شامل نیم‌فاصله‌ی فارسی \u200c که در جست‌وجو مزاحم است)
//  ۵) trim
// ============================================================
export function normalizeForSearch(text) {
  if (text === null || text === undefined) return "";

  let out;
  try {
    out = String(text);
  } catch {
    // اگر به هر دلیلی String() شکست خورد (مثلاً Symbol)
    return "";
  }

  // حذف تگ‌ها — اول script/style کامل، بعد بقیه‌ی تگ‌ها
  out = out
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  // decode انتیتی‌های رایج
  // نکته: &nbsp; باید قبل از بقیه به فاصله تبدیل شود تا مرحله‌ی
  // جمع‌کردن فاصله‌ها آن را هم پاک کند.
  out = out.replace(
    /&(?:amp|lt|gt|quot|#39|apos|nbsp);/gi,
    (match) => HTML_ENTITIES[match.toLowerCase()] ?? " "
  );

  // حروف کوچک
  out = out.toLowerCase();

  // هر نوع فضای خالی (شامل \u00a0 و \u200c) → یک فاصله
  out = out.replace(/[\s\u00a0\u200b\u200c\u200d\ufeff]+/g, " ");

  return out.trim();
}

// ============================================================
// toPlainText
//
// ورودی می‌تواند رشته، عدد، boolean یا آبجکت باشد.
// از آبجکت‌های { label, value } هم label و هم value استخراج
// می‌شود تا هم اتریبیوت‌های کلید‌دار و هم مقادیر آزاد پوشش
// داده شوند.
// ============================================================
function toPlainText(input) {
  if (input === null || input === undefined) return "";

  const type = typeof input;

  if (type === "string") return input;
  if (type === "number") return Number.isFinite(input) ? String(input) : "";
  if (type === "boolean") return input ? "yes" : "";
  if (type === "bigint") return String(input);
  if (type === "symbol" || type === "function") return "";

  if (Array.isArray(input)) {
    return input.map((item) => toPlainText(item)).filter(Boolean).join(" ");
  }

  if (type === "object") {
    // Date یا آبجکت‌های خاص → رشته‌ی ساده
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? "" : input.toISOString();
    }
    if (typeof input.toJSON === "function") {
      try {
        return toPlainText(input.toJSON());
      } catch {
        /* ادامه با مسیر عمومی */
      }
    }

    const parts = [];
    if (input.label !== undefined) parts.push(toPlainText(input.label));
    if (input.value !== undefined) parts.push(toPlainText(input.value));
    if (input.name !== undefined) parts.push(toPlainText(input.name));
    if (parts.length > 0) return parts.filter(Boolean).join(" ");

    // تلاش آخر: مقادیر آبجکت
    try {
      return Object.values(input)
        .map((v) => toPlainText(v))
        .filter(Boolean)
        .join(" ");
    } catch {
      return "";
    }
  }

  return "";
}

// ============================================================
// truncateOnWordBoundary
//
// بریدن متن روی مرز کلمه تا کلمه‌ی نصفه در ایندکس نیفتد.
// اگر مرز کلمه خیلی عقب بود (کلمه‌ی بسیار بلند)، بریدن خام.
// ============================================================
export function truncateOnWordBoundary(text, maxLength = MAX_SEARCH_TEXT_LENGTH) {
  const str = typeof text === "string" ? text : text ? String(text) : "";
  const limit = Number.isFinite(maxLength) ? Math.max(0, Math.trunc(maxLength)) : 0;

  if (limit === 0) return "";
  if (str.length <= limit) return str;

  const sliced = str.slice(0, limit);

  // آخرین فاصله را پیدا کن (حداقل ۷۰٪ طول مجاز باشد تا برش بی‌معنی نشود)
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > Math.floor(limit * 0.7)) {
    return sliced.slice(0, lastSpace).trim();
  }

  return sliced.trim();
}

// ============================================================
// flattenAttributeValues
//
// ورودی: خروجی getProductAttributes() — آرایه‌ای از
//   { attributeId, key, label, dataType, unit, value }
//
// خروجی: آرایه‌ای از رشته‌ها برای چسباندن به searchText.
//
// قواعد:
//   multiSelect → آرایه با فاصله به هم می‌چسبد
//   boolean     → فقط اگر true بود "yes" تولید می‌شود (false = هیچ)
//   number      → String(value)
//   select/text → همان رشته
//
// مقدار خالی هرگز به آرایه اضافه نمی‌شود و label فقط وقتی
// اضافه می‌شود که مقدار واقعی وجود داشته باشد (تا متن بی‌مورد
// ساخته نشود).
// ============================================================
export function flattenAttributeValues(attributes) {
  if (!Array.isArray(attributes)) return [];

  const out = [];

  for (const attr of attributes) {
    if (!attr || typeof attr !== "object") {
      // اگر به جای آبجکت، رشته‌ی خام داده شده بود
      const raw = toPlainText(attr);
      if (raw) out.push(raw);
      continue;
    }

    const { dataType, value, label } = attr;

    // آیا مقدار واقعی وجود دارد؟
    const hasValue =
      value !== null &&
      value !== undefined &&
      !(typeof value === "string" && value.trim() === "") &&
      !(Array.isArray(value) && value.length === 0);

    if (!hasValue) continue;

    if (dataType === "boolean") {
      // فقط true معنی دارد؛ false متنی برای جست‌وجو تولید نمی‌کند
      if (value === true || value === "true") out.push("yes");
      continue;
    }

    if (dataType === "number") {
      const num = toPlainText(value);
      if (num) out.push(num);
      continue;
    }

    if (dataType === "multiSelect" || Array.isArray(value)) {
      const joined = toPlainText(value);
      if (joined) out.push(joined);
      continue;
    }

    // text | select | ناشناخته
    const text = toPlainText(value);
    if (text) out.push(text);
  }

  return out;
}

// ============================================================
// ترکیب امن فیلدها
// ============================================================
function collectParts(sources) {
  const parts = [];

  for (const source of sources) {
    const text = toPlainText(source);
    if (text) parts.push(text);
  }

  return parts;
}

function finalize(parts) {
  const joined = parts.filter(Boolean).join(" ");
  if (!joined) return "";

  const normalized = normalizeForSearch(joined);
  if (!normalized) return "";

  return truncateOnWordBoundary(normalized, MAX_SEARCH_TEXT_LENGTH);
}

// ============================================================
// buildProductSearchText
//
//   { product, attributeValues }
//
// product: آبجکت محصول (فقط فیلدهای موجود استفاده می‌شوند)
// attributeValues: آرایه‌ای از رشته‌ها یا { label, value }
// ============================================================
export function buildProductSearchText({ product, attributeValues } = {}) {
  try {
    const p = product || {};

    const parts = collectParts([
      p.name,
      p.shortDesc,
      p.fullDesc,
      p.category,
      p.subCategory,
      p.productType,
      p.categoryPath,
      p.origin,
      p.country,
      p.certifications,
      p.packaging,
      p.shippingTerms,
      p.paymentTerms,
      p.unit,
      p.badge,
      // اتریبیوت‌ها (ممکن است رشته، عدد، boolean یا { label, value } باشند)
      flattenAttributeValues(attributeValues),
    ]);

    return finalize(parts);
  } catch (err) {
    // این تابع هرگز نباید ingestion را متوقف کند
    console.error("[searchText] buildProductSearchText failed:", err?.message);
    return "";
  }
}

// ============================================================
// buildRequestSearchText
//
//   { request, attributeValues }
// ============================================================
export function buildRequestSearchText({ request, attributeValues } = {}) {
  try {
    const r = request || {};

    const parts = collectParts([
      r.title,
      r.description,
      r.category,
      r.subCategory,
      r.productType,
      r.categoryPath,
      r.deliveryCountry,
      r.buyerCountry,
      r.certifications,
      r.packagingReq,
      r.shippingTerms,
      r.paymentTerms,
      r.budgetRange,
      r.unit,
      flattenAttributeValues(attributeValues),
    ]);

    return finalize(parts);
  } catch (err) {
    console.error("[searchText] buildRequestSearchText failed:", err?.message);
    return "";
  }
}

export default {
  normalizeForSearch,
  truncateOnWordBoundary,
  flattenAttributeValues,
  buildProductSearchText,
  buildRequestSearchText,
  MAX_SEARCH_TEXT_LENGTH,
};
