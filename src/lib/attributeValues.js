// src/lib/attributeValues.js
// ============================================================
// Converting the shape of attribute values between "form" and "API"
//
//   form -> { [attributeId]: value }
//   API  -> [{ attributeId, value }]
//
// This file is PURE and can be used both on the client and the server.
// ============================================================

// ============================================================
// The appropriate empty value for each type
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
// Empty values are dropped so a meaningless row is not created.
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
      // false means "no", which is a valid value, so it is kept
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
// For filling the edit form from the stored data
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
// The service's getProductAttributes() output -> form map
// (each item: { attributeId, dataType, value })
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
// Has the form filled in no attributes at all?
// ============================================================
export function isAttributesMapEmpty(map = {}) {
  return attributesMapToArray(map).length === 0;
}
