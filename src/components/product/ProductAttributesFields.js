// src/components/product/ProductAttributesFields.js
"use client";

import { useEffect, useState } from "react";
import { emptyAttributeValue } from "@/lib/attributeValues";

// ============================================================
// فیلدهای مشخصات محصول — کاملاً داینامیک
//
// با تغییر دسته‌بندی، اتریبیوت‌های همان دسته از سرور خوانده
// و رندر می‌شوند. افزودن اتریبیوت جدید در پنل ادمین = صفر تغییر
// در این فایل.
//
// values: { [attributeId]: value }
// ============================================================
export default function ProductAttributesFields({
  categoryPath = "",
  values = {},
  onChange,
  disabled = false,
}) {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== دریافت اتریبیوت‌های مرتبط با دسته =====
  useEffect(() => {
    if (!categoryPath) {
      setAttributes([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/attributes?categoryPath=${encodeURIComponent(categoryPath)}`)
      .then((res) => (res.ok ? res.json() : { attributes: [] }))
      .then((data) => {
        if (!cancelled) setAttributes(data?.attributes || []);
      })
      .catch(() => {
        if (!cancelled) setAttributes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryPath]);

  const setValue = (id, value) => onChange?.({ ...values, [id]: value });

  // ===== حالت‌های خاص =====
  if (!categoryPath) {
    return (
      <p className="text-muted small mb-0">
        Select a category first — its specifications will appear here.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-muted small mb-0">
        <i className="fa-solid fa-spinner fa-spin me-2"></i>
        Loading specifications…
      </p>
    );
  }

  if (attributes.length === 0) {
    return (
      <p className="text-muted small mb-0">
        No specifications are defined for this category yet.
      </p>
    );
  }

  // ============================================================
  // رندر هر اتریبیوت بر اساس نوع داده
  // ============================================================
  return (
    <div className="row g-3">
      {attributes.map((attr) => {
        const value =
          values[attr.id] !== undefined
            ? values[attr.id]
            : emptyAttributeValue(attr.dataType);

        const label = (
          <label className="form-label fw-semibold" htmlFor={`attr-${attr.id}`}>
            {attr.label}
            {attr.unit ? ` (${attr.unit})` : ""}
            {attr.isRequired && <span className="text-danger"> *</span>}
          </label>
        );

        // ---------- بله / خیر ----------
        if (attr.dataType === "boolean") {
          return (
            <div className="col-md-4" key={attr.id}>
              <div className="form-check mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`attr-${attr.id}`}
                  checked={value === true}
                  disabled={disabled}
                  onChange={(e) => setValue(attr.id, e.target.checked)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`attr-${attr.id}`}
                >
                  {attr.label}
                  {attr.isRequired && <span className="text-danger"> *</span>}
                </label>
              </div>
            </div>
          );
        }

        // ---------- چند انتخابی ----------
        if (attr.dataType === "multiSelect") {
          const list = Array.isArray(value) ? value : [];
          const options = Array.isArray(attr.options) ? attr.options : [];

          const toggle = (optionValue) => {
            const v = String(optionValue);
            const next = list.includes(v)
              ? list.filter((x) => x !== v)
              : [...list, v];
            setValue(attr.id, next);
          };

          return (
            <div className="col-md-6" key={attr.id}>
              {label}
              <div
                className="border rounded p-2"
                style={{ maxHeight: "150px", overflowY: "auto" }}
              >
                {options.length === 0 ? (
                  <span className="text-muted small">No options defined.</span>
                ) : (
                  options.map((opt) => {
                    const ov = String(opt.value ?? opt);
                    const ol = opt.label ?? opt.value ?? opt;
                    return (
                      <div className="form-check" key={ov}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`attr-${attr.id}-${ov}`}
                          checked={list.includes(ov)}
                          disabled={disabled}
                          onChange={() => toggle(ov)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`attr-${attr.id}-${ov}`}
                        >
                          {ol}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        }

        // ---------- انتخابی تک‌مقداری ----------
        if (attr.dataType === "select") {
          const options = Array.isArray(attr.options) ? attr.options : [];
          return (
            <div className="col-md-4" key={attr.id}>
              {label}
              <select
                className="form-select"
                id={`attr-${attr.id}`}
                value={value || ""}
                disabled={disabled}
                onChange={(e) => setValue(attr.id, e.target.value)}
              >
                <option value="">Select…</option>
                {options.map((opt) => {
                  const ov = String(opt.value ?? opt);
                  const ol = opt.label ?? opt.value ?? opt;
                  return (
                    <option key={ov} value={ov}>
                      {ol}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        }

        // ---------- عدد ----------
        if (attr.dataType === "number") {
          return (
            <div className="col-md-4" key={attr.id}>
              {label}
              <input
                type="number"
                step="any"
                className="form-control"
                id={`attr-${attr.id}`}
                value={value ?? ""}
                disabled={disabled}
                onChange={(e) => setValue(attr.id, e.target.value)}
              />
            </div>
          );
        }

        // ---------- متن ----------
        return (
          <div className="col-md-4" key={attr.id}>
            {label}
            <input
              type="text"
              className="form-control"
              id={`attr-${attr.id}`}
              value={typeof value === "string" ? value : ""}
              disabled={disabled}
              onChange={(e) => setValue(attr.id, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
