// src/components/layout/HeaderSearch.js
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useVocabularies } from "@/hooks/useVocabularies";
import { countries } from "@/lib/countries";
import { FILTER_SCHEMAS } from "@/lib/filters/schemas";
import { readFilterValues } from "@/lib/filters/params";
import { FILTER_EVENTS, useFilterEvent } from "@/lib/filterEvents";
import { summarizeField } from "@/components/filters/FilterModal";

// ============================================================
// Mega search — the single search and filter entry point for the whole site
//
//   • Default state: a small field in the header
//   • On click/focus or pressing "/" → the large bar opens and takes focus
//   • Inside the bar: input + scope selector + sort + Filters + chips
//   • The Filters button holds no filter data; it dispatches an event and the
//     modal of the same page (which owns the server data) opens.
// ============================================================

// Site sections that have a filter engine
const SECTIONS = [
  { prefix: "/products", schemaKey: "products", path: "/products", label: "Products" },
  { prefix: "/requests", schemaKey: "requests", path: "/requests", label: "Buying Requests" },
  { prefix: "/profiles", schemaKey: "profiles", path: "/profiles", label: "Companies" },
];

function detectSection(pathname = "") {
  return SECTIONS.find((s) => pathname.startsWith(s.prefix)) || null;
}

export default function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tree } = useCategories();
  const { vocabularies } = useVocabularies();

  const section = detectSection(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scopeOpen, setScopeOpen] = useState(false);
  const inputRef = useRef(null);
  const scopeRef = useRef(null);

  // ===== Current section schema + filter values from the URL =====
  const schema = section ? FILTER_SCHEMAS[section.schemaKey] : null;

  const values = useMemo(() => {
    if (!schema) return {};
    try {
      return readFilterValues(schema.fields, searchParams);
    } catch {
      return {};
    }
  }, [schema, searchParams]);

  // ===== Options for chip labels (vocabularies + countries) =====
  const headerOptions = useMemo(() => {
    const out = {};
    if (!schema) return out;
    for (const f of schema.fields) {
      if (f.optionsFrom === "countries") {
        out[f.name] = (countries || []).map((c) => ({
          value: c.name,
          label: c.name,
          code: c.code,
        }));
      } else if (f.optionsFrom) {
        out[f.name] = vocabularies?.[f.optionsFrom] || [];
      } else if (f.type === "sort") {
        out[f.name] = schema.sortOptions || [];
      }
    }
    return out;
  }, [schema, vocabularies]);

  const sortValue =
    (schema && (values?.sort || searchParams.get("sort"))) || "";

  // ===== Keep the input in sync with the URL =====
  useEffect(() => {
    if (!section) return;
    setQuery(searchParams.get("search") || searchParams.get("q") || "");
  }, [section, pathname, searchParams]);

  // ===== Open/close =====
  const openBar = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 320);
  }, []);

  const closeBar = () => {
    setIsOpen(false);
    setScopeOpen(false);
  };

  // Synthetic in-page field → opens this same bar
  useFilterEvent(FILTER_EVENTS.OPEN_MEGA, openBar);

  // "/" keyboard shortcut
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/") return;
      const t = document.activeElement?.tagName || "";
      if (/INPUT|SELECT|TEXTAREA/.test(t)) return;
      e.preventDefault();
      openBar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openBar]);

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (scopeOpen) setScopeOpen(false);
        else closeBar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, scopeOpen]);

  // Click outside the scope selector
  useEffect(() => {
    const onDown = (e) => {
      if (scopeRef.current && !scopeRef.current.contains(e.target)) {
        setScopeOpen(false);
      }
    };
    if (scopeOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [scopeOpen]);

  // ===== Navigation =====
  const goToSection = (s, extra = {}) => {
    const params = new URLSearchParams();
    const q = (extra.search !== undefined ? extra.search : query).trim();
    if (q) params.set("search", q);
    if (extra.sort) params.set("sort", extra.sort);
    params.set("page", "1");
    router.push(`${s.path}?${params.toString()}`);
    closeBar();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (section) {
      // Current filters are preserved; only search changes
      const params = new URLSearchParams(searchParams.toString());
      const q = query.trim();
      if (q) params.set("search", q);
      else params.delete("search");
      params.set("page", "1");
      router.push(`${section.path}?${params.toString()}`);
      closeBar();
      return;
    }
    if (query.trim()) {
      goToSection(SECTIONS[0], { search: query });
    } else {
      inputRef.current?.focus();
    }
  };

  const handleScope = (s) => {
    setScopeOpen(false);
    goToSection(s);
  };

  const handleSort = (v) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("sort", v);
    else params.delete("sort");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // ===== Active filter chips (schema fields) =====
  const chips = useMemo(() => {
    if (!schema) return [];
    const out = [];
    for (const f of schema.fields) {
      if (f.type === "sort" || f.type === "dynamicAttributes") continue;
      const text = summarizeField(f, values[f.name], headerOptions, null);
      if (text) out.push({ key: f.name, label: f.label, text });
    }
    return out;
  }, [schema, values, headerOptions]);

  const activeCount = chips.length;

  return (
    <>
      {/* ==================== Small field ====================
          On wide screens it appears next to the round icon; on narrower ones
          it is hidden and only the icon remains (the icon is always there). */}
      <button
        type="button"
        className="hs-mini"
        onClick={openBar}
        aria-label="Open search"
        aria-expanded={isOpen}
      >
        <i className="fa-solid fa-magnifying-glass" />
        <span className="hs-mini-ph">
          {section ? `Search ${section.label.toLowerCase()}…` : "Search…"}
        </span>
      </button>

      {/* Round icon — always visible (on mobile it is the only way in) */}
      <button
        type="button"
        className={`hs-toggle ${isOpen ? "active" : ""}`}
        onClick={() => (isOpen ? closeBar() : openBar())}
        aria-label="Toggle search"
        aria-expanded={isOpen}
        aria-controls="hs-search-bar"
      >
        <i className="fa-solid fa-magnifying-glass hs-icon-search" />
        <i className="fa-solid fa-xmark hs-icon-close" />
      </button>

      {/* ==================== Mega bar ==================== */}
      <div id="hs-search-bar" className={`hs-bar ${isOpen ? "open" : ""}`} role="search">
        <div className="container">
          <form className="hs-pill" onSubmit={handleSubmit}>
            <i className="fa-solid fa-magnifying-glass hs-pill-icon" />

            <input
              ref={inputRef}
              type="text"
              className="hs-input"
              placeholder={
                section ? `Search ${section.label.toLowerCase()}…` : "Search the marketplace…"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />

            <span className="hs-divider" />

            {/* ---------- Scope selector ---------- */}
            <div className="hs-scope" ref={scopeRef}>
              <button
                type="button"
                className="hs-scope-btn"
                onClick={() => setScopeOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={scopeOpen}
              >
                <i className="fa-solid fa-layer-group" />
                <span>{section ? section.label : "All"}</span>
                <i className="fa-solid fa-chevron-down hs-scope-chev" />
              </button>

              {scopeOpen && (
                <ul className="hs-scope-menu" role="listbox">
                  {SECTIONS.map((s) => (
                    <li
                      key={s.schemaKey}
                      role="option"
                      aria-selected={section?.schemaKey === s.schemaKey}
                      className={section?.schemaKey === s.schemaKey ? "selected" : ""}
                      onClick={() => handleScope(s)}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span className="hs-divider" />

            {/* ---------- Sort ---------- */}
            {section && (
              <>
                <select
                  className="hs-sort"
                  value={sortValue}
                  onChange={(e) => handleSort(e.target.value)}
                  aria-label="Sort by"
                >
                  <option value="">Sort: default</option>
                  {(schema?.sortOptions || []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label ?? o.value}
                    </option>
                  ))}
                </select>
                <span className="hs-divider" />
              </>
            )}

            {/* ---------- Filters button → same-page modal ---------- */}
            {section && (
              <button
                type="button"
                className={`hs-filters ${activeCount > 0 ? "on" : ""}`}
                onClick={() => {
                  closeBar();
                  window.dispatchEvent(new CustomEvent(FILTER_EVENTS.OPEN_FILTERS));
                }}
              >
                <i className="fa-solid fa-sliders" />
                Filters
                {activeCount > 0 && <span className="hs-badge">{activeCount}</span>}
              </button>
            )}

            <button type="submit" className="hs-submit">
              <i className="fa-solid fa-magnifying-glass" />
              <span>Search</span>
            </button>
          </form>

          {/* ---------- Status + chips ---------- */}
          <div className="hs-meta">
            {section ? (
              <span>
                Searching <strong>{section.label}</strong>
                {activeCount > 0 ? ` · ${activeCount} filter${activeCount > 1 ? "s" : ""}` : ""}
              </span>
            ) : (
              <span>
                Global search — pick a section above to use its filters
              </span>
            )}

            {chips.map((c) => (
              <span key={c.key} className="hs-chip">
                <span>
                  {c.label}: {c.text}
                </span>
              </span>
            ))}

            {activeCount === 0 && section && (
              <span className="hs-chip ghost">No filters yet — open Filters</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
