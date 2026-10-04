// src/app/api/admin/maintenance/normalize-vocabularies/route.js
// ============================================================
// نرمال‌سازی مقادیر قدیمی واژگان در ردیف‌های موجود
//
// فرم‌های قدیمی «رشته‌ی نمایشی» ذخیره می‌کردند:
//     shippingTerms = "FOB (Free On Board)"
//     paymentTerms  = "T/T"
// و فرم‌های جدید مقدار استاندارد واژگان را ذخیره می‌کنند:
//     "FOB" ، "T/T in advance"
//
// فیلترهای فروشگاه با contains کار می‌کنند، پس بعضی فیلترها
// ردیف‌های قدیمی را پیدا نمی‌کنند ("T/T in advance" ≠ "T/T").
// این اندپوینت مقادیر قدیمی را به مقدار استاندارد تبدیل می‌کند.
//
// ورودی (اختیاری، JSON):
//   { dryRun: true|false, only: "both" | "requests" | "products" }
//   پیش‌فرض: dryRun = true  و  only = "both"
//   یعنی حتی یک فراخوانی بی‌احتیاط هم داده را تغییر نمی‌دهد.
//
// خروجی:
//   { message, dryRun, durationMs, vocabularies: { incoterms: 12, ... },
//     requests: { scanned, changed, unmatched, samples },
//     products: { scanned, changed, unmatched, samples } }
//
//   scanned   → تعداد ردیف خوانده‌شده
//   changed   → تعداد ردیفی که (حداقل) یک فیلدش عوض می‌شود/عوض شد
//   unmatched → تعداد مقادیری که تطبیق پیدا نکردند (دست‌نخورده ماندند)
//   samples   → حداکثر ۵۰ نمونه؛ after === null یعنی تطبیق‌نشده و
//               مقدار قبلی حفظ شده است
//
// هیچ مقداری حذف یا خالی نمی‌شود؛ مقادیر ناشناخته عیناً می‌مانند و
// فقط گزارش می‌شوند.
// ============================================================
export const maxDuration = 300;

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  VOCABULARY_ALIASES,
  ensureVocabularies,
  getVocabularies,
  normalizeCsvValue,
  normalizeVocabularyValue,
} from "@/lib/vocabularies";

// اندازه‌ی هر batch — حافظه و event loop آزاد می‌ماند
const BATCH_SIZE = 200;

// حداکثر نمونه‌های گزارش‌شده برای هر مدل
const MAX_SAMPLES = 50;

// ============================================================
// فیلدهای مورد بررسی
// ============================================================
const REQUEST_FIELDS = [
  { field: "shippingTerms", vocabulary: "incoterms", multi: false },
  { field: "paymentTerms", vocabulary: "paymentTerms", multi: false },
  { field: "certifications", vocabulary: "certifications", multi: true },
  { field: "packagingReq", vocabulary: "packagingTypes", multi: true },
];

const PRODUCT_FIELDS = [
  { field: "shippingTerms", vocabulary: "incoterms", multi: false },
  { field: "paymentTerms", vocabulary: "paymentTerms", multi: false },
  { field: "certifications", vocabulary: "certifications", multi: true },
  { field: "packaging", vocabulary: "packagingTypes", multi: true },
];

// ============================================================
// پارس ورودی
// ============================================================

// فقط false صریح، اجرای واقعی را فعال می‌کند؛ هر چیز دیگری dry-run است
function parseDryRun(raw) {
  const explicitApply =
    raw === false || raw === 0 || raw === "false" || raw === "0";

  return !explicitApply;
}

function parseOnly(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value === "requests" || value === "products" || value === "both") {
    return value;
  }

  return "both";
}

// ============================================================
// ابزارهای داخلی
// ============================================================

// آیا رشته در سطح-بالا (بیرون از پرانتز) کاما دارد؟
// "CIF (Cost, Insurance, Freight)" → نه
// "FOB (Free On Board), CIF"       → بله (چند مقدار در یک فیلد تک‌مقداری)
function hasTopLevelComma(text) {
  let depth = 0;

  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      if (depth > 0) depth -= 1;
    } else if (ch === "," && depth === 0) {
      return true;
    }
  }

  return false;
}

