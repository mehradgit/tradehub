// src/lib/vocabularies.js
// ============================================================
// واژگان کنترل‌شده
//
// فیلدهایی مثل شرایط تحویل، شرایط پرداخت، گواهینامه‌ها و نوع شرکت
// قبلاً متن آزاد بودند؛ یعنی «FOB» و «fob» و «F.O.B» سه گروه جدا
// می‌ساختند و فیلتر روی آن‌ها بی‌اعتبار بود.
//
// این ماژول یک لیست مجاز مرکزی نگه می‌دارد (در Setting) تا
// هم فرم‌ها از dropdown استفاده کنند و هم فیلترها معتبر باشند.
// ============================================================
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "vocabularies";

// ============================================================
// مقادیر پیش‌فرض (قابل ویرایش از پنل ادمین)
// ============================================================
export const DEFAULT_VOCABULARIES = {
  incoterms: [
    "EXW",
    "FCA",
    "FAS",
    "FOB",
    "CFR",
    "CIF",
    "CPT",
    "CIP",
    "DAP",
    "DPU",
    "DDP",
  ],
  paymentTerms: [
    "T/T in advance",
    "T/T 30% deposit",
    "L/C at sight",
    "L/C 30 days",
    "L/C 60 days",
    "L/C 90 days",
    "D/P",
    "D/A",
    "Open account",
    "Cash against documents",
    "Western Union",
    "Escrow",
  ],
  certifications: [
    "ISO 9001",
    "ISO 22000",
    "HACCP",
    "BRC",
    "FSSC 22000",
    "IFS",
    "GMP",
    "Halal",
    "Kosher",
    "Organic (EU)",
    "Organic (USDA)",
    "Non-GMO",
    "Fairtrade",
    "Rainforest Alliance",
    "GlobalG.A.P.",
    "SGS",
    "Phytosanitary Certificate",
    "Health Certificate",
    "Certificate of Origin",
  ],
  businessTypes: [
    "Manufacturer",
    "Trading Company",
    "Exporter",
    "Importer",
    "Distributor",
    "Wholesaler",
    "Retailer",
    "Agent / Broker",
    "Logistics Provider",
    "Farm / Producer",
    "Cooperative",
  ],
  packagingTypes: [
    "Bulk",
    "Bag (PP)",
    "Bag (Jute)",
    "Bag (Paper)",
    "Big Bag / Jumbo",
    "Carton",
    "Drum",
    "Bottle",
    "Jar",
    "Can / Tin",
    "Vacuum Packed",
    "Retail Pack",
    "Container (FCL)",
    "Container (LCL)",
  ],
  units: ["kg", "MT", "ton", "lb", "L", "carton", "bag", "container", "pallet"],
  currencies: ["USD", "EUR", "AED", "IRR", "CNY", "TRY", "INR", "GBP"],
};

// ترتیب نمایش در پنل ادمین
export const VOCABULARY_META = [
  { key: "incoterms", label: "Incoterms / Delivery Terms" },
  { key: "paymentTerms", label: "Payment Terms" },
  { key: "certifications", label: "Certifications" },
  { key: "businessTypes", label: "Company Types" },
  { key: "packagingTypes", label: "Packaging Types" },
  { key: "units", label: "Units of Measure" },
  { key: "currencies", label: "Currencies" },
];

// ============================================================
// نرمال‌سازی: هر آیتم می‌تواند رشته یا {value,label} باشد
// ============================================================
export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  const out = [];

  for (const item of items) {
    if (item === null || item === undefined) continue;

    if (typeof item === "string") {
      const value = item.trim();
      if (value) out.push({ value, label: value });
      continue;
    }

    if (typeof item === "object" && item.value) {
      const value = String(item.value).trim();
      if (value) {
        out.push({ value, label: String(item.label || value).trim() });
      }
    }
  }

  // حذف تکراری‌ها (بر اساس value، بدون حساسیت به بزرگی/کوچکی)
  const seen = new Set();
  return out.filter((i) => {
    const k = i.value.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ============================================================
// خواندن
// ============================================================
export async function getVocabularies() {
  let stored = null;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });
    stored = setting?.value || null;
  } catch (err) {
    console.error("[vocabularies] read failed:", err.message);
  }

  const merged = {};
  for (const { key } of VOCABULARY_META) {
    const fromStore = stored?.[key];
    const source =
      Array.isArray(fromStore) && fromStore.length > 0
        ? fromStore
        : DEFAULT_VOCABULARIES[key] || [];
    merged[key] = normalizeItems(source);
  }

  return merged;
}

