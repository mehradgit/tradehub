// src/components/filters/FilterField.js
"use client";

import { useState } from "react";
import CategoryCascader from "./CategoryCascader";
import CountryFlag from "@/components/ui/CountryFlag";

// آستانه‌ی نمایش کادر جست‌وجو: لیست‌های بلند (کشورها ~۲۰۰ مورد)
// بدون جست‌وجو غیرقابل‌استفاده‌اند، ولی برای ۳ گزینه لازم نیست.
const SEARCH_THRESHOLD = 8;

const inputStyle = {
  width: "100%",
  padding: "8px 11px",
  border: "1px solid var(--line)",
  borderRadius: "8px",
  fontSize: "11px",
  fontFamily: "inherit",
  color: "var(--text)",
  background: "#fff",
  outline: "none",
};

const optionRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "5px 0",
  fontSize: "11px",
  cursor: "pointer",
  color: "var(--text)",
};

// ===== کادر جست‌وجوی داخل لیست گزینه‌ها =====
const listSearchStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid var(--line)",
  borderRadius: "8px",
  padding: "7px 10px",
  marginBottom: "7px",
  background: "#fff",
};

const listSearchInputStyle = {
  flex: 1,
  border: 0,
  outline: 0,
  background: "transparent",
  fontSize: "11.5px",
  fontFamily: "inherit",
  color: "var(--text)",
  minWidth: 0,
};

const listClearStyle = {
  border: 0,
  background: "transparent",
  color: "var(--muted)",
  cursor: "pointer",
  padding: 0,
  lineHeight: 1,
};

function OptionCount({ count }) {
  if (count === undefined || count === null) return null;
  return (
    <span style={{ color: "var(--muted)", fontSize: "10px" }}>({count})</span>
  );
}

// ============================================================
// لیست چک‌باکسی با شمارش (facet) + جست‌وجو + پرچم
//
// • لیست‌های بلند (کشورها) بدون جست‌وجو غیرقابل‌استفاده‌اند
// • گزینه‌ای که code دارد (کشور) پرچم هم نشان می‌دهد
// • گزینه‌های انتخاب‌شده حتی وقتی با عبارت جست‌وجو نمی‌خوانند
//   دیده می‌شوند تا کاربر بتواند حذفشان کند
// ============================================================
function MultiSelectList({ options = [], value = [], onChange, counts = {} }) {
  const [term, setTerm] = useState("");
  const selected = Array.isArray(value) ? value : [];
  const selectedSet = new Set(selected.map(String));

  const toggle = (optionValue) => {
    const v = String(optionValue);
    const next = selectedSet.has(v)
      ? selected.filter((s) => String(s) !== v)
      : [...selected, v];
    onChange(next);
  };

  if (options.length === 0) {
    return (
      <p style={{ fontSize: "10px", color: "var(--muted)", margin: 0 }}>
        No options configured yet.
      </p>
    );
  }

  const q = term.trim().toLowerCase();
  const shown = q
    ? options.filter(
        (o) =>
          String(o.label ?? o.value).toLowerCase().includes(q) ||
          selectedSet.has(String(o.value))
      )
    : options;

  return (
    <div>
      {options.length >= SEARCH_THRESHOLD && (
        <div style={listSearchStyle}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ color: "#9aa8a3", fontSize: "11px" }}
          ></i>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search…"
            aria-label="Search options"
            style={listSearchInputStyle}
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear search"
              style={listClearStyle}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      )}

      <div
        style={{
          maxHeight: "230px",
          overflowY: "auto",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "7px 10px",
          background: "#fff",
        }}
      >
        {shown.length === 0 ? (
          <p style={{ fontSize: "11px", color: "var(--muted)", margin: "6px 2px" }}>
            No match for “{term}”.
          </p>
        ) : (
          shown.map((opt) => {
            const v = String(opt.value);
            const count = counts?.[v];
            return (
              <label key={v} style={optionRowStyle}>
                <input
                  type="checkbox"
                  checked={selectedSet.has(v)}
                  onChange={() => toggle(v)}
                />
                {/* پرچم — فقط وقتی گزینه کد کشور دارد */}
                {opt.code && <CountryFlag countryCode={opt.code} size="18px" />}
                <span style={{ flex: 1 }}>{opt.label ?? opt.value}</span>
                <OptionCount count={count} />
              </label>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <p style={{ fontSize: "10px", color: "var(--muted)", margin: "5px 0 0" }}>
          {selected.length} selected
        </p>
      )}
    </div>
  );
}

// ============================================================
// بازه‌ی عددی
// ============================================================
function NumberRange({ value = {}, onChange, field, bounds }) {
  const min = value?.min ?? "";
  const max = value?.max ?? "";

  // نکته: facet وقتی هیچ محصولی این اتریبیوت را ندارد
  // { min: null, max: null } برمی‌گرداند. بدون این بررسی،
  // placeholder literally می‌شد «null».
  const hasMin = bounds?.min !== undefined && bounds?.min !== null;
  const hasMax = bounds?.max !== undefined && bounds?.max !== null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="number"
        inputMode="decimal"
        style={inputStyle}
        placeholder={hasMin ? String(bounds.min) : "Min"}
        value={min}
        onChange={(e) => onChange({ ...value, min: e.target.value })}
      />
      <span style={{ color: "var(--muted)", fontSize: "11px" }}>—</span>
      <input
        type="number"
        inputMode="decimal"
        style={inputStyle}
        placeholder={hasMax ? String(bounds.max) : "Max"}
        value={max}
        onChange={(e) => onChange({ ...value, max: e.target.value })}
      />
      {field?.unit && (
        <span style={{ color: "var(--muted)", fontSize: "10px", whiteSpace: "nowrap" }}>
          {field.unit}
        </span>
      )}
    </div>
  );
}