// جدول alias را با واژگان زنده تطبیق می‌دهد: هر alias که هدفش دیگر
// در واژگان نیست حذف می‌شود تا هیچ‌وقت مقدار نامعتبر نوشته نشود.
function buildLiveAliases(vocabularies) {
  const live = {};

  for (const [key, table] of Object.entries(VOCABULARY_ALIASES)) {
    const options = Array.isArray(vocabularies?.[key]) ? vocabularies[key] : [];
    const byValue = new Map();

    for (const opt of options) {
      const value =
        opt && typeof opt === "object" ? opt.value : opt;
      const text = String(value ?? "").trim();
      if (text) byValue.set(text.toLowerCase(), text);
    }

    const kept = {};
    for (const [alias, target] of Object.entries(table || {})) {
      const canonical = byValue.get(String(target ?? "").trim().toLowerCase());
      if (canonical) kept[alias] = canonical;
    }

    live[key] = kept;
  }

  return live;
}

function addSample(summary, sample) {
  if (summary.samples.length >= MAX_SAMPLES) return;
  summary.samples.push(sample);
}

// ============================================================
// پیمایش یک مدل در batch های ۲۰۰ تایی
//
// حلقه با کورسر پایدار کنترل می‌شود: orderBy: { id: "asc" } و skip.
// چون هیچ ردیفی حذف/اضافه نمی‌شود (فقط update و آن هم بعد از
// پیمایش)، ترتیب پایدار است و حلقه قطعاً تمام می‌شود:
// به‌محض اینکه batch کمتر از BATCH_SIZE باشد، یعنی تمام شده.
// ============================================================
async function normalizeModel({ model, fields, vocabularies, aliases, dryRun }) {
  const summary = { scanned: 0, changed: 0, unmatched: 0, samples: [] };
  const pending = []; // ردیف‌هایی که باید به‌روزرسانی شوند

  const select = { id: true };
  for (const def of fields) select[def.field] = true;

  let skip = 0;

  while (true) {
    let batch;

    try {
      batch = await prisma[model].findMany({
        select,
        orderBy: { id: "asc" },
        skip,
        take: BATCH_SIZE,
      });
    } catch (err) {
      console.error(
        `[normalize-vocabularies] ${model} batch read failed:`,
        err?.message || err
      );
      break;
    }

    if (!batch || batch.length === 0) break;

    for (const row of batch) {
      summary.scanned += 1;

      const data = {};

      for (const def of fields) {
        const raw = row[def.field];

        // فیلد خالی/ناموجود → رد شود
        if (raw === null || raw === undefined) continue;
        const stored = String(raw);
        if (!stored.trim()) continue;

        const options = vocabularies[def.vocabulary] || [];
        const table = aliases[def.vocabulary] || null;

        // ===== فیلد چندمقداری (CSV) =====
        if (def.multi) {
          const outcome = normalizeCsvValue(stored, options, table);

          for (const item of outcome.unmatched) {
            summary.unmatched += 1;
            addSample(summary, {
              id: row.id,
              field: def.field,
              before: item,
              after: null, // دست‌نخورده مانده
            });
          }

          // «تغییر» فقط وقتی که رشته‌ی نرمال‌شده با مقدار ذخیره‌شده فرق کند
          if (!outcome.value || outcome.value === stored) continue;

          data[def.field] = outcome.value;
          addSample(summary, {
            id: row.id,
            field: def.field,
            before: stored,
            after: outcome.value,
          });
          continue;
        }

        // ===== فیلد تک‌مقداری =====
        // اگر چند مقدار با کاما آمده باشد، حدس نمی‌زنیم و دست نمی‌زنیم
        // تا چیزی از دست نرود (مثلاً "FOB (Free On Board), CIF").
        if (hasTopLevelComma(stored)) {
          summary.unmatched += 1;
          addSample(summary, {
            id: row.id,
            field: def.field,
            before: stored,
            after: null,
          });
          continue;
        }

        const normalized = normalizeVocabularyValue(stored, options, table);

        if (!normalized) {
          summary.unmatched += 1;
          addSample(summary, {
            id: row.id,
            field: def.field,
            before: stored,
            after: null,
          });
          continue;
        }

        if (normalized === stored) continue;

        data[def.field] = normalized;
        addSample(summary, {
          id: row.id,
          field: def.field,
          before: stored,
          after: normalized,
        });
      }

      if (Object.keys(data).length > 0) {
        summary.changed += 1;
        pending.push({ id: row.id, data });
      }
    }

    // پایان: batch ناقص یعنی آخرین صفحه بود
    if (batch.length < BATCH_SIZE) break;

    skip += batch.length;
  }

  // ===== نوشتن (فقط وقتی dry-run نیست) =====
  // ردیف‌به‌ردیف تا یک ردیف خراب کل اجرا را متوقف نکند.
  let failed = 0;

  if (!dryRun) {
    for (const item of pending) {
      try {
        await prisma[model].update({
          where: { id: item.id },
          data: item.data,
        });
      } catch (err) {
        failed += 1;
        console.error(
          `[normalize-vocabularies] ${model} update failed (${item.id}):`,
          err?.message || err
        );
      }
    }
  }

  return { summary, failed };
}

