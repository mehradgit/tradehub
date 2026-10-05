// src/hooks/useCategories.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { categories as defaultCategories } from "@/lib/categories";
import { buildCategoryTree, buildCategoryIndex } from "@/lib/categoryTree";

// Module-level cache to avoid duplicate fetches
let cache = null; // { categories, tree, flat }
let cachePromise = null;

const FALLBACK = (() => {
  const tree = buildCategoryTree(defaultCategories);
  return {
    categories: defaultCategories,
    tree,
    flat: buildCategoryIndex(tree).flat,
  };
})();

export function useCategories() {
  const [data, setData] = useState(cache || FALLBACK);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setData(cache);
      setLoading(false);
      return;
    }

    if (!cachePromise) {
      cachePromise = fetch("/api/categories")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          const list = payload?.categories || [];
          const tree =
            payload?.tree?.length > 0
              ? payload.tree
              : buildCategoryTree(list.length ? list : defaultCategories);

          cache = {
            categories: list.length ? list : defaultCategories,
            tree,
            flat: payload?.flat?.length ? payload.flat : buildCategoryIndex(tree).flat,
          };
          return cache;
        })
        .catch(() => {
          cache = FALLBACK;
          return FALLBACK;
        });
    }

    cachePromise.then((c) => {
      setData(c);
      setLoading(false);
    });
  }, []);

  // ===== Index and helpers =====
  const index = useMemo(() => buildCategoryIndex(data.tree || []), [data.tree]);

  return {
    categories: data.categories || [],
    tree: data.tree || [],
    flat: data.flat || [],
    index,
    loading,
  };
}

/**
 * Clear the cache — useful after admin changes
 */
export function invalidateCategoriesCache() {
  cache = null;
  cachePromise = null;
}
