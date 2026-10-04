// src/components/filters/ActiveFilterChips.js
"use client";

// ============================================================
// نمایش فیلترهای فعال با امکان حذف تکی
// ============================================================
export default function ActiveFilterChips({
  schema,
  values = {},
  options = {},
  categoryIndex = null,
  attributeDefs = [],
  onRemove,
}) {
  if (!schema) return null;

  const labelOf = (value, fieldName) => {
    const list = options[fieldName] || [];
    const found = list.find((o) => String(o.value) === String(value));
    return found?.label ?? value;
  };

  const describeCategory = (path) => {
    if (!path) return "";
    const parts = String(path).split("/");
    const names = parts.map((slug) => {
      const node = categoryIndex?.byPath?.get?.(slug);
      if (node?.name) return node.name;
      return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    });
    return names.join(" › ");
  };

  const chips = [];

  for (const field of schema.fields || []) {
    const value = values[field.name];
    if (value === undefined || value === null || value === "") continue;

    // ===== اتریبیوت‌های پویا =====
    if (field.type === "dynamicAttributes") {
      if (typeof value !== "object" || Array.isArray(value)) continue;

      for (const [attrId, attrValue] of Object.entries(value)) {
        const def = attributeDefs.find((d) => d.id === attrId);
        if (!def) continue;

        if (attrValue === null || attrValue === undefined || attrValue === "") {
          continue;
        }

        let text;
        if (attrValue && typeof attrValue === "object" && !Array.isArray(attrValue)) {
          const min = attrValue.min !== "" ? attrValue.min : "…";
          const max = attrValue.max !== "" ? attrValue.max : "…";
          text = `${def.label}: ${min} — ${max}${def.unit ? def.unit : ""}`;
        } else if (attrValue === true) {
          text = `${def.label}: Yes`;
        } else {
          const list = Array.isArray(attrValue) ? attrValue : [attrValue];
          const labels = list.map((v) => {
            const opt = (def.options || []).find(
              (o) => String(o.value ?? o) === String(v)
            );
            return opt?.label ?? v;
          });
          text = `${def.label}: ${labels.join(", ")}`;
        }

        chips.push({ key: `attr_${attrId}`, fieldName: field.name, text });
      }
      continue;
    }

    // ===== بازه‌ی عددی =====
    if (field.type === "numberRange") {
      const min = value?.min !== undefined && value.min !== "" ? value.min : null;
      const max = value?.max !== undefined && value.max !== "" ? value.max : null;
      if (min === null && max === null) continue;
      chips.push({
        key: field.name,
        fieldName: field.name,
        text: `${field.label}: ${min ?? "…"} — ${max ?? "…"}${
          field.unit ? ` ${field.unit}` : ""
        }`,
      });
      continue;
    }

    // ===== دسته‌بندی =====
    if (field.type === "categoryCascader") {
      chips.push({
        key: field.name,
        fieldName: field.name,
        text: `Category: ${describeCategory(value)}`,
      });
      continue;
    }

    // ===== بولی =====
    if (field.type === "boolean") {
      if (value !== true) continue;
      chips.push({ key: field.name, fieldName: field.name, text: field.label });
      continue;
    }

    // ===== لیست‌ها =====
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      chips.push({
        key: field.name,
        fieldName: field.name,
        text: `${field.label}: ${value.map((v) => labelOf(v, field.name)).join(", ")}`,
      });
      continue;
    }

    // ===== متن و select =====
    if (field.type === "sort") continue;
    chips.push({
      key: field.name,
      fieldName: field.name,
      text:
        field.type === "text"
          ? `“${value}”`
          : `${field.label}: ${labelOf(value, field.name)}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "7px",
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: "12px",
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "5px 8px 5px 11px",
            borderRadius: "50px",
            background: "#e8f6f0",
            color: "#12885f",
            fontSize: "11px",
            fontWeight: 600,
            maxWidth: "320px",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {chip.text}
          </span>
          <button
            type="button"
            onClick={() => onRemove?.(chip.fieldName)}
            aria-label={`Remove ${chip.text}`}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: "#12885f",
              padding: 0,
              lineHeight: 1,
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </span>
      ))}
    </div>
  );
}
