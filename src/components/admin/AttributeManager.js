// src/components/admin/AttributeManager.js
"use client";
// ============================================================
// مدیریت اتریبیوت‌های محصول (EAV)
//
// اتریبیوتی که این‌جا ساخته می‌شود خودکار در فیلترهای فروشگاه و
// فرم‌های ساخت محصول ظاهر می‌شود (resolveAttributesForPath).
// scopeId همان slug سطح انتخاب‌شده از درخت سه‌سطحی دسته‌بندی است.
// ============================================================

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const MAX_OPTIONS = 200;

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--line)",
  borderRadius: "9px",
  fontSize: "11px",
  fontFamily: "inherit",
  color: "var(--text)",
  background: "#fff",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--muted)",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: ".4px",
};

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "9px 16px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  color: "var(--text)",
};

const smallBtnStyle = {
  ...btnStyle,
  padding: "5px 10px",
  borderRadius: "8px",
};

const EMPTY_FORM = {
  key: "",
  label: "",
  labelFa: "",
  dataType: "text",
  unit: "",
  scope: "global",
  sortOrder: 0,
  isFilterable: true,
  isRequired: false,
  showInCard: false,
  isActive: true,
  options: [],
};

const CHECKBOX_FIELDS = [
  { key: "isFilterable", label: "Filterable", title: "Show this attribute in the storefront filters" },
  { key: "isRequired", label: "Required", title: "Must be filled in when creating a product" },
  { key: "showInCard", label: "Show in card", title: "Show the value on product cards" },
  { key: "isActive", label: "Active", title: "Inactive attributes are ignored everywhere" },
];

// ============================================================
// پیدا کردن انتخاب درخت از یک scopeId (فقط slug را داریم)
// ============================================================
function findScopeSelection(tree, scope, scopeId) {
  const empty = { l1: "", l2: "", l3: "" };
  if (!scopeId || scope === "global") return empty;

  for (const n1 of tree || []) {
    if (scope === "category" && n1.slug === scopeId) {
      return { l1: n1.slug, l2: "", l3: "" };
    }

    for (const n2 of n1.children || []) {
      if (scope === "subCategory" && n2.slug === scopeId) {
        return { l1: n1.slug, l2: n2.slug, l3: "" };
      }

      for (const n3 of n2.children || []) {
        if (scope === "productType" && n3.slug === scopeId) {
          return { l1: n1.slug, l2: n2.slug, l3: n3.slug };
        }
      }
    }
  }

  return empty;
}

// ============================================================
// نام خوانا برای scope یک اتریبیوت
// ============================================================
function describeScopePath(attr, tree) {
  if (!attr || attr.scope === "global" || !attr.scopeId) return "All products";

  const found = findScopeSelection(tree, attr.scope, attr.scopeId);
  if (!found.l1) return attr.scopeId;

  const n1 = (tree || []).find((n) => n.slug === found.l1) || null;
  const n2 = (n1?.children || []).find((n) => n.slug === found.l2) || null;
  const n3 = (n2?.children || []).find((n) => n.slug === found.l3) || null;

  return [n1?.name, n2?.name, n3?.name].filter(Boolean).join(" › ") || attr.scopeId;
}

// ============================================================
// پاک‌سازی گزینه‌های select / multiSelect
// ============================================================
function cleanOptions(options) {
  const seen = new Set();
  const out = [];

  for (const o of Array.isArray(options) ? options : []) {
    const value = String(o?.value ?? "").trim().slice(0, 120);
    if (!value) continue;

    const dedupeKey = value.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({ value, label: String(o?.label ?? "").trim().slice(0, 120) || value });
    if (out.length >= MAX_OPTIONS) break;
  }

  return out;
}

