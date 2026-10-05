// src/components/ui/VocabularySelect.js
"use client";

import { useMemo, useState } from "react";
import { useVocabulary } from "@/hooks/useVocabularies";
import { parseList, joinList } from "@/lib/filters/params";

// ============================================================
// Selection from controlled vocabularies
//
// • single  → one <select> (value: string)
// • multiple→ removable chips (value: comma-separated string)
//
// Storing as "a,b,c" is intentional: the current database columns are strings
// and the filter uses matchMode:"contains", so it stays compatible.
// ============================================================
export default function VocabularySelect({
  vocabKey,
  value = "",
  onChange,
  multiple = false,
  placeholder = "Select…",
  addPlaceholder = "Add…",
  allowCustom = false,
  disabled = false,
  id,
  className = "form-select",
  style,
  ariaLabel,
}) {
  const { options: vocabOptions } = useVocabulary(vocabKey);
  const [customInput, setCustomInput] = useState("");

  const options = useMemo(
    () => (Array.isArray(vocabOptions) ? vocabOptions : []),
    [vocabOptions]
  );

  const labelOf = (v) => {
    const found = options.find((o) => String(o.value) === String(v));
    return found?.label ?? v;
  };

  // ============================================================
  // Single value
  // ============================================================
  if (!multiple) {
    const isCustomValue =
      value && !options.some((o) => String(o.value) === String(value));

    return (
      <>
        <select
          id={id}
          className={className}
          style={style}
          value={value || ""}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="">{placeholder}</option>

          {/* Show the current value that is not in the list (legacy data) */}
          {isCustomValue && <option value={value}>{value}</option>}

          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label ?? o.value}
            </option>
          ))}
        </select>

        {allowCustom && (
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Or type a custom value…"
            value={isCustomValue ? value : ""}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}
      </>
    );
  }

  // ============================================================
  // Multiple values (comma-separated string)
  // ============================================================
  const selected = parseList(value);
  const remaining = options.filter(
    (o) => !selected.includes(String(o.value))
  );

  const emit = (list) => onChange?.(joinList(list));

  const add = (v) => {
    const clean = String(v || "").trim();
    if (!clean) return;
    if (selected.includes(clean)) return;
    emit([...selected, clean]);
  };

  const remove = (v) => emit(selected.filter((s) => s !== v));

  const addCustom = () => {
    add(customInput);
    setCustomInput("");
  };

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div
          className="d-flex flex-wrap gap-2 mb-2"
          aria-label="Selected values"
        >
          {selected.map((v) => (
            <span
              key={v}
              className="badge d-inline-flex align-items-center gap-2"
              style={{
                background: "#e8f6f0",
                color: "#12885f",
                fontWeight: 600,
                fontSize: "11px",
                padding: "6px 8px 6px 10px",
                borderRadius: "50px",
              }}
            >
              {labelOf(v)}
              <button
                type="button"
                onClick={() => remove(v)}
                disabled={disabled}
                aria-label={`Remove ${labelOf(v)}`}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#12885f",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add from the list */}
      {remaining.length > 0 && (
        <select
          id={id}
          className={className}
          style={style}
          value=""
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => {
            if (e.target.value) add(e.target.value);
          }}
        >
          <option value="">{placeholder}</option>
          {remaining.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label ?? o.value}
            </option>
          ))}
        </select>
      )}

      {/* Add a custom value */}
      {allowCustom && (
        <div className="input-group mt-2">
          <input
            type="text"
            className="form-control"
            placeholder={addPlaceholder}
            value={customInput}
            disabled={disabled}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={addCustom}
            disabled={disabled || !customInput.trim()}
          >
            Add
          </button>
        </div>
      )}

      {remaining.length === 0 && !allowCustom && selected.length > 0 && (
        <p className="text-muted small mb-0">All options selected.</p>
      )}
    </div>
  );
}