// ============================================================
// فقط مقادیر یک واژگان (آرایه‌ی رشته)
// ============================================================
export async function getVocabularyValues(key) {
  const all = await getVocabularies();
  return (all[key] || []).map((i) => i.value);
}

// ============================================================
// ذخیره (از پنل ادمین)
// ============================================================
export async function saveVocabularies(value) {
  const clean = {};

  for (const { key } of VOCABULARY_META) {
    if (value && Array.isArray(value[key])) {
      clean[key] = normalizeItems(value[key]).map((i) => i.value);
    }
  }

  return prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: clean },
    create: { key: SETTING_KEY, value: clean },
  });
}

// ============================================================
// اگر تنظیمات نبود، مقادیر پیش‌فرض را بنویس
// ============================================================
export async function ensureVocabularies() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (setting) return;

    const seed = {};
    for (const { key } of VOCABULARY_META) {
      seed[key] = DEFAULT_VOCABULARIES[key];
    }

    await prisma.setting.create({
      data: { key: SETTING_KEY, value: seed },
    });
  } catch (err) {
    console.error("[vocabularies] ensure failed:", err.message);
  }
}

// ============================================================
// نگاشت صریح مقادیر قدیمی (رشته‌های نمایشی) → مقدار استاندارد واژگان
//
// قاعده‌ی سخت‌گیرانه:
//   هر هدف باید عیناً یکی از مقادیر DEFAULT_VOCABULARIES همان کلید
//   باشد. اگر مقدار قدیمی مبهم باشد (چند گزینه‌ی ممکن) عمداً هیچ
//   نگاشتی نداریم تا حدس نزنیم؛ آن مقدار unmatched گزارش می‌شود و
//   دست‌نخورده می‌ماند. نمونه‌های عمداً نگاشت‌نشده:
//     paymentTerms: "L/C" و "Letter of Credit" (چهار گزینه‌ی L/C ...)
//                   "PayPal" (در واژگان وجود ندارد)
//     certifications: "Organic" (بین Organic (EU) و Organic (USDA))
//     currencies: "toman" (۱۰ برابر ریال است، نه معادل آن)
//     units/currencies: "pound" (بین lb و GBP مبهم است)
//
// نکته: کلیدها هنگام تطبیق بدون حساسیت به بزرگی/کوچکی و با فاصله‌های
// جمع‌شده مقایسه می‌شوند. کلیدهایی که کامای سطح-بالا دارند عملاً
// بی‌استفاده‌اند (چون CSV قبل از تطبیق تقسیم می‌شود)، پس این‌جا فقط
// کامای داخل پرانتز داریم.
// ============================================================
export const VOCABULARY_ALIASES = {
  incoterms: {
    "fob (free on board)": "FOB",
    "free on board": "FOB",
    "cif (cost, insurance, freight)": "CIF",
    "cif (cost, insurance and freight)": "CIF",
    "exw (ex works)": "EXW",
    "ex works": "EXW",
    "ddp (delivered duty paid)": "DDP",
    "delivered duty paid": "DDP",
    "dap (delivered at place)": "DAP",
    "delivered at place": "DAP",
    "fca (free carrier)": "FCA",
    "free carrier": "FCA",
    "fas (free alongside ship)": "FAS",
    "free alongside ship": "FAS",
    "cfr (cost and freight)": "CFR",
    "cost and freight": "CFR",
    "cpt (carriage paid to)": "CPT",
    "carriage paid to": "CPT",
    "cip (carriage and insurance paid to)": "CIP",
    "carriage and insurance paid to": "CIP",
    "dpu (delivered at place unloaded)": "DPU",
    "delivered at place unloaded": "DPU",
  },

  paymentTerms: {
    "t/t": "T/T in advance",
    tt: "T/T in advance",
    "t/t (telegraphic transfer)": "T/T in advance",
    "telegraphic transfer": "T/T in advance",
    "cash in advance": "T/T in advance",
    "30% t/t deposit": "T/T 30% deposit",
    "t/t with 30% deposit": "T/T 30% deposit",
    "30% deposit t/t": "T/T 30% deposit",
    "letter of credit at sight": "L/C at sight",
    "sight letter of credit": "L/C at sight",
    "sight l/c": "L/C at sight",
    "l/c (letter of credit) at sight": "L/C at sight",
    "letter of credit 30 days": "L/C 30 days",
    "usance l/c 30 days": "L/C 30 days",
    "letter of credit 60 days": "L/C 60 days",
    "usance l/c 60 days": "L/C 60 days",
    "letter of credit 90 days": "L/C 90 days",
    "usance l/c 90 days": "L/C 90 days",
    "documents against payment": "D/P",
    "documents against acceptance": "D/A",
    "o/a": "Open account",
    cad: "Cash against documents",
    "escrow service": "Escrow",
  },

  certifications: {
    "iso 9001:2015": "ISO 9001",
    "iso 9001:2008": "ISO 9001",
    "iso-9001": "ISO 9001",
    iso9001: "ISO 9001",
    "iso 22000:2005": "ISO 22000",
    "iso-22000": "ISO 22000",
    iso22000: "ISO 22000",
    fssc22000: "FSSC 22000",
    brcgs: "BRC",
    "brc global standard": "BRC",
    "haccp certificate": "HACCP",
    "halal certificate": "Halal",
    "halal certified": "Halal",
    "kosher certificate": "Kosher",
    "eu organic": "Organic (EU)",
    "organic eu": "Organic (EU)",
    "organic (ec) 834/2007": "Organic (EU)",
    "usda organic": "Organic (USDA)",
    "organic usda": "Organic (USDA)",
    nop: "Organic (USDA)",
    "non gmo": "Non-GMO",
    "non-gmo project": "Non-GMO",
    "non-gmo project verified": "Non-GMO",
    "gmo free": "Non-GMO",
    "gmo-free": "Non-GMO",
    "fair trade": "Fairtrade",
    "fairtrade certified": "Fairtrade",
    "rainforest alliance certified": "Rainforest Alliance",
    globalgap: "GlobalG.A.P.",
    "globalgap certified": "GlobalG.A.P.",
    "sgs certificate": "SGS",
    "sgs inspection": "SGS",
    phytosanitary: "Phytosanitary Certificate",
    "phyto certificate": "Phytosanitary Certificate",
    "health cert": "Health Certificate",
    "c/o": "Certificate of Origin",
    coo: "Certificate of Origin",
  },

  businessTypes: {
    trading: "Trading Company",
    trader: "Trading Company",
    "trading firm": "Trading Company",
    factory: "Manufacturer",
    exporters: "Exporter",
    importers: "Importer",
    "distribution company": "Distributor",
    wholesale: "Wholesaler",
    "wholesale trader": "Wholesaler",
    retail: "Retailer",
    "retail store": "Retailer",
    agent: "Agent / Broker",
    broker: "Agent / Broker",
    "trading agent": "Agent / Broker",
    logistics: "Logistics Provider",
    "freight forwarder": "Logistics Provider",
    producer: "Farm / Producer",
    farm: "Farm / Producer",
    grower: "Farm / Producer",
    coop: "Cooperative",
    "co-operative": "Cooperative",
    "cooperative society": "Cooperative",
  },

  packagingTypes: {
    "pp bag": "Bag (PP)",
    "polypropylene bag": "Bag (PP)",
    "woven pp bag": "Bag (PP)",
    "jute bag": "Bag (Jute)",
    "jute sack": "Bag (Jute)",
    "paper bag": "Bag (Paper)",
    "jumbo bag": "Big Bag / Jumbo",
    "big bag": "Big Bag / Jumbo",
    "fioc bag": "Big Bag / Jumbo",
    "super sack": "Big Bag / Jumbo",
    "carton box": "Carton",
    "cardboard carton": "Carton",
    "cardboard box": "Carton",
    "corrugated carton": "Carton",
    "steel drum": "Drum",
    "glass bottle": "Bottle",
    "pet bottle": "Bottle",
    "glass jar": "Jar",
    "tin can": "Can / Tin",
    canned: "Can / Tin",
    "vacuum pack": "Vacuum Packed",
    "vacuum packaging": "Vacuum Packed",
    "retail packaging": "Retail Pack",
    fcl: "Container (FCL)",
    "full container load": "Container (FCL)",
    "20ft container": "Container (FCL)",
    "40ft container": "Container (FCL)",
    lcl: "Container (LCL)",
    "less than container load": "Container (LCL)",
    "in bulk": "Bulk",
    loose: "Bulk",
  },

  units: {
    kgs: "kg",
    kilo: "kg",
    kilos: "kg",
    kilogram: "kg",
    kilograms: "kg",
    "metric ton": "MT",
    "metric tons": "MT",
    "metric tonne": "MT",
    "metric tonnes": "MT",
    tonne: "MT",
    tonnes: "MT",
    tons: "ton",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    liter: "L",
    liters: "L",
    litre: "L",
    litres: "L",
    cartons: "carton",
    bags: "bag",
    containers: "container",
    pallets: "pallet",
  },

  currencies: {
    "us dollar": "USD",
    "us dollars": "USD",
    dollar: "USD",
    dollars: "USD",
    euro: "EUR",
    euros: "EUR",
    dirham: "AED",
    "uae dirham": "AED",
    "aed dirham": "AED",
    rial: "IRR",
    "iranian rial": "IRR",
    rmb: "CNY",
    yuan: "CNY",
    "chinese yuan": "CNY",
    lira: "TRY",
    "turkish lira": "TRY",
    rupee: "INR",
    "indian rupee": "INR",
    "pound sterling": "GBP",
    sterling: "GBP",
    "british pound": "GBP",
  },
};