// ============================================================
// POST — پیش‌نمایش (پیش‌فرض) یا اجرای واقعی
// ============================================================
export async function POST(request) {
  const startedAt = Date.now();

  try {
    // ====== دسترسی ادمین ======
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ====== ورودی (بدنه اختیاری است) ======
    let body = null;
    try {
      body = await request.json();
    } catch {
      // بدنه‌ی خالی یا نامعتبر → پیش‌فرض‌ها
      body = null;
    }

    const dryRun = parseDryRun(body?.dryRun);
    const only = parseOnly(body?.only);
    const doRequests = only === "both" || only === "requests";
    const doProducts = only === "both" || only === "products";

    // ====== واژگان یک‌بار خوانده می‌شود ======
    await ensureVocabularies();
    const vocabularies = await getVocabularies();

    const vocabularyCounts = {};
    for (const [key, options] of Object.entries(vocabularies || {})) {
      vocabularyCounts[key] = Array.isArray(options) ? options.length : 0;
    }

    // فقط alias هایی که هدفشان در واژگان زنده وجود دارد
    const aliases = buildLiveAliases(vocabularies);

    const requests = { scanned: 0, changed: 0, unmatched: 0, samples: [] };
    const products = { scanned: 0, changed: 0, unmatched: 0, samples: [] };
    let failed = 0;

    if (doRequests) {
      const out = await normalizeModel({
        model: "buyingRequest",
        fields: REQUEST_FIELDS,
        vocabularies,
        aliases,
        dryRun,
      });
      requests.scanned = out.summary.scanned;
      requests.changed = out.summary.changed;
      requests.unmatched = out.summary.unmatched;
      requests.samples = out.summary.samples;
      failed += out.failed;
    }

    if (doProducts) {
      const out = await normalizeModel({
        model: "product",
        fields: PRODUCT_FIELDS,
        vocabularies,
        aliases,
        dryRun,
      });
      products.scanned = out.summary.scanned;
      products.changed = out.summary.changed;
      products.unmatched = out.summary.unmatched;
      products.samples = out.summary.samples;
      failed += out.failed;
    }

    const totalChanged = requests.changed + products.changed;
    const totalUnmatched = requests.unmatched + products.unmatched;

    let message = dryRun
      ? `Preview finished (dry run — nothing was written). ${totalChanged} row(s) can be normalised · ${totalUnmatched} unmatched value(s).`
      : `Normalisation applied. ${totalChanged} row(s) updated · ${totalUnmatched} unmatched value(s) left untouched.`;

    if (!dryRun && failed > 0) {
      message += ` ${failed} row(s) failed — check the server logs.`;
    }

    // ============================================================
    // نتیجه
    // ============================================================
    return NextResponse.json({
      message,
      dryRun,
      durationMs: Date.now() - startedAt,
      vocabularies: vocabularyCounts,
      requests,
      products,
    });
  } catch (error) {
    // پیام داخلی در پاسخ لو نمی‌رود
    console.error("Normalize vocabularies error:", error);
    return NextResponse.json(
      { message: "Normalisation failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