// ============================================================
// یک اتریبیوت پویا
//
// به‌صورت named export است چون مدال فیلترها هر اتریبیوت را جداگانه
// (یکی در هر مدال سطح ۲) رندر می‌کند، نه همه را یک‌جا.
// ============================================================
export function DynamicAttributeField({ def, value, onChange, facet }) {
  const label = (
    <div
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color: "var(--muted)",
        marginBottom: "4px",
        textTransform: "uppercase",
        letterSpacing: ".4px",
      }}
    >
      {def.label}
      {def.unit ? ` (${def.unit})` : ""}
      {def.isRequired && <span style={{ color: "#e75e5e" }}> *</span>}
    </div>
  );

  if (def.dataType === "number") {
    return (
      <div>
        {label}
        <NumberRange
          value={value && typeof value === "object" ? value : {}}
          onChange={onChange}
          bounds={facet && typeof facet === "object" && !Array.isArray(facet) ? facet : undefined}
        />
      </div>
    );
  }

  if (def.dataType === "boolean") {
    const checked = value === true || value === "true";
    return (
      <div>
        {label}
        <label style={optionRowStyle}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked ? true : "")}
          />
          <span style={{ flex: 1 }}>Yes</span>
          <OptionCount count={facet?.true} />
        </label>
      </div>
    );
  }

  const options = Array.isArray(def.options)
    ? def.options.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o
      )
    : [];

  if (def.dataType === "select" || def.dataType === "multiSelect") {
    if (options.length === 0) return null;
    return (
      <div>
        {label}
        <MultiSelectList
          options={options}
          value={Array.isArray(value) ? value : value ? [value] : []}
          onChange={onChange}
          counts={facet || {}}
        />
      </div>
    );
  }

  // text
  return (
    <div>
      {label}
      <input
        style={inputStyle}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Filter by ${def.label}`}
      />
    </div>
  );
}

// ============================================================
// رندرکننده‌ی اصلی
// ============================================================
export default function FilterField({
  field,
  value,
  options = [],
  counts = {},
  onChange,
  categoryTree = [],
  attributeDefs = [],
  attributeFacets = {},
}) {
  switch (field.type) {
    case "text":
      return (
        <input
          style={inputStyle}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || `Search…`}
        />
      );

    case "categoryCascader":
      return (
        <CategoryCascader
          tree={categoryTree}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          selectStyle={inputStyle}
        />
      );

    case "multiSelect":
      return (
        <MultiSelectList
          options={options}
          value={value}
          onChange={onChange}
          counts={counts}
        />
      );

    case "select":
      return (
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label ?? o.value}
            </option>
          ))}
        </select>
      );

    case "sort":
      return (
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Default</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label ?? o.value}
            </option>
          ))}
        </select>
      );

    case "boolean":
      return (
        <label style={optionRowStyle}>
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked ? true : "")}
          />
          <span style={{ flex: 1 }}>{field.label}</span>
        </label>
      );

    case "numberRange":
      return (
        <NumberRange value={value} onChange={onChange} field={field} />
      );

    case "number":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="number"
            style={inputStyle}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
          />
          {field.unit && (
            <span style={{ color: "var(--muted)", fontSize: "10px" }}>
              {field.unit}
            </span>
          )}
        </div>
      );

    case "date":
      return (
        <input
          type="date"
          style={inputStyle}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "dynamicAttributes": {
      if (attributeDefs.length === 0) {
        return (
          <p style={{ fontSize: "10px", color: "var(--muted)", margin: 0 }}>
            No specifications defined for this category yet.
          </p>
        );
      }

      const current =
        value && typeof value === "object" && !Array.isArray(value) ? value : {};

      return (
        <div style={{ display: "grid", gap: "14px" }}>
          {attributeDefs.map((def) => (
            <DynamicAttributeField
              key={def.id}
              def={def}
              value={current[def.id]}
              facet={attributeFacets?.[def.id]}
              onChange={(nextValue) =>
                onChange({ ...current, [def.id]: nextValue })
              }
            />
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