// ============================================================
// ابزارهای داخلی تطبیق (خالص و بدون I/O)
// ============================================================

// کلید مقایسه: trim + جمع‌کردن فاصله‌های تکراری + lowercase
function toMatchKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// حذف پرانتز انتهایی: "FOB (Free On Board)" → "FOB"
function stripTrailingParens(text) {
  return text.replace(/\s*\([^()]*\)\s*$/, "").trim();
}

// بریدن از اولین پرانتز: "FOB (Free On Board) named port" → "FOB"
function cutAtFirstParen(text) {
  const index = text.indexOf("(");
  return (index === -1 ? text : text.slice(0, index)).trim();
}

// تقسیم CSV فقط روی کاماهای سطح-بالا، تا مقادیری مثل
// "CIF (Cost, Insurance, Freight)" تکه‌تکه نشوند.
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";

  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      if (depth > 0) depth -= 1;
    } else if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);

  return parts.map((p) => p.trim()).filter(Boolean);
}

// ایندکس گزینه‌ها: value و label → value (بدون حساسیت به بزرگی/کوچکی)
function buildOptionIndexes(options) {
  const byValue = new Map();
  const byLabel = new Map();

  for (const opt of Array.isArray(options) ? options : []) {
    const isObject = opt && typeof opt === "object";
    const value = String((isObject ? opt.value : opt) ?? "").trim();
    if (!value) continue;

    const valueKey = toMatchKey(value);
    if (!byValue.has(valueKey)) byValue.set(valueKey, value);

    const label = String((isObject ? opt.label ?? opt.value : opt) ?? "").trim();
    const labelKey = toMatchKey(label);
    if (labelKey && !byLabel.has(labelKey)) byLabel.set(labelKey, value);
  }

  return { byValue, byLabel };
}

