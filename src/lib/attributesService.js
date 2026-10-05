// src/lib/attributesService.js
// ============================================================
// Dynamic product attributes (EAV)
//
// Idea: an admin defines an attribute for one level of the category
// tree (or global). The filter panel uses resolveAttributesForPath
// to work out which attributes are valid for the selected category
// and renders them automatically. A new attribute = zero code changes.
// ============================================================
import { prisma } from "@/lib/prisma";

// The most specific scope wins
const SCOPE_PRIORITY = {
  productType: 4,
  subCategory: 3,
  category: 2,
  global: 1,
};

export const ATTRIBUTE_DATA_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "select", label: "Single choice" },
  { value: "multiSelect", label: "Multiple choice" },
];

export const ATTRIBUTE_SCOPES = [
  { value: "global", label: "All products (global)" },
  { value: "category", label: "Category — level 1" },
  { value: "subCategory", label: "Subcategory — level 2" },
  { value: "productType", label: "Product type — level 3" },
];

const VALID_TYPES = ATTRIBUTE_DATA_TYPES.map((t) => t.value);
const VALID_SCOPES = ATTRIBUTE_SCOPES.map((s) => s.value);

// ============================================================
// Reading definitions
// ============================================================
export async function listAttributeDefinitions({
  includeInactive = false,
} = {}) {
  return prisma.attributeDefinition.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [
      { scope: "asc" },
      { scopeId: "asc" },
      { sortOrder: "asc" },
      { label: "asc" },
    ],
  });
}

