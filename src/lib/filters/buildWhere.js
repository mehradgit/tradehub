// src/lib/filters/buildWhere.js
// ============================================================
// تبدیل فیلترها به شرط Prisma
//
// یک جا برای همه‌ی صفحات. صفحات فقط این را صدا می‌زنند و
// دیگر لازم نیست هر صفحه منطق فیلتر خودش را بنویسد.
// ============================================================
import { FILTER_SCHEMAS, getOrderBy } from "./schemas";
import { readFilterValues, makeGetter } from "./params";
import { buildAttributeConditions } from "@/lib/attributesService";

export const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

// ============================================================
// ساخت شرط از مقادیر فیلتر
// ============================================================
export function buildWhereFromValues(
  schemaKey,
  values = {},
  { attributeDefs = [], skipTypes = [] } = {}
) {
  const schema = FILTER_SCHEMAS[schemaKey];
  if (!schema) return {};

  const and = [];

  for (const field of schema.fields) {
    // فیلدهایی که شرطشان را خودِ صفحه اعمال می‌کند (مثل فیلتر رابطه‌ای)
    if (field.manualOnly) continue;

    // برای facet count باید بتوانیم نوعی از فیلتر را نادیده بگیریم
    if (skipTypes.includes(field.type)) continue;

    const value = values[field.name];
    if (value === undefined || value === null || value === "") continue;

    switch (field.type) {
      // ------------------------------------------------------
      case "text": {
        const q = String(value).trim();
        if (q.length < 2) break;

        const searchable = schema.searchableFields || [];
        if (searchable.length === 0) break;

        and.push({
          OR: searchable.map((f) => ({ [f]: { contains: q } })),
        });
        break;
      }

      // ------------------------------------------------------
      case "categoryCascader": {
        const path = String(value).trim();
        if (!path) break;

        const dbField = field.dbField || "categoryPath";
        // خود مسیر یا هر چیزی زیر آن (prefix روی ایندکس)
        and.push({
          OR: [
            { [dbField]: path },
            { [dbField]: { startsWith: `${path}/` } },
          ],
        });
        break;
      }

      // ------------------------------------------------------
      case "multiSelect": {
        const list = Array.isArray(value) ? value : [value];
        const clean = list
          .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
          .map((v) => String(v).trim());
        if (clean.length === 0) break;

        // فیلتر روی یک رابطه (مثلاً user.businessType)
        if (field.relation) {
          and.push({ [field.relation]: { [field.dbField]: { in: clean } } });
          break;
        }

        // ستون متنی CSV → هر مقدار یک contains
        if (field.matchMode === "contains") {
          and.push({
            OR: clean.map((v) => ({ [field.dbField]: { contains: v } })),
          });
          break;
        }

        and.push({ [field.dbField]: { in: clean } });
        break;
      }

      // ------------------------------------------------------
      case "select": {
        and.push({ [field.dbField]: String(value) });
        break;
      }

      // ------------------------------------------------------
      case "boolean": {
        if (value !== true) break;

        if (field.relationExists) {
          and.push({ [field.relationExists]: { some: {} } });
          break;
        }

        if (field.booleanMode === "notNull") {
          and.push({ [field.dbField]: { not: null } });
          break;
        }

        and.push({ [field.dbField]: true });
        break;
      }

      // ------------------------------------------------------
      case "numberRange": {
        const range = {};
        if (value?.min !== undefined && String(value.min) !== "") {
          const n = Number(value.min);
          if (Number.isFinite(n)) range.gte = n;
        }
        if (value?.max !== undefined && String(value.max) !== "") {
          const n = Number(value.max);
          if (Number.isFinite(n)) range.lte = n;
        }
        if (Object.keys(range).length > 0) {
          and.push({ [field.dbField]: range });
        }
        break;
      }

      // ------------------------------------------------------
      case "number": {
        const n = Number(value);
        if (!Number.isFinite(n)) break;
        and.push({ [field.dbField]: { [field.op || "lte"]: n } });
        break;
      }

      // ------------------------------------------------------
      case "date": {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) break;
        and.push({ [field.dbField]: { [field.op || "lte"]: d } });
        break;
      }

      // ------------------------------------------------------
      case "dynamicAttributes": {
        const conditions = buildAttributeConditions(value, attributeDefs);
        for (const cond of conditions) {
          and.push({ attributes: { some: cond } });
        }
        break;
      }

      // sort در where نقشی ندارد
      default:
        break;
    }
  }

  const where = { ...(schema.baseWhere || {}) };
  if (and.length > 0) where.AND = and;
  return where;
}

// ============================================================
// از searchParams خام → where
// ============================================================
export function buildWhere(schemaKey, searchParams, options = {}) {
  const schema = FILTER_SCHEMAS[schemaKey];
  if (!schema) return {};

  const values = readFilterValues(schema.fields, searchParams);
  return buildWhereFromValues(schemaKey, values, options);
}

// ============================================================
// صفحه‌بندی
// ============================================================
export function readPagination(searchParams, {
  defaultLimit = DEFAULT_PAGE_SIZE,
  maxLimit = MAX_PAGE_SIZE,
} = {}) {
  const get = makeGetter(searchParams);

  const rawPage = parseInt(get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawLimit = parseInt(get("limit") || String(defaultLimit), 10);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

// ============================================================
// بسته‌ی کامل کوئری لیست — همان چیزی که صفحات لازم دارند
//
//   const plan = buildListQuery("products", await searchParams, { attributeDefs });
//   prisma.product.findMany({ where: plan.where, orderBy: plan.orderBy, skip, take })
// ============================================================
export function buildListQuery(schemaKey, searchParams, options = {}) {
  const schema = FILTER_SCHEMAS[schemaKey];
  if (!schema) {
    return {
      values: {},
      where: {},
      orderBy: { createdAt: "desc" },
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      skip: 0,
      sort: "newest",
    };
  }

  const values = readFilterValues(schema.fields, searchParams);
  const where = buildWhereFromValues(schemaKey, values, options);
  const { page, limit, skip } = readPagination(searchParams);

  const get = makeGetter(searchParams);
  const sort = get("sort") || schema.defaultSort || "newest";

  return {
    values,
    where,
    orderBy: getOrderBy(schemaKey, sort),
    sort,
    page,
    limit,
    skip,
  };
}