// ============================================================
// یک مقدار → مقدار استاندارد، یا null اگر تطبیق پیدا نشد
//
// ترتیب تطبیق (بدون حساسیت به بزرگی/کوچکی، trim شده):
//   1) تطبیق دقیق با value یک گزینه
//   2) تطبیق دقیق با label یک گزینه
//   3) حذف پرانتز انتهایی و تکرار ۱ و ۲
//   4) بریدن از اولین "(" و تکرار ۱ و ۲
//   5) جدول alias (هدف باید در واژگان زنده موجود باشد)
//   6) مقداری که رشته با آن شروع می‌شود و کاراکتر بعدی
//      "(" یا فاصله یا پایان رشته است
//   7) null
//
// options می‌تواند آرایه‌ی رشته یا آرایه‌ی {value,label} باشد.
// اگر لیست گزینه‌ها خالی باشد، هدف alias بدون بررسی برگردانده
// می‌شود؛ ولی وقتی گزینه‌ها معلوم‌اند هیچ‌وقت مقداری خارج از واژگان
// نوشته نمی‌شود (هدف حذف‌شده → null → unmatched).
// خالص است: نه prisma، نه async.
// ============================================================
export function normalizeVocabularyValue(raw, options, aliases) {
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim();
  if (!text) return null;

  const { byValue, byLabel } = buildOptionIndexes(options);
  const optionCount = byValue.size;

  // جدول alias → کلید نرمال‌شده
  const aliasMap = new Map();
  if (aliases && typeof aliases === "object") {
    for (const [alias, target] of Object.entries(aliases)) {
      const aliasKey = toMatchKey(alias);
      const targetText = String(target ?? "").trim();
      if (aliasKey && targetText) aliasMap.set(aliasKey, targetText);
    }
  }

  // شکل‌های ممکن ورودی، به ترتیب اولویت (کلید نرمال‌شده)
  const candidates = [];
  for (const form of [text, stripTrailingParens(text), cutAtFirstParen(text)]) {
    const key = toMatchKey(form);
    if (key && !candidates.includes(key)) candidates.push(key);
  }

  // ===== گام ۱ و ۲: تطبیق دقیق value / label =====
  for (const key of candidates) {
    if (byValue.has(key)) return byValue.get(key);
    if (byLabel.has(key)) return byLabel.get(key);
  }

  // ===== گام ۵: جدول alias =====
  for (const key of candidates) {
    const target = aliasMap.get(key);
    if (!target) continue;

    const targetKey = toMatchKey(target);
    if (byValue.has(targetKey)) return byValue.get(targetKey);

    // هدف در واژگان زنده نیست → حدس نمی‌زنیم
    if (optionCount > 0) continue;
    return target;
  }

  // ===== گام ۶: پیشوند مقداری موجود =====
  // بلندترین مقدار اول، تا کوتاه‌ترها زودتر تطبیق ندهند
  const prefixEntries = [...byValue.entries()].sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const key of candidates) {
    for (const [valueKey, value] of prefixEntries) {
      if (!key.startsWith(valueKey)) continue;

      const next = key.charAt(valueKey.length);
      if (next === "" || next === "(" || next === " ") return value;
    }
  }

  // ===== گام ۷ =====
  return null;
}