// ============================================================
// Which attributes are valid for this category path?
//
//   "grains-cereals/rice/basmati"
//      → global + category(grains-cereals)
//        + subCategory(rice) + productType(basmati)
//
// With inheritance: if a key appears in several scopes, the most specific one wins.
// ============================================================
export async function resolveAttributesForPath(
  categoryPath,
  { filterableOnly = true, includeInactive = false } = {}
) {
  const levels = String(categoryPath || "")
    .split("/")
    .filter(Boolean);
  const [l1, l2, l3] = levels;

  const or = [{ scope: "global" }];
  if (l1) or.push({ scope: "category", scopeId: l1 });
  if (l2) or.push({ scope: "subCategory", scopeId: l2 });
  if (l3) or.push({ scope: "productType", scopeId: l3 });

  const defs = await prisma.attributeDefinition.findMany({
    where: {
      OR: or,
      ...(includeInactive ? {} : { isActive: true }),
      ...(filterableOnly ? { isFilterable: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  // Deduplicate by key — the most specific scope wins
  const byKey = new Map();
  for (const d of defs) {
    const prev = byKey.get(d.key);
    if (
      !prev ||
      (SCOPE_PRIORITY[d.scope] || 0) > (SCOPE_PRIORITY[prev.scope] || 0)
    ) {
      byKey.set(d.key, d);
    }
  }

  return [...byKey.values()].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      String(a.label).localeCompare(String(b.label))
  );
}

// ============================================================
// Admin input validation
// ============================================================
export function validateAttributeInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body || {}, k) &&
    body[k] !== undefined;

  if (!partial || has("key")) {
    const key = String(body?.key || "").trim();
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      errors.push(
        "key must be lowercase letters, digits and underscore (e.g. moisture)"
      );
    } else {
      data.key = key;
    }
  }

  if (!partial || has("label")) {
    const label = String(body?.label || "").trim();
    if (!label) errors.push("label is required");
    else data.label = label;
  }

  if (has("unit")) data.unit = String(body.unit || "").trim() || null;

  if (!partial || has("dataType")) {
    const dataType = String(body?.dataType || "text");
    if (!VALID_TYPES.includes(dataType)) errors.push("invalid dataType");
    else data.dataType = dataType;
  }

  if (!partial || has("scope")) {
    const scope = String(body?.scope || "global");
    if (!VALID_SCOPES.includes(scope)) errors.push("invalid scope");
    else data.scope = scope;
  }

  const scope = data.scope ?? body?.scope ?? "global";
  if (has("scopeId") || scope !== "global") {
    const scopeId = String(body?.scopeId || "").trim();
    if (scope !== "global" && !scopeId) {
      errors.push("scopeId is required when scope is not global");
    }
    data.scopeId = scope === "global" ? null : scopeId || null;
  }

  if (has("options")) {
    const type = data.dataType ?? body?.dataType;
    if (type === "select" || type === "multiSelect") {
      const options = Array.isArray(body.options) ? body.options : [];
      const clean = options
        .map((o) => {
          if (typeof o === "string") return { value: o.trim(), label: o.trim() };
          if (o && typeof o === "object" && o.value) {
            return {
              value: String(o.value).trim(),
              label: String(o.label || o.value).trim(),
            };
          }
          return null;
        })
        .filter((o) => o && o.value);

      if (clean.length === 0) errors.push("at least one option is required");
      data.options = clean;
    } else {
      data.options = null;
    }
  }

  for (const boolField of ["isFilterable", "isRequired", "showInCard", "isActive"]) {
    if (has(boolField)) data[boolField] = body[boolField] === true;
  }

  if (has("sortOrder")) {
    const n = Number(body.sortOrder);
    data.sortOrder = Number.isFinite(n) ? Math.trunc(n) : 0;
  }

  return { errors, data };
}

// ============================================================
// CRUD
// ============================================================
export async function createAttributeDefinition(body) {
  const { errors, data } = validateAttributeInput(body);
  if (errors.length) return { ok: false, errors };

  try {
    const created = await prisma.attributeDefinition.create({
      data: {
        ...data,
        isFilterable: data.isFilterable ?? true,
        isActive: data.isActive ?? true,
      },
    });
    return { ok: true, attribute: created };
  } catch (err) {
    if (err.code === "P2002") {
      return {
        ok: false,
        errors: [
          `An attribute with key "${data.key}" already exists for this scope`,
        ],
      };
    }
    throw err;
  }
}

export async function updateAttributeDefinition(id, body) {
  const existing = await prisma.attributeDefinition.findUnique({
    where: { id },
  });
  if (!existing) return { ok: false, notFound: true };

  const { errors, data } = validateAttributeInput(body, { partial: true });
  if (errors.length) return { ok: false, errors };
  if (Object.keys(data).length === 0) {
    return { ok: false, errors: ["Nothing to update"] };
  }

  try {
    const updated = await prisma.attributeDefinition.update({
      where: { id },
      data,
    });
    return { ok: true, attribute: updated };
  } catch (err) {
    if (err.code === "P2002") {
      return {
        ok: false,
        errors: ["Another attribute already uses this key in this scope"],
      };
    }
    throw err;
  }
}

export async function deleteAttributeDefinition(id) {
  const existing = await prisma.attributeDefinition.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { ok: false, notFound: true };

  // Dependent values are removed through onDelete: Cascade
  await prisma.attributeDefinition.delete({ where: { id } });
  return { ok: true };
}

// ============================================================
// Convert an input value into ProductAttribute rows
//
// multiSelect → one row per option (so filtering stays indexable)
// ============================================================
export function coerceAttributeRows(def, raw) {
  const isEmpty =
    raw === null || raw === undefined || raw === "" || raw === false;

  if (def.dataType === "multiSelect") {
    const arr = Array.isArray(raw) ? raw : isEmpty ? [] : [raw];
    return arr
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
      .map((v) => ({ valueString: String(v).trim().slice(0, 255) }));
  }

  if (def.dataType === "boolean") {
    if (raw === null || raw === undefined || raw === "") return [];
    const truthy =
      raw === true || raw === "true" || raw === "on" || raw === 1 || raw === "1";
    return [{ valueBool: truthy }];
  }

  if (def.dataType === "number") {
    if (isEmpty) return [];
    const n = Number(raw);
    if (!Number.isFinite(n)) return [];
    return [{ valueNumber: n }];
  }

  // text | select
  if (isEmpty) return [];
  return [{ valueString: String(raw).trim().slice(0, 255) }];
}

// ============================================================
// Save the values of one product
//
// items: [{ attributeId, value }]
// Method: delete all previous values and insert them again (idempotent and simple)
// ============================================================
export async function setProductAttributes(productId, items = []) {
  const ids = [
    ...new Set(
      (items || []).map((i) => i?.attributeId).filter((v) => typeof v === "string")
    ),
  ];

  const defs = ids.length
    ? await prisma.attributeDefinition.findMany({ where: { id: { in: ids } } })
    : [];
  const defById = new Map(defs.map((d) => [d.id, d]));

  const rows = [];
  for (const item of items || []) {
    const def = defById.get(item?.attributeId);
    if (!def) continue;
    for (const row of coerceAttributeRows(def, item.value)) {
      rows.push({ productId, attributeId: def.id, ...row });
    }
  }

  await prisma.$transaction([
    prisma.productAttribute.deleteMany({ where: { productId } }),
    ...(rows.length
      ? [prisma.productAttribute.createMany({ data: rows })]
      : []),
  ]);

  return rows.length;
}

// ============================================================
// Read the values of one product (grouped)
// ============================================================
export async function getProductAttributes(productId) {
  const rows = await prisma.productAttribute.findMany({
    where: { productId },
    include: { attribute: true },
    orderBy: { attributeId: "asc" },
  });

  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.attributeId)) {
      map.set(row.attributeId, {
        attributeId: row.attributeId,
        key: row.attribute?.key,
        label: row.attribute?.label,
        dataType: row.attribute?.dataType,
        unit: row.attribute?.unit,
        options: row.attribute?.options || null,
        values: [],
      });
    }

    const entry = map.get(row.attributeId);
    if (row.valueString !== null && row.valueString !== undefined) {
      entry.values.push(row.valueString);
    } else if (row.valueNumber !== null && row.valueNumber !== undefined) {
      entry.values.push(row.valueNumber);
    } else if (row.valueBool !== null && row.valueBool !== undefined) {
      entry.values.push(row.valueBool);
    }
  }

  return [...map.values()].map((entry) => ({
    ...entry,
    value:
      entry.dataType === "multiSelect"
        ? entry.values
        : entry.values.length > 0
        ? entry.values[0]
        : null,
  }));
}

