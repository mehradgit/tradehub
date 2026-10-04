// src/components/filters/FilterModal.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FilterField, { DynamicAttributeField } from "./FilterField";

// ============================================================
// مدال فیلترها — دو سطح
//
//   سطح ۱: فهرست گروه‌ها (هر ردیف = یک فیلتر + مقدار فعلی)
//   سطح ۲: پارامترهای همان فیلتر — **جایگزین** سطح ۱ می‌شود
//
// چرا جایگزین و نه روی‌هم‌افتاده: کاربر همیشه در بافت فهرست
// می‌ماند؛ ← / Escape / کلیک بیرون / Apply همه به فهرست برمی‌گردند.
//
// تغییرات در draft نگه داشته می‌شوند و با «Show results» یک‌جا
// روی URL اعمال می‌شوند — نه با هر کلیک.
// ============================================================

// آیکن هر فیلتر بر اساس نامش (اسکیما آیکن ندارد)
const ICONS = {
  categoryPath: "fa-sitemap",
  origin: "fa-globe",
  country: "fa-globe",
  deliveryCountry: "fa-truck-fast",
  price: "fa-tag",
  quantity: "fa-weight-hanging",
  unit: "fa-scale-balanced",
  incoterms: "fa-ship",
  paymentTerms: "fa-credit-card",
  certifications: "fa-certificate",
  packaging: "fa-box-open",
  packagingReq: "fa-box-open",
  businessType: "fa-building",
  businessTypes: "fa-building",
  role: "fa-user-tag",
  isUrgent: "fa-bolt",
  hasProducts: "fa-box",
  hasRequests: "fa-inbox",
  dynamicAttributes: "fa-list-check",
};

function iconFor(field) {
  return ICONS[field.name] || ICONS[field.type] || "fa-filter";
}

// ============================================================
// خلاصه‌ی مقدار یک فیلتر (برای نمایش در ردیف سطح ۱ و چیپ‌ها)
// ============================================================
export function summarizeField(field, value, options = {}, categoryIndex = null) {
  if (value === undefined || value === null || value === "") return "";

  if (field.type === "numberRange") {
    const hasMin = value?.min !== undefined && value?.min !== "";
    const hasMax = value?.max !== undefined && value?.max !== "";
    if (!hasMin && !hasMax) return "";
    return `${hasMin ? value.min : "…"} – ${hasMax ? value.max : "…"}${
      field.unit ? ` ${field.unit}` : ""
    }`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const list = options[field.name] || field.options || [];
    return value
      .map((v) => list.find((o) => String(o.value) === String(v))?.label ?? v)
      .join(", ");
  }

  if (field.type === "boolean") return value === true ? "Yes" : "";

  if (field.type === "categoryCascader") {
    const parts = String(value).split("/").filter(Boolean);
    const names = parts.map((slug, i) => {
      const path = parts.slice(0, i + 1).join("/");
      return categoryIndex?.byPath?.get(path)?.name || slug.replace(/-/g, " ");
    });
    return names.join(" › ");
  }

  if (typeof value === "object") return "";

  const list = options[field.name] || field.options || [];
  return list.find((o) => String(o.value) === String(value))?.label ?? String(value);
}

