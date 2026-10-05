// src/hooks/useFilterParams.js
"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FILTER_SCHEMAS } from "@/lib/filters/schemas";
import {
  readFilterValues,
  buildUrl,
  clearFilterParams,
  countActiveFilters,
  filtersToParams,
} from "@/lib/filters/params";

// ============================================================
// A shared hook for all filterable pages
//
// The URL is the source of truth; this hook only reads and navigates.
// ============================================================
export function useFilterParams(schemaKey) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const schema = FILTER_SCHEMAS[schemaKey] || null;
  const fields = schema?.fields || [];

  const values = useMemo(
    () => readFilterValues(fields, searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schemaKey, searchParams]
  );

  // ===== Apply several changes at once (a single navigation) =====
  const apply = useCallback(
    (updates = {}, { resetPage = true } = {}) => {
      const url = buildUrl(pathname, searchParams, updates, { resetPage });
      router.push(url, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // ===== Replace all filters (the panel's "Apply" button) =====
  const applyValues = useCallback(
    (nextValues = {}) => {
      const params = filtersToParams(nextValues, fields);
      params.set("page", "1");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, fields]
  );

  // ===== Clear all (sort is preserved) =====
  const clearAll = useCallback(() => {
    const updates = clearFilterParams(fields, { keepSort: true });

    // Attributes use the attr_ prefix and must be removed separately
    const url = new URL(window.location.href);
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("attr_")) url.searchParams.delete(key);
    }

    const base = buildUrl(pathname, new URLSearchParams(url.searchParams), updates);
    router.push(base, { scroll: false });
  }, [router, pathname, fields]);

  // ===== Remove a specific filter =====
  const removeFilter = useCallback(
    (fieldName) => {
      const field = fields.find((f) => f.name === fieldName);
      if (!field) return;

      if (field.type === "numberRange") {
        apply({
          [field.minParam || `${field.name}Min`]: "",
          [field.maxParam || `${field.name}Max`]: "",
        });
        return;
      }
      if (field.type === "dynamicAttributes") {
        const url = new URL(window.location.href);
        for (const key of [...url.searchParams.keys()]) {
          if (key.startsWith("attr_")) url.searchParams.delete(key);
        }
        router.push(
          `${pathname}?${url.searchParams.toString()}`,
          { scroll: false }
        );
        return;
      }
      apply({ [field.name]: "" });
    },
    [apply, fields, router, pathname]
  );

  const activeCount = useMemo(
    () => countActiveFilters(values, { includeSearch: false, includeSort: false }),
    [values]
  );

  return {
    schema,
    fields,
    values,
    apply,
    applyValues,
    clearAll,
    removeFilter,
    activeCount,
    pathname,
    searchParams,
  };
}

export default useFilterParams;
