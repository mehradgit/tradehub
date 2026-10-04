// src/lib/filters/options.js
// ============================================================
// حل کردن گزینه‌های هر فیلد (سمت سرور)
//
// اسکیما فقط می‌گوید optionsFrom چیست؛ اینجا از دیتابیس
// (واژگان) یا منابع استاتیک (کشورها) پر می‌شود و به کلاینت
// پاس داده می‌شود تا کلاینت نیازی به دسترسی به دیتابیس نداشته باشد.
// ============================================================
import { countries } from "@/lib/countries";
import { getVocabularies } from "@/lib/vocabularies";
import { FILTER_SCHEMAS } from "./schemas";

function countryOptions() {
  return (countries || [])
    .map((c) => ({ value: c.name, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================================
// گزینه‌های همه‌ی فیلدهای یک اسکیما
// → { [fieldName]: [{ value, label }] }
// ============================================================
export async function resolveFilterOptions(schemaKey) {
  const schema = FILTER_SCHEMAS[schemaKey];
  if (!schema) return {};

  let vocab = {};
  try {
    vocab = await getVocabularies();
  } catch (err) {
    console.error("[filters] vocabulary read failed:", err.message);
  }

  const out = {};

  for (const field of schema.fields) {
    if (field.type === "sort") {
      out[field.name] = schema.sortOptions || [];
      continue;
    }

    if (Array.isArray(field.options) && field.options.length > 0) {
      out[field.name] = field.options;
      continue;
    }

    if (!field.optionsFrom) continue;

    if (field.optionsFrom === "countries") {
      out[field.name] = countryOptions();
      continue;
    }

    out[field.name] = vocab[field.optionsFrom] || [];
  }

  return out;
}

// ============================================================
// گزینه‌های یک فیلد خاص (برای موارد تک‌مصرف)
// ============================================================
export async function resolveFieldOptions(field) {
  if (!field) return [];
  if (field.type === "sort") return field.options || [];
  if (Array.isArray(field.options) && field.options.length > 0) {
    return field.options;
  }
  if (!field.optionsFrom) return [];
  if (field.optionsFrom === "countries") return countryOptions();

  const vocab = await getVocabularies();
  return vocab[field.optionsFrom] || [];
}