// ============================================================
// Build Prisma conditions for attribute filters
//
// filters: { [attributeId]: value | [values] | { min, max } | true|false }
// Output: an array of conditions — each one goes inside attributes.some
// ============================================================
export function buildAttributeConditions(filters, defs = []) {
  const defById = new Map((defs || []).map((d) => [d.id, d]));
  const conditions = [];

  for (const [attributeId, raw] of Object.entries(filters || {})) {
    const def = defById.get(attributeId);
    if (!def) continue;

    if (def.dataType === "number") {
      const min =
        raw && typeof raw === "object" ? raw.min : undefined;
      const max =
        raw && typeof raw === "object" ? raw.max : undefined;

      const range = {};
      if (min !== undefined && min !== null && min !== "") {
        const n = Number(min);
        if (Number.isFinite(n)) range.gte = n;
      }
      if (max !== undefined && max !== null && max !== "") {
        const n = Number(max);
        if (Number.isFinite(n)) range.lte = n;
      }
      if (Object.keys(range).length > 0) {
        conditions.push({ attributeId, valueNumber: range });
      }
      continue;
    }

    if (def.dataType === "boolean") {
      if (raw === true || raw === "true") {
        conditions.push({ attributeId, valueBool: true });
      } else if (raw === false || raw === "false") {
        conditions.push({ attributeId, valueBool: false });
      }
      continue;
    }

    // text | select | multiSelect
    const list = Array.isArray(raw) ? raw : [raw];
    const clean = list
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
      .map((v) => String(v).trim());

    if (clean.length === 0) continue;

    // ------------------------------------------------------
    // Text attribute: the user types into a free input, so a
    // substring match is expected instead of an exact match. Without
    // this, typing "nest" returned nothing and the full value had to
    // be written out.
    // (the MySQL collation is not case-sensitive by default)
    // ------------------------------------------------------
    if (def.dataType === "text") {
      if (clean.length === 1) {
        conditions.push({ attributeId, valueString: { contains: clean[0] } });
      } else {
        // Multiple values → OR
        conditions.push({
          attributeId,
          OR: clean.map((v) => ({ valueString: { contains: v } })),
        });
      }
      continue;
    }

    // ------------------------------------------------------
    // select | multiSelect: the value comes from a dropdown, so an exact
    // match is correct. Multiple values on one row = OR, which is the
    // desired behaviour for multiSelect (one row per option).
    // ------------------------------------------------------
    conditions.push({ attributeId, valueString: { in: clean } });
  }

  return conditions;
}

// ============================================================
// Facet count — "how many products have this option"
// ============================================================
export async function getAttributeFacets(defs = [], baseWhere = {}) {
  const out = {};

  for (const def of defs) {
    try {
      if (def.dataType === "select" || def.dataType === "multiSelect") {
        // Counting is done with groupBy, not by loading every row into
        // memory. For a category with thousands of products, findMany
        // means transferring thousands of rows just to count them.
        const rows = await prisma.productAttribute.groupBy({
          by: ["valueString"],
          where: {
            attributeId: def.id,
            valueString: { not: null },
            product: baseWhere,
          },
          _count: { _all: true },
        });

        const counts = {};
        for (const r of rows) {
          if (r.valueString === null || r.valueString === undefined) continue;
          counts[r.valueString] = r._count._all;
        }
        out[def.id] = counts;
      } else if (def.dataType === "boolean") {
        const rows = await prisma.productAttribute.groupBy({
          by: ["valueBool"],
          where: { attributeId: def.id, product: baseWhere },
          _count: { _all: true },
        });

        const counts = {};
        for (const r of rows) {
          counts[String(r.valueBool)] = r._count._all;
        }
        out[def.id] = counts;
      } else if (def.dataType === "number") {
        const agg = await prisma.productAttribute.aggregate({
          where: { attributeId: def.id, product: baseWhere },
          _min: { valueNumber: true },
          _max: { valueNumber: true },
        });

        out[def.id] = {
          min: agg._min.valueNumber,
          max: agg._max.valueNumber,
        };
      }
    } catch (err) {
      console.error(`[attributes] facet failed for ${def.key}:`, err.message);
      out[def.id] = {};
    }
  }

  return out;
}
