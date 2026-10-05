// src/components/filters/FilterSheet.js
"use client";

import { useEffect, useRef, useState } from "react";
import FilterField from "./FilterField";

// ============================================================
// Sliding filter panel
//
// Why a sheet and not a modal:
//   • It goes full screen on mobile
//   • It has Escape, scroll lock and aria (the project's old modals do not)
//   • The results stay visible at the same time
//
// Changes are kept in local state and applied to the URL all at
// once with "Apply" (not on every click).
// ============================================================
export default function FilterSheet({
  open,
  onClose,
  schema,
  values = {},
  options = {},
  counts = {},
  categoryTree = [],
  attributeDefs = [],
  attributeFacets = {},
  onApply,
  onClear,
  resultCount = null,
}) {
  const [draft, setDraft] = useState(values || {});
  const panelRef = useRef(null);

  // ===== Syncing with the URL when it opens =====
  useEffect(() => {
    if (open) setDraft(values || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ===== Scroll lock (restoring the previous value) =====
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ===== Close with Escape + move focus =====
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    const timer = setTimeout(() => panelRef.current?.focus(), 50);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open || !schema) return null;

  const fields = schema.fields || [];
  const setValue = (name, value) =>
    setDraft((d) => ({ ...d, [name]: value }));

  // These fields render their own label
  const selfLabeled = (type) =>
    type === "boolean" || type === "dynamicAttributes";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,35,28,.45)",
          zIndex: 1000,
        }}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${schema.label} filters`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          background: "#fff",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(15,35,28,.18)",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--dark)" }}>
              Filters
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
              {schema.label}
              {resultCount !== null ? ` · ${resultCount} results` : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            style={{
              border: "1px solid var(--line)",
              background: "#fff",
              borderRadius: "9px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>
          <div style={{ display: "grid", gap: "18px" }}>
            {fields.map((field) => (
              <div key={field.name}>
                {!selfLabeled(field.type) && (
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: ".4px",
                    }}
                  >
                    {field.type === "sort" ? "Sort by" : field.label}
                  </label>
                )}

                <FilterField
                  field={field}
                  value={draft[field.name]}
                  options={options[field.name] || field.options || []}
                  counts={counts[field.name] || {}}
                  onChange={(v) => setValue(field.name, v)}
                  categoryTree={categoryTree}
                  attributeDefs={attributeDefs}
                  attributeFacets={attributeFacets}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "14px 18px",
            borderTop: "1px solid var(--line)",
            background: "#fafcfb",
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClear?.();
              onClose?.();
            }}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "10px",
              border: "1px solid var(--line)",
              background: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            Clear all
          </button>

          <button
            type="button"
            onClick={() => {
              onApply?.(draft);
              onClose?.();
            }}
            style={{
              flex: 2,
              padding: "11px",
              borderRadius: "10px",
              border: "1px solid var(--green2)",
              background: "var(--green2)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Apply filters
          </button>
        </div>
      </aside>
    </>
  );
}
