// src/lib/filters/serverContext.js
// ============================================================
// بسته‌ی کامل فیلتر برای Server Components
//
// صفحات فقط این را صدا می‌زنند و همه‌چیز (درخت دسته، گزینه‌ها،
// اتریبیوت‌های مرتبط، شرط Prisma و facet) آماده تحویل می‌شود.
//
//   const ctx = await getFilterContext("products", await searchParams);
//   prisma.product.findMany({ where: ctx.plan.where, ... })
//   <FilterBar schemaKey="products" {...ctx.barProps} />
// ============================================================
import { getCategories } from "@/lib/categoriesService";
import {
  buildCategoryTree,
  buildCategoryIndex,
  resolveCategoryPath,
} from "@/lib/categoryTree";
import {
  resolveAttributesForPath,
  getAttributeFacets,
} from "@/lib/attributesService";
import { resolveFilterOptions } from "./options";
import { buildListQuery, buildWhereFromValues } from "./buildWhere";
import { entriesOf } from "./params";

export async function getFilterContext(schemaKey, searchParams, options = {}) {
  const {
    facetTypesToSkip = ["dynamicAttributes"],
    withFacets = true,
    attributeFilterableOnly = true,
  } = options;

  const empty = {
    tree: [],
    index: buildCategoryIndex([]),
    options: {},
    attributeDefs: [],
    attributeFacets: {},
    plan: buildListQuery(schemaKey, searchParams),
    effectiveParams: {},
    barProps: {},
  };

  try {
    // ===== درخت دسته‌بندی =====
    const flat = await getCategories();
    const tree = buildCategoryTree(flat).filter((n) => n.isActive !== false);
    const index = buildCategoryIndex(tree);

    // ===== گزینه‌های فیلترها (واژگان + کشورها) =====
    const filterOptions = await resolveFilterOptions(schemaKey);

    // ===== نرمال‌سازی پارامترها =====
    // لینک‌های قدیمی از ?category=نام&subCategory=نام استفاده می‌کردند.
    // آن‌ها را به categoryPath (slug) تبدیل می‌کنیم تا هم لینک‌های
    // قدیمی نشکنند و هم فیلتر جدید کار کند.
    const rawParams = Object.fromEntries(entriesOf(searchParams));
    const effectiveParams = { ...rawParams };
    let categoryPath = String(rawParams.categoryPath || "");

    if (!categoryPath) {
      const legacy = resolveCategoryPath(
        {
          category: rawParams.category,
          subCategory: rawParams.subCategory,
          productType: rawParams.productType,
        },
        tree
      );
      if (legacy) {
        categoryPath = legacy;
        effectiveParams.categoryPath = legacy;
      }
    }

    // ===== اتریبیوت‌های مرتبط با این دسته =====
    const attributeDefs = await resolveAttributesForPath(categoryPath, {
      filterableOnly: attributeFilterableOnly,
    });

    // ===== شرط Prisma =====
    const plan = buildListQuery(schemaKey, effectiveParams, { attributeDefs });

    // ===== facet count =====
    // برای شمارش گزینه‌ها، فیلتر خودِ اتریبیوت‌ها را نادیده می‌گیریم
    // تا کاربر بتواند گزینه‌های دیگر را هم ببیند.
    let attributeFacets = {};
    if (withFacets && attributeDefs.length > 0) {
      const facetWhere = buildWhereFromValues(schemaKey, plan.values, {
        attributeDefs,
        skipTypes: facetTypesToSkip,
      });
      attributeFacets = await getAttributeFacets(attributeDefs, facetWhere);
    }

    return {
      tree,
      index,
      options: filterOptions,
      attributeDefs,
      attributeFacets,
      categoryPath,
      plan,
      effectiveParams,
      // پروپ‌های آماده برای <FilterBar />
      barProps: {
        schemaKey,
        categoryTree: tree,
        categoryIndex: index,
        options: filterOptions,
        attributeDefs,
        attributeFacets,
      },
    };
  } catch (err) {
    console.error(`[filters] context failed for ${schemaKey}:`, err.message);
    return empty;
  }
}

// ============================================================
// نسخه‌ی سبک — فقط درخت دسته (برای هدر و انتخابگرها)
// ============================================================
export async function getCategoryTreeOnly() {
  try {
    const flat = await getCategories();
    const tree = buildCategoryTree(flat).filter((n) => n.isActive !== false);
    return { tree, index: buildCategoryIndex(tree) };
  } catch (err) {
    console.error("[filters] category tree failed:", err.message);
    return { tree: [], index: buildCategoryIndex([]) };
  }
}