// ============================================================
// مقدار CSV (چندگانه) → CSV استاندارد
//
//   value      → رشته‌ی نرمال‌شده با جداکننده‌ی ", "
//   changed    → آیا خروجی با مقدار ذخیره‌شده (trim شده) فرق دارد
//   unmatched  → زیرمقادیر تطبیق‌نشده (برای گزارش)
//
// هیچ زیرمقداری حذف نمی‌شود: تطبیق‌نشده‌ها عیناً در خروجی می‌مانند.
// خالص است: نه prisma، نه async.
// ============================================================
export function normalizeCsvValue(raw, options, aliases) {
  const text = raw === null || raw === undefined ? "" : String(raw).trim();
  const parts = splitTopLevel(text);

  // اگر چیزی برای تقسیم نبود، مقدار اصلی دست‌نخورده برمی‌گردد
  if (parts.length === 0) {
    return { value: text, changed: false, unmatched: [] };
  }

  const out = [];
  const unmatched = [];
  const seen = new Set();
  const seenUnmatched = new Set();

  for (const part of parts) {
    const normalized = normalizeVocabularyValue(part, options, aliases);
    const kept = normalized || part; // تطبیق‌نشده → عیناً حفظ می‌شود

    if (!normalized) {
      const unmatchedKey = toMatchKey(part);
      if (!seenUnmatched.has(unmatchedKey)) {
        seenUnmatched.add(unmatchedKey);
        unmatched.push(part);
      }
    }

    const dedupeKey = toMatchKey(kept);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(kept);
  }

  const value = out.join(", ");
  return { value, changed: value !== text, unmatched };
}