function Check({ label, checked, onChange, title }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "11px",
        cursor: "pointer",
        color: "var(--text)",
      }}
      title={title}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function AttributeManager({
  attributes = [],
  dataTypes = [],
  scopes = [],
  tree = [],
}) {
  const router = useRouter();
  const panelRef = useRef(null);

  const [panel, setPanel] = useState({ open: false, mode: "create", id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [sel, setSel] = useState({ l1: "", l2: "", l3: "" });
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(null); // "save" یا `delete:${id}`

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // ===== گزینه‌های درخت برای سه select وابسته =====
  const l1Nodes = tree || [];
  const l1Node = l1Nodes.find((n) => n.slug === sel.l1) || null;
  const l2Nodes = l1Node?.children || [];
  const l2Node = l2Nodes.find((n) => n.slug === sel.l2) || null;
  const l3Nodes = l2Node?.children || [];

  const needsOptions = form.dataType === "select" || form.dataType === "multiSelect";

  const scopeId =
    form.scope === "global"
      ? null
      : form.scope === "category"
      ? sel.l1
      : form.scope === "subCategory"
      ? sel.l2
      : sel.l3;

  const scopeLabel = (value) =>
    scopes.find((s) => s.value === value)?.label || value;

  const scrollToPanel = () => {
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  // ===== باز/بسته کردن پنل =====
  const openCreate = () => {
    if (panel.open && panel.mode === "create") {
      setPanel({ open: false, mode: "create", id: null });
      return;
    }
    setForm({ ...EMPTY_FORM, options: [] });
    setSel({ l1: "", l2: "", l3: "" });
    setBulk("");
    setPanel({ open: true, mode: "create", id: null });
    scrollToPanel();
  };

  const openEdit = (attr) => {
    setForm({
      key: attr.key || "",
      label: attr.label || "",
      labelFa: attr.labelFa || "",
      dataType: attr.dataType || "text",
      unit: attr.unit || "",
      scope: attr.scope || "global",
      sortOrder: attr.sortOrder ?? 0,
      isFilterable: attr.isFilterable !== false,
      isRequired: attr.isRequired === true,
      showInCard: attr.showInCard === true,
      isActive: attr.isActive !== false,
      options: (Array.isArray(attr.options) ? attr.options : [])
        .map((o) => ({
          value: String(o?.value ?? ""),
          label: String(o?.label ?? o?.value ?? ""),
        }))
        .filter((o) => o.value),
    });
    setSel(findScopeSelection(tree, attr.scope, attr.scopeId));
    setBulk("");
    setPanel({ open: true, mode: "edit", id: attr.id });
    scrollToPanel();
  };

  const closePanel = () => setPanel({ open: false, mode: "create", id: null });

  // ===== ویرایش گزینه‌ها =====
  const addOption = () =>
    setForm((f) => ({ ...f, options: [...f.options, { value: "", label: "" }] }));

  const setOption = (index, field, value) =>
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    }));

  const removeOption = (index) =>
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
    }));

  // ===== افزودن دسته‌ای: هر خط یک گزینه =====
  const applyBulk = () => {
    const lines = String(bulk || "")
      .split("\n")
      .map((l) => l.trim().slice(0, 120))
      .filter(Boolean);

    if (lines.length === 0) {
      toast.warning("Paste one option per line first");
      return;
    }

    setForm((f) => {
      const seen = new Set(
        f.options.map((o) => o.value.trim().toLowerCase()).filter(Boolean)
      );
      const next = [...f.options];

      for (const line of lines) {
        const dedupeKey = line.toLowerCase();
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        next.push({ value: line, label: line });
        if (next.length >= MAX_OPTIONS) break;
      }

      return { ...f, options: next };
    });

    setBulk("");
  };

  // ===== ذخیره (POST برای ساخت، PATCH برای ویرایش) =====
  const save = async () => {
    const isEdit = panel.mode === "edit";
    const key = String(form.key || "").trim();
    const label = String(form.label || "").trim();

    if (!key) {
      toast.warning("key is required");
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      toast.warning(
        "key must start with a lowercase letter and use only lowercase letters, digits and underscore (e.g. moisture)"
      );
      return;
    }

    if (!label) {
      toast.warning("label is required");
      return;
    }

    const options = needsOptions ? cleanOptions(form.options) : [];
    if (needsOptions && options.length === 0) {
      toast.warning("Add at least one option for a choice attribute");
      return;
    }

    if (form.scope !== "global" && !scopeId) {
      toast.warning("Pick the category level this attribute belongs to");
      return;
    }

    const payload = {
      key,
      label,
      labelFa: String(form.labelFa || "").trim(),
      dataType: form.dataType,
      unit: String(form.unit || "").trim(),
      scope: form.scope,
      scopeId: form.scope === "global" ? null : scopeId,
      sortOrder: Number(form.sortOrder) || 0,
      isFilterable: !!form.isFilterable,
      isRequired: !!form.isRequired,
      showInCard: !!form.showInCard,
      isActive: !!form.isActive,
      options,
    };

    setBusy("save");
    try {
      const res = await fetch(
        isEdit ? `/api/admin/attributes/${panel.id}` : "/api/admin/attributes",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      toast.success(data.message || (isEdit ? "Attribute updated" : "Attribute created"));
      closePanel();
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  // ===== حذف =====
  const remove = async (attr) => {
    const ok = window.confirm(
      `Delete the attribute "${attr.label}" (${attr.key})?\n\nAll product values stored for this attribute will be removed.`
    );
    if (!ok) return;

    setBusy(`delete:${attr.id}`);
    try {
      const res = await fetch(`/api/admin/attributes/${attr.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      if (panel.open && panel.id === attr.id) closePanel();

      toast.success(data.message || "Attribute deleted");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const activeCount = attributes.filter((a) => a.isActive).length;

  return (
    <>
      {/* ===== نوار بالا ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
          {attributes.length} definition(s) · {activeCount} active · attributes
          appear automatically in the storefront filters
        </div>

        <button
          type="button"
          style={{
            ...btnStyle,
            background: panel.open && panel.mode === "create" ? "#fff" : "var(--green2)",
            color: panel.open && panel.mode === "create" ? "var(--text)" : "#fff",
            borderColor:
              panel.open && panel.mode === "create" ? "var(--line)" : "var(--green2)",
          }}
          onClick={openCreate}
        >
          <i
            className={`fa-solid ${
              panel.open && panel.mode === "create" ? "fa-xmark" : "fa-plus"
            }`}
          ></i>
          {panel.open && panel.mode === "create" ? "Close" : "Add attribute"}
        </button>
      </div>

      {/* ===== پنل ساخت/ویرایش ===== */}
      {panel.open && (
        <div
          className="admin-card"
          ref={panelRef}
          style={{ marginBottom: "14px", scrollMarginTop: "16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--dark)" }}>
                {panel.mode === "edit" ? "Edit attribute" : "New attribute"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                {panel.mode === "edit"
                  ? "The key is fixed — create a new attribute if you need a different one."
                  : "Saved attributes show up in the product filters and create forms immediately."}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" style={btnStyle} onClick={closePanel}>
                Cancel
              </button>
              <button
                type="button"
                style={{
                  ...btnStyle,
                  background: "var(--green2)",
                  color: "#fff",
                  borderColor: "var(--green2)",
                }}
                onClick={save}
                disabled={busy !== null}
              >
                <i
                  className={`fa-solid ${
                    busy === "save" ? "fa-spinner fa-spin" : "fa-floppy-disk"
                  }`}
                ></i>
                {panel.mode === "edit" ? "Save changes" : "Create attribute"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "13px" }}>
            {/* ===== ردیف ۱: key / label / labelFa ===== */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={labelStyle}>Key</label>
                <input
                  style={{
                    ...inputStyle,
                    fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                    background: panel.mode === "edit" ? "#f7f9f8" : "#fff",
                    color: panel.mode === "edit" ? "var(--muted)" : "var(--text)",
                    cursor: panel.mode === "edit" ? "not-allowed" : "text",
                  }}
                  value={form.key}
                  disabled={panel.mode === "edit"}
                  onChange={(e) => set("key", e.target.value)}
                  placeholder="moisture"
                  spellCheck={false}
                />
              </div>

              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={labelStyle}>Label (English)</label>
                <input
                  style={inputStyle}
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="Moisture content"
                />
              </div>

              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={labelStyle}>Label (Persian)</label>
                <input
                  style={inputStyle}
                  value={form.labelFa}
                  onChange={(e) => set("labelFa", e.target.value)}
                  placeholder="میزان رطوبت"
                />
              </div>
            </div>

            {/* ===== ردیف ۲: dataType / unit / sortOrder ===== */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ width: "180px" }}>
                <label style={labelStyle}>Data type</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.dataType}
                  onChange={(e) => set("dataType", e.target.value)}
                >
                  {dataTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: "150px" }}>
                <label style={labelStyle}>Unit (optional)</label>
                <input
                  style={inputStyle}
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="%, mm, kg"
                />
              </div>

              <div style={{ width: "130px" }}>
                <label style={labelStyle}>Sort order</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "16px",
                  flexWrap: "wrap",
                  paddingBottom: "9px",
                }}
              >
                {CHECKBOX_FIELDS.map((c) => (
                  <Check
                    key={c.key}
                    label={c.label}
                    title={c.title}
                    checked={!!form[c.key]}
                    onChange={(v) => set(c.key, v)}
                  />
                ))}
              </div>
            </div>

            {/* ===== ردیف ۳: scope + انتخاب سطح دسته‌بندی ===== */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ width: "230px" }}>
                <label style={labelStyle}>Scope</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.scope}
                  onChange={(e) => {
                    set("scope", e.target.value);
                    setSel({ l1: "", l2: "", l3: "" });
                  }}
                >
                  {scopes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.scope !== "global" && (
                <>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label style={labelStyle}>Category (level 1)</label>
                    <select
                      style={{ ...inputStyle, cursor: "pointer" }}
                      value={sel.l1}
                      onChange={(e) =>
                        setSel({ l1: e.target.value, l2: "", l3: "" })
                      }
                    >
                      <option value="">— Select —</option>
                      {l1Nodes.map((n) => (
                        <option key={n.slug} value={n.slug}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.scope !== "category" && (
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={labelStyle}>Subcategory (level 2)</label>
                      <select
                        style={{ ...inputStyle, cursor: "pointer" }}
                        value={sel.l2}
                        disabled={!l1Node}
                        onChange={(e) =>
                          setSel((s) => ({ ...s, l2: e.target.value, l3: "" }))
                        }
                      >
                        <option value="">— Select —</option>
                        {l2Nodes.map((n) => (
                          <option key={n.slug} value={n.slug}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.scope === "productType" && (
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={labelStyle}>Product type (level 3)</label>
                      <select
                        style={{ ...inputStyle, cursor: "pointer" }}
                        value={sel.l3}
                        disabled={!l2Node}
                        onChange={(e) =>
                          setSel((s) => ({ ...s, l3: e.target.value }))
                        }
                      >
                        <option value="">— Select —</option>
                        {l3Nodes.map((n) => (
                          <option key={n.slug} value={n.slug}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      paddingBottom: "10px",
                      fontSize: "10px",
                      color: scopeId ? "var(--green2)" : "#e75e5e",
                    }}
                  >
                    {scopeId ? (
                      <>
                        scopeId: <code style={{ marginLeft: "4px" }}>{scopeId}</code>
                      </>
                    ) : (
                      "scopeId required"
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ===== ردیف ۴: گزینه‌های select / multiSelect ===== */}
            {needsOptions && (
              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: "13px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Options ({cleanOptions(form.options).length})
                  </label>
                  <button type="button" style={smallBtnStyle} onClick={addOption}>
                    <i className="fa-solid fa-plus"></i>
                    Add option
                  </button>
                </div>

                {form.options.length === 0 ? (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      marginBottom: "10px",
                    }}
                  >
                    No options yet — add rows below or paste them in the bulk box.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "7px" }}>
                    {form.options.map((o, index) => (
                      <div
                        key={index}
                        style={{ display: "flex", gap: "8px", alignItems: "center" }}
                      >
                        <input
                          style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
                          value={o.value}
                          placeholder="value (stored)"
                          onChange={(e) => setOption(index, "value", e.target.value)}
                        />
                        <input
                          style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
                          value={o.label}
                          placeholder="label (shown)"
                          onChange={(e) => setOption(index, "label", e.target.value)}
                        />
                        <button
                          type="button"
                          style={smallBtnStyle}
                          onClick={() => removeOption(index)}
                          title="Remove option"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "12px" }}>
                  <label style={labelStyle}>
                    Bulk add — one option per line (value = label)
                  </label>
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: "90px",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontSize: "10px",
                      lineHeight: 1.6,
                      resize: "vertical",
                    }}
                    value={bulk}
                    onChange={(e) => setBulk(e.target.value)}
                    placeholder={"Grade A\nGrade B\nGrade C"}
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    style={{ ...smallBtnStyle, marginTop: "8px" }}
                    onClick={applyBulk}
                  >
                    <i className="fa-solid fa-list-check"></i>
                    Add all lines
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== جدول اتریبیوت‌ها ===== */}
      {attributes.length === 0 ? (
        <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
          <i
            className="fa-solid fa-sliders"
            style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}
          ></i>
          <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
            No attributes defined yet. Use “Add attribute” to create the first
            one.
          </p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Scope</th>
                  <th>Filterable</th>
                  <th>Active</th>
                  <th>Values</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr) => (
                  <tr key={attr.id}>
                    <td style={{ maxWidth: "280px" }}>
                      <div style={{ fontWeight: 700, fontSize: "11px" }}>
                        {attr.label}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          color: "var(--muted)",
                          marginTop: "2px",
                        }}
                      >
                        <code>{attr.key}</code>
                        {attr.unit ? <span> · unit {attr.unit}</span> : null}
                        {attr.labelFa ? <span> · {attr.labelFa}</span> : null}
                      </div>
                    </td>

                    <td style={{ fontSize: "11px" }}>
                      {dataTypes.find((t) => t.value === attr.dataType)?.label ||
                        attr.dataType}
                    </td>

                    <td
                      style={{ maxWidth: "240px" }}
                      title={
                        attr.scope === "global"
                          ? "global"
                          : `${attr.scope}:${attr.scopeId}`
                      }
                    >
                      <div style={{ fontSize: "11px", fontWeight: 600 }}>
                        {scopeLabel(attr.scope)}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--muted)",
                          marginTop: "2px",
                        }}
                      >
                        {describeScopePath(attr, tree)}
                        {attr.scope !== "global" && attr.scopeId ? (
                          <span>
                            {" "}
                            · <code>{attr.scopeId}</code>
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-pill ${
                          attr.isFilterable ? "active" : "basic"
                        }`}
                      >
                        {attr.isFilterable ? "Yes" : "No"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-pill ${
                          attr.isActive ? "active" : "basic"
                        }`}
                      >
                        {attr.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ fontSize: "11px", color: "var(--muted)" }}>—</td>

                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={{
                            ...smallBtnStyle,
                            color: "#12885f",
                            borderColor: "#bfe3d3",
                          }}
                          onClick={() => openEdit(attr)}
                          title="Edit attribute"
                        >
                          <i className="fa-solid fa-pen"></i>
                          Edit
                        </button>

                        <button
                          type="button"
                          style={{
                            ...smallBtnStyle,
                            color: "#e75e5e",
                            borderColor: "#f3c9c3",
                          }}
                          onClick={() => remove(attr)}
                          disabled={busy === `delete:${attr.id}`}
                          title="Delete attribute and all stored values"
                        >
                          <i
                            className={`fa-solid ${
                              busy === `delete:${attr.id}`
                                ? "fa-spinner fa-spin"
                                : "fa-trash"
                            }`}
                          ></i>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
