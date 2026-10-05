// src/components/filters/FilterBar.js
"use client";

import { useCallback, useState } from "react";
import { useFilterParams } from "@/hooks/useFilterParams";
import { FILTER_EVENTS, emitFilterEvent, useFilterEvent } from "@/lib/filterEvents";
import FilterModal from "./FilterModal";
import ActiveFilterChips from "./ActiveFilterChips";

// ============================================================
// Page filter bar — the in-page search has been removed
//
// Site-wide search lives in the header (mega search). Here we only have:
//   • A "fake" field that opens the header mega search when clicked
//   • The Filters button, which opens the modal directly
//   • The active filter chips
//   • The modal itself (the filter data comes from the server, so it is built here)
//
// The header has no filter data, so it only emits an event and this component
// opens the modal — that is why facets and options work correctly.
// ============================================================
export default function FilterBar({
  schemaKey,
  categoryTree = [],
  categoryIndex = null,
  options = {},
  counts = {},
  attributeDefs = [],
  attributeFacets = {},
  resultCount = null,
}) {
  const {
    schema,
    values,
    applyValues,
    clearAll,
    removeFilter,
    activeCount,
  } = useFilterParams(schemaKey);

  const [modalOpen, setModalOpen] = useState(false);

  // Header Filters button → open this same modal
  const openFromHeader = useCallback(() => {
    if (!schema) return;
    setModalOpen(true);
  }, [schema]);

  useFilterEvent(FILTER_EVENTS.OPEN_FILTERS, openFromHeader);

  if (!schema) return null;

  const label = schema.label || "results";

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* ================= Fake field + filters button ================= */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        {/* Not a real search box; it only opens the header mega search */}
        <button
          type="button"
          onClick={() => emitFilterEvent(FILTER_EVENTS.OPEN_MEGA)}
          aria-label={`Search ${label}`}
          style={{
            flex: "1 1 260px",
            minWidth: "200px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fff",
            border: "1.5px solid var(--line)",
            borderRadius: "50px",
            padding: "11px 18px",
            fontSize: "13px",
            fontFamily: "inherit",
            color: "#9aa8a3",
            cursor: "text",
            textAlign: "left",
            boxShadow: "0 2px 8px rgba(11,50,40,.04)",
          }}
        >
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "13px" }}></i>
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Search {label.toLowerCase()}…
          </span>
          <span
            style={{
              background: "#eaf7f1",
              color: "var(--primary, #13795b)",
              borderRadius: "50px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 800,
              flex: "0 0 auto",
            }}
          >
            {label}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
            fontSize: "13px",
            padding: "11px 17px",
            borderRadius: "50px",
            cursor: "pointer",
            fontFamily: "inherit",
            border: `1.5px solid ${activeCount > 0 ? "#bfe3d3" : "var(--line)"}`,
            background: activeCount > 0 ? "#eaf7f1" : "#fff",
            color: activeCount > 0 ? "var(--primary, #13795b)" : "var(--dark)",
            flex: "0 0 auto",
          }}
        >
          <i className="fa-solid fa-sliders"></i>
          Filters
          {activeCount > 0 && (
            <span
              style={{
                background: "var(--green2, #15966f)",
                color: "#fff",
                borderRadius: "50px",
                padding: "1px 7px",
                fontSize: "10.5px",
                fontWeight: 800,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ================= Active chips ================= */}
      <ActiveFilterChips
        schema={schema}
        values={values}
        options={options}
        categoryIndex={categoryIndex}
        attributeDefs={attributeDefs}
        onRemove={removeFilter}
      />

      {/* ================= Modal ================= */}
      <FilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        schema={schema}
        values={values}
        options={options}
        counts={counts}
        categoryTree={categoryTree}
        categoryIndex={categoryIndex}
        attributeDefs={attributeDefs}
        attributeFacets={attributeFacets}
        onApply={applyValues}
        onClear={clearAll}
        resultCount={resultCount}
      />
    </div>
  );
}
