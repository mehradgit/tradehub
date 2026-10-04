// src/components/filters/FilterSheet.js
"use client";

import { useEffect, useRef, useState } from "react";
import FilterField from "./FilterField";

// ============================================================
// پنل کشویی فیلترها
//
// چرا sheet و نه modal:
//   • روی موبایل تمام‌صفحه می‌شود
//   • Escape، قفل اسکرول و aria دارد (مودال‌های قدیمی پروژه ندارند)
//   • می‌شود همزمان نتیجه را دید
//
// تغییرات در state محلی نگه داشته می‌شوند و با «Apply» یک‌جا
// روی URL اعمال می‌شوند (نه با هر کلیک).
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

  // ===== همگام‌سازی با URL هنگام باز شدن =====
  useEffect(() => {
    if (open) setDraft(values || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ===== قفل اسکرول (با بازگرداندن مقدار قبلی) =====
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ===== بستن با Escape + انتقال فوکوس =====
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

  // این فیلدها برچسب خودشان را رندر می‌کنند
  const selfLabeled = (type) =>
    type === "boolean" || type === "dynamicAttributes";

  return (
    <>
      {/* پس‌زمینه */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,35,28,.45)",
          zIndex: 1000,
        }}
      />

      {/* پنل */}
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
        {/* سربرگ */}
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

        {/* بدنه */}
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

        {/* پایین */}
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
