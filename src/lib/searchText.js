// src/lib/searchText.js
// ============================================================
// Combined search text (searchText)
//
// Goal: gather all searchable text of a product/purchase request into
// a single column (@db.Text) so it can later be indexed with FULLTEXT
// and ranked search (MATCH ... AGAINST) becomes possible.
//
// This file is PURE (no prisma) so it can be used both in the API and
// elsewhere, and stays testable.
//
// General rule: no null/undefined/empty input may throw;
// the output is "" in the worst case.
// ============================================================

// Maximum length of the search text.
// The @db.Text column has more capacity, but 4000 characters is
// lighter and more sensible for FULLTEXT (max_ft_word_len also stays
// small accordingly).
export const MAX_SEARCH_TEXT_LENGTH = 4000;

// ============================================================
// Common HTML entities
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
//  1) HTML tags are removed  (<p> ... </p>)
//  2) Common entities are decoded (&amp; -> &)
//  3) Converted to lowercase
//  4) All whitespace (space, tab, newline, NBSP) becomes a single space
//     (including the Persian zero-width non-joiner \u200c which disturbs search)
//  5) trim
// ============================================================
export function normalizeForSearch(text) {
  if (text === null || text === undefined) return "";

  let out;
  try {
    out = String(text);
  } catch {
    // If String() failed for any reason (for example a Symbol)
    return "";
  }

  // Remove tags - first complete script/style blocks, then the other tags
  out = out
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  // Decode the common entities
  // Note: &nbsp; must be turned into a space before the rest so that the
  // whitespace-collapsing step clears it as well.
  out = out.replace(
    /&(?:amp|lt|gt|quot|#39|apos|nbsp);/gi,
    (match) => HTML_ENTITIES[match.toLowerCase()] ?? " "
  );

  // Lowercase
  out = out.toLowerCase();

  // Any kind of whitespace (including \u00a0 and \u200c) -> a single space
  out = out.replace(/[\s\u00a0\u200b\u200c\u200d\ufeff]+/g, " ");

  return out.trim();
}

// ============================================================
// toPlainText
//
// Input can be a string, number, boolean or object.
// For { label, value } objects both label and value are extracted
// so that keyed attributes and free-form values are both covered.
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
    // Date or special objects -> plain string
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? "" : input.toISOString();
    }
    if (typeof input.toJSON === "function") {
      try {
        return toPlainText(input.toJSON());
      } catch {
        /* continue with the general path */
      }
    }

    const parts = [];
    if (input.label !== undefined) parts.push(toPlainText(input.label));
    if (input.value !== undefined) parts.push(toPlainText(input.value));
    if (input.name !== undefined) parts.push(toPlainText(input.name));
    if (parts.length > 0) return parts.filter(Boolean).join(" ");

    // Last attempt: the object's values
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
// Cutting the text on a word boundary so half a word does not land in the index.
// If the word boundary is too far back (a very long word), cut raw.
// ============================================================
export function truncateOnWordBoundary(text, maxLength = MAX_SEARCH_TEXT_LENGTH) {
  const str = typeof text === "string" ? text : text ? String(text) : "";
  const limit = Number.isFinite(maxLength) ? Math.max(0, Math.trunc(maxLength)) : 0;

  if (limit === 0) return "";
  if (str.length <= limit) return str;

  const sliced = str.slice(0, limit);

  // Find the last space (must be at least 70% of the allowed length so the cut is not meaningless)
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > Math.floor(limit * 0.7)) {
    return sliced.slice(0, lastSpace).trim();
  }

  return sliced.trim();
}

// ============================================================
// flattenAttributeValues
//
// Input: the output of getProductAttributes() - an array of
//   { attributeId, key, label, dataType, unit, value }
//
// Output: an array of strings to append to searchText.
//
// Rules:
//   multiSelect -> the array is joined with spaces
//   boolean     -> "yes" is produced only when true (false = nothing)
//   number      -> String(value)
//   select/text -> the string itself
//
// An empty value is never added to the array, and the label is added
// only when a real value exists (so that needless text is not
// produced).
// ============================================================
export function flattenAttributeValues(attributes) {
  if (!Array.isArray(attributes)) return [];

  const out = [];

  for (const attr of attributes) {
    if (!attr || typeof attr !== "object") {
      // If a raw string was given instead of an object
      const raw = toPlainText(attr);
      if (raw) out.push(raw);
      continue;
    }

    const { dataType, value, label } = attr;

    // Does a real value exist?
    const hasValue =
      value !== null &&
      value !== undefined &&
      !(typeof value === "string" && value.trim() === "") &&
      !(Array.isArray(value) && value.length === 0);

    if (!hasValue) continue;

    if (dataType === "boolean") {
      // Only true is meaningful; false produces no search text
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

    // text | select | unknown
    const text = toPlainText(value);
    if (text) out.push(text);
  }

  return out;
}

// ============================================================
// Safe combination of fields
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
// product: the product object (only the fields that exist are used)
// attributeValues: an array of strings or { label, value }
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
      // Attributes (may be strings, numbers, booleans or { label, value })
      flattenAttributeValues(attributeValues),
    ]);

    return finalize(parts);
  } catch (err) {
    // This function must never stop ingestion
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
