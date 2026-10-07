// src/lib/filters/serverContext.js
// ============================================================
// Complete filter bundle for Server Components
//
// Pages simply call this and everything (category tree, options,
// related attributes, Prisma condition and facets) comes back ready.
//
//   const ctx = await getFilterContext("products", await searchParams);
//   prisma.product.findMany({ where: ctx.plan.where, ... })
//   <FilterBar schemaKey="products" {...ctx.barProps} />
// ============================================================
import { getCategories } from "@/lib/categoriesService";
import { FILTER_SCHEMAS } from "./schemas";
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
    // ===== Category tree =====
    const flat = await getCategories();
    const tree = buildCategoryTree(flat).filter((n) => n.isActive !== false);
    const index = buildCategoryIndex(tree);

    // ===== Filter options (vocabularies + countries) =====
    const filterOptions = await resolveFilterOptions(schemaKey);

    // ===== Parameter normalization =====
    // Legacy links used ?category=name&subCategory=name.
    // We convert them to categoryPath (slug) so that the old
    // links keep working and the new filter also works.
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

    // ===== Attributes related to this category =====
    const attributeDefs = await resolveAttributesForPath(categoryPath, {
      filterableOnly: attributeFilterableOnly,
    });

    // ===== Prisma condition =====
    const plan = buildListQuery(schemaKey, effectiveParams, { attributeDefs });

    // ===== facet count =====
    // فقط برای schema هایی که dynamicAttributes دارند و
    // درخت ProductAttribute را می‌شناسند (فعلاً فقط products)
    const schema = FILTER_SCHEMAS[schemaKey];
    const hasDynamicAttributes =
      schema?.fields?.some((f) => f.type === "dynamicAttributes") ?? false;

    // getAttributeFacets روی ProductAttribute کار می‌کند — پس فقط
    // وقتی معتبر است که schemaKey === "products" باشد.
    const canComputeAttributeFacets =
      withFacets &&
      schemaKey === "products" &&
      hasDynamicAttributes &&
      attributeDefs.length > 0;

    let attributeFacets = {};
    if (canComputeAttributeFacets) {
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
      // Ready-made props for <FilterBar />
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
// Lightweight version — category tree only (for the header and pickers)
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
