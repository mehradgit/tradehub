// src/lib/filters/options.js
// ============================================================
// Resolving the options of each field (server side)
//
// The schema only says what optionsFrom is; here it is filled from the
// database (vocabularies) or from static sources (countries) and passed
// to the client so the client needs no database access.
// ============================================================
import { countries } from "@/lib/countries";
import { getVocabularies } from "@/lib/vocabularies";
import { FILTER_SCHEMAS } from "./schemas";

function countryOptions() {
  return (countries || [])
    .map((c) => ({
      // The value stored in the database is the country **name** (not the code)
      value: c.name,
      label: c.name,
      // The code is only used to show the flag in the filter list
      code: c.code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================================
// Options of all fields of one schema
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
// Options of one specific field (for one-off cases)
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
