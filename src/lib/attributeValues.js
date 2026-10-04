// src/lib/attributeValues.js
// ============================================================
// تبدیل شکل مقادیر اتریبیوت بین «فرم» و «API»
//
//   فرم  → { [attributeId]: value }
//   API  → [{ attributeId, value }]
//
// این فایل PURE است و هم در کلاینت و هم سرور قابل استفاده است.
// ============================================================

// ============================================================
// مقدار خالی مناسب هر نوع
// ============================================================
export function emptyAttributeValue(dataType) {
  switch (dataType) {
    case "multiSelect":
      return [];
    case "boolean":
      return false;
    case "number":
      return "";
    default:
      return "";
  }
}

// ============================================================
// { id: value } → [{ attributeId, value }]
//
// مقادیر خالی حذف می‌شوند تا ردیف بی‌معنی ساخته نشود.
// ============================================================
export function attributesMapToArray(map = {}) {
  if (!map || typeof map !== "object") return [];

  const out = [];

  for (const [attributeId, value] of Object.entries(map)) {
    if (!attributeId) continue;

    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
    } else if (typeof value === "string") {
      if (value.trim() === "") continue;
    } else if (typeof value === "boolean") {
      // false یعنی «خیر» که یک مقدار معتبر است، پس نگه داشته می‌شود
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
    } else {
      continue;
    }

    out.push({ attributeId, value });
  }

  return out;
}

// ============================================================
// [{ attributeId, value }] → { id: value }
// برای پر کردن فرم ویرایش از داده‌ی ذخیره‌شده
// ============================================================
export function attributesArrayToMap(list = []) {
  const map = {};

  for (const item of Array.isArray(list) ? list : []) {
    if (!item) continue;
    const id = item.attributeId || item.id;
    if (!id) continue;
    map[id] = item.value !== undefined ? item.value : item.values;
  }

  return map;
}

// ============================================================
// خروجی getProductAttributes() سرویس → map فرم
// (هر آیتم: { attributeId, dataType, value })
// ============================================================
export function productAttributesToMap(attributes = []) {
  const map = {};

  for (const attr of Array.isArray(attributes) ? attributes : []) {
    if (!attr?.attributeId) continue;

    if (attr.dataType === "boolean") {
      map[attr.attributeId] = attr.value === true;
    } else if (attr.dataType === "multiSelect") {
      map[attr.attributeId] = Array.isArray(attr.value)
        ? attr.value
        : attr.value
        ? [attr.value]
        : [];
    } else if (attr.dataType === "number") {
      map[attr.attributeId] =
        attr.value === null || attr.value === undefined ? "" : String(attr.value);
    } else {
      map[attr.attributeId] = attr.value ?? "";
    }
  }

  return map;
}

// ============================================================
// آیا فرم هیچ اتریبیوتی پر نکرده؟
// ============================================================
export function isAttributesMapEmpty(map = {}) {
  return attributesMapToArray(map).length === 0;
}