// ============================================================
export default function FilterModal({
  open,
  onClose,
  schema,
  values = {},
  options = {},
  counts = {},
  categoryTree = [],
  categoryIndex = null,
  attributeDefs = [],
  attributeFacets = {},
  onApply,
  onClear,
  resultCount = null,
}) {
  const [draft, setDraft] = useState(values || {});
  const [openKey, setOpenKey] = useState(null); // کلید فیلترِ باز در سطح ۲
  const [subValue, setSubValue] = useState(undefined); // مقدار موقت سطح ۲
  const panelRef = useRef(null);

  // ===== همگام‌سازی با URL هنگام باز شدن =====
  useEffect(() => {
    if (open) {
      setDraft(values || {});
      setOpenKey(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ===== قفل اسکرول =====
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ===== Escape: از سطح ۲ به سطح ۱، از سطح ۱ به بستن =====
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (openKey) setOpenKey(null);
      else onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openKey, onClose]);

  const fields = useMemo(
    () => (schema?.fields || []).filter((f) => f.type !== "sort"),
    [schema]
  );
  const attrField = useMemo(
    () => (schema?.fields || []).find((f) => f.type === "dynamicAttributes"),
    [schema]
  );
  const attrMap = (attrField && draft[attrField.name]) || {};

  // ===== ردیف‌های سطح ۱ =====
  const rows = useMemo(() => {
    const out = [];
    for (const f of fields) {
      if (f.type === "dynamicAttributes") continue;
      out.push({ kind: "field", key: f.name, field: f, label: f.label, icon: iconFor(f) });
    }
    if (attributeDefs.length > 0 && attrField) {
      out.push({ kind: "section", key: "__specs", label: "Specifications" });
      for (const def of attributeDefs) {
        out.push({
          kind: "attr",
          key: `attr_${def.id}`,
          def,
          label: def.label,
          icon: "fa-list-check",
        });
      }
    }
    return out;
  }, [fields, attributeDefs, attrField]);

  if (!open || !schema) return null;

  // ===== مقدار هر ردیف در سطح ۱ =====
  const rowSummary = (row) => {
    if (row.kind === "field") {
      return summarizeField(row.field, draft[row.field.name], options, categoryIndex);
    }
    if (row.kind === "attr") {
      const v = attrMap[row.def.id];
      if (v === undefined || v === null || v === "") return "";
      if (Array.isArray(v)) return v.length ? v.join(", ") : "";
      if (typeof v === "object") {
        const a = v.min !== "" && v.min !== undefined ? v.min : "…";
        const b = v.max !== "" && v.max !== undefined ? v.max : "…";
        return `${a} – ${b}${row.def.unit ? ` ${row.def.unit}` : ""}`;
      }
      if (v === true) return "Yes";
      const list = row.def.options || [];
      return list.find((o) => String(o.value ?? o) === String(v))?.label ?? String(v);
    }
    return "";
  };

  const setDraftValue = (name, v) =>
    setDraft((d) => {
      const next = { ...d };
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
        delete next[name];
      } else {
        next[name] = v;
      }
      return next;
    });

  // ===== باز کردن سطح ۲ =====
  const openSub = (row) => {
    setOpenKey(row.key);
    if (row.kind === "field") setSubValue(draft[row.field.name]);
    else setSubValue(attrMap[row.def.id]);
  };

  // ===== ثبت مقدار سطح ۲ در draft =====
  const commitSub = () => {
    const row = rows.find((r) => r.key === openKey);
    if (!row) return;

    if (row.kind === "field") {
      setDraftValue(row.field.name, subValue);
    } else {
      const next = { ...attrMap };
      if (subValue === undefined || subValue === "" || (Array.isArray(subValue) && subValue.length === 0)) {
        delete next[row.def.id];
      } else {
        next[row.def.id] = subValue;
      }
      if (attrField) {
        setDraft((d) => {
          const copy = { ...d };
          if (Object.keys(next).length === 0) delete copy[attrField.name];
          else copy[attrField.name] = next;
          return copy;
        });
      }
    }
    setOpenKey(null);
  };

  const activeRow = rows.find((r) => r.key === openKey) || null;

  // ============================================================
  return (
    <>
      <div onClick={() => (openKey ? setOpenKey(null) : onClose?.())} style={S.overlay} />

      <div style={S.center}>
        {/* ============ سطح ۲ ============ */}
        {activeRow ? (
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label={activeRow.label} style={{ ...S.modal, ...S.modalNarrow }}>
            <div style={S.head}>
              <button type="button" onClick={() => setOpenKey(null)} aria-label="Back to filters" style={S.backBtn}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <div style={S.headText}>
                <h3 style={S.h3}>{activeRow.label}</h3>
                <p style={S.sub}>
                  {activeRow.kind === "attr"
                    ? activeRow.def.dataType === "multiSelect"
                      ? "Choose one or more"
                      : activeRow.def.dataType === "number"
                      ? "Set a range"
                      : "Set a value"
                    : activeRow.field.type === "multiSelect"
                    ? "Choose one or more"
                    : activeRow.field.type === "numberRange"
                    ? "Set a range"
                    : activeRow.field.type === "categoryCascader"
                    ? "Category › sub-category › product type"
                    : "Set a value"}
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={S.xBtn}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ ...S.body, padding: "16px 20px" }}>
              {activeRow.kind === "field" ? (
                <FilterField
                  field={activeRow.field}
                  value={subValue}
                  options={options[activeRow.field.name] || activeRow.field.options || []}
                  counts={counts[activeRow.field.name] || {}}
                  onChange={setSubValue}
                  categoryTree={categoryTree}
                />
              ) : (
                <DynamicAttributeField
                  def={activeRow.def}
                  value={subValue}
                  facet={attributeFacets?.[activeRow.def.id]}
                  onChange={setSubValue}
                />
              )}
            </div>

            <div style={S.foot}>
              <button type="button" style={S.btnGhost} onClick={() => setSubValue(activeRow.kind === "attr" && (activeRow.def.dataType === "multiSelect") ? [] : (activeRow.kind === "field" && activeRow.field.type === "multiSelect" ? [] : ""))}>
                Clear
              </button>
              <button type="button" style={S.btnPrimary} onClick={commitSub}>
                Apply
              </button>
            </div>
          </div>
        ) : (
          /* ============ سطح ۱ ============ */
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Filters" style={S.modal}>
            <div style={S.head}>
              <div style={S.headIcon}>
                <i className="fa-solid fa-sliders"></i>
              </div>
              <div style={S.headText}>
                <h3 style={S.h3}>Filters</h3>
                <p style={S.sub}>
                  {resultCount !== null ? `${resultCount} results · ` : ""}
                  {schema.label}
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={S.xBtn}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={S.body}>
              {rows.map((row) =>
                row.kind === "section" ? (
                  <div key={row.key} style={S.sectionLabel}>
                    {row.label}
                  </div>
                ) : (
                  <button key={row.key} type="button" onClick={() => openSub(row)} style={S.row}>
                    <span style={S.rowIcon}>
                      <i className={`fa-solid ${row.icon}`}></i>
                    </span>
                    <span style={S.rowText}>
                      <b style={S.rowTitle}>{row.label}</b>
                      <small style={rowSummary(row) ? S.rowValueSet : S.rowValue}>
                        {rowSummary(row) || "Any"}
                      </small>
                    </span>
                    <i className="fa-solid fa-chevron-right" style={S.chev}></i>
                  </button>
                )
              )}
            </div>

            <div style={S.foot}>
              <button
                type="button"
                style={{ ...S.btnGhost, color: "var(--muted)" }}
                onClick={() => {
                  setDraft({});
                  onClear?.();
                }}
              >
                Clear all
              </button>
              <button
                type="button"
                style={S.btnPrimary}
                onClick={() => {
                  onApply?.(draft);
                  onClose?.();
                }}
              >
                Show {resultCount !== null ? resultCount : ""} results
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// استایل‌ها (inline، هم‌خوان با بقیه‌ی پروژه)
// ============================================================
const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(9,32,26,.5)",
    zIndex: 1200,
    backdropFilter: "blur(2px)",
  },
  center: {
    position: "fixed",
    inset: 0,
    zIndex: 1201,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "70px 16px 24px",
    overflowY: "auto",
    pointerEvents: "none",
  },
  modal: {
    pointerEvents: "auto",
    background: "#fff",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "620px",
    boxShadow: "0 24px 60px rgba(11,50,40,.24)",
    overflow: "hidden",
    marginBottom: "40px",
  },
  modalNarrow: { maxWidth: "470px" },
  head: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "17px 20px",
    borderBottom: "1px solid var(--line)",
  },
  headIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#eaf7f1",
    color: "var(--primary, #13795b)",
    display: "grid",
    placeItems: "center",
    fontSize: "13px",
    flex: "0 0 auto",
  },
  headText: { flex: 1, minWidth: 0 },
  h3: { margin: 0, fontSize: "15.5px", fontWeight: 800, color: "var(--dark)" },
  sub: { margin: "2px 0 0", fontSize: "11.5px", color: "var(--muted)" },
  xBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--muted)",
    cursor: "pointer",
    flex: "0 0 auto",
  },
  backBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--dark)",
    cursor: "pointer",
    flex: "0 0 auto",
  },
  body: { maxHeight: "56vh", overflowY: "auto", padding: "8px 0" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    padding: "13px 20px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  rowIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#eaf7f1",
    color: "var(--primary, #13795b)",
    display: "grid",
    placeItems: "center",
    fontSize: "13px",
    flex: "0 0 auto",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { display: "block", fontSize: "13.5px", fontWeight: 600, color: "var(--dark)" },
  rowValue: {
    display: "block",
    color: "var(--muted)",
    fontSize: "11.5px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "380px",
  },
  rowValueSet: {
    display: "block",
    color: "var(--primary, #13795b)",
    fontWeight: 700,
    fontSize: "11.5px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "380px",
  },
  chev: { color: "#c3cec9", fontSize: "12px", flex: "0 0 auto" },
  sectionLabel: {
    padding: "14px 20px 7px",
    fontSize: "10.5px",
    fontWeight: 800,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: ".7px",
    borderTop: "1px solid var(--line)",
    marginTop: "6px",
  },
  foot: {
    display: "flex",
    gap: "10px",
    padding: "14px 20px",
    borderTop: "1px solid var(--line)",
    background: "#fafcfb",
  },
  btnGhost: {
    borderRadius: "10px",
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: 700,
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--dark)",
    cursor: "pointer",
  },
  btnPrimary: {
    flex: 1,
    borderRadius: "10px",
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: 700,
    border: "1px solid var(--green2, #15966f)",
    background: "var(--green2, #15966f)",
    color: "#fff",
    cursor: "pointer",
  },
};
