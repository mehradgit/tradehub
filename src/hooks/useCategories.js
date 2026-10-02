// src/hooks/useCategories.js
"use client";

import { useEffect, useState } from "react";
import { categories as defaultCategories } from "@/lib/categories";

// Cache سطح ماژول برای جلوگیری از fetch تکراری
let cache = null;
let cachePromise = null;

export function useCategories() {
  const [categories, setCategories] = useState(cache || defaultCategories);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setCategories(cache);
      setLoading(false);
      return;
    }

    if (!cachePromise) {
      cachePromise = fetch("/api/categories")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          cache = data?.categories || [];
          return cache;
        })
        .catch(() => {
          cache = [];
          return [];
        });
    }

    cachePromise.then((list) => {
      // اگر API چیزی برگردوند، از آن استفاده کن؛ وگرنه fallback به استاتیک
      setCategories(list && list.length > 0 ? list : defaultCategories);
      setLoading(false);
    });
  }, []);

  return { categories, loading };
}

/**
 * پاک کردن cache — بعد از تغییرات ادمین مفید است
 */
export function invalidateCategoriesCache() {
  cache = null;
  cachePromise = null;
}