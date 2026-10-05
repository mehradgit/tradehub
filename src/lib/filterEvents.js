// src/lib/filterEvents.js
"use client";

// ============================================================
// Small event bus between the header and the page filter bars
//
// Why: the filter modal needs server-side data (options, category
// tree, attribute definitions, facets). That data only exists inside
// the page itself, not in the header. So the header does not build
// the data; it only emits an event and the page opens the modal.
// This avoids adding a new API for facets and avoids duplicating logic.
// ============================================================
import { useEffect } from "react";

export const FILTER_EVENTS = {
  // Header Filters button → open the modal of that same page
  OPEN_FILTERS: "foodhub:open-filters",
  // Fake in-page field → open the header mega search bar
  OPEN_MEGA: "foodhub:open-mega-search",
};

export function emitFilterEvent(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function useFilterEvent(name, handler) {
  useEffect(() => {
    if (!name || typeof handler !== "function") return;
    const listener = (e) => handler(e.detail);
    window.addEventListener(name, listener);
    return () => window.removeEventListener(name, listener);
  }, [name, handler]);
}
