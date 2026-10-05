// src/components/admin/HomepageManager.js
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"; // optional
import ItemPickerModal from "./ItemPickerModal";
import SortableSectionItem from "./SortableSectionItem";
import HomepagePreview from "./HomepagePreview";

export default function HomepageManager({ initialSections, categories }) {
  const router = useRouter();
  const [sections, setSections] = useState(
    [...initialSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false); // ✅ New

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    section: null,
  });

  const [form, setForm] = useState({
    type: "products",
    mode: "latest",
    title: "",
    subtitle: "",
    icon: "",
    category: "",
    subCategory: "",
    limit: 6,
    itemIds: [],
    position: "top",
  });

  // ===== Sensors =====
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start dragging after 5px of movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ===== Drag End =====
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sections, oldIndex, newIndex).map(
      (s, idx) => ({ ...s, order: idx })
    );

    // Optimistic update
    setSections(reordered);

    // Save to the server
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: reordered }),
      });
      if (!res.ok) throw new Error("Failed to save order");
      toast.success("Order saved");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
      // Revert to the previous state
      setSections(sections);
    }
  };

  // ===== Categories helper =====
  const mainCategories = useMemo(
    () => categories.filter((c) => c.parent === 0),
    [categories]
  );

  const getSubCategories = (parentName) => {
    const parent = categories.find((c) => c.name === parentName);
    if (!parent) return [];
    return categories.filter((c) => c.parent === parent.id);
  };

  // ===== Modal =====
  const openCreate = () => {
    setForm({
      type: "products",
      mode: "latest",
      title: "",
      subtitle: "",
      icon: "",
      category: "",
      subCategory: "",
      limit: 6,
      itemIds: [],
      ition: "top",
    });
    setModal({ open: true, mode: "create", section: null });
  };

  const openEdit = (section) => {
    setForm({
      type: section.type,
      mode: section.mode,
      title: section.title,
      subtitle: section.subtitle || "",
      icon: section.icon || "",
      category: section.category || "",
      subCategory: section.subCategory || "",
      limit: section.limit || 6,
      itemIds: section.itemIds || [],
      position: section.position || "top",
    });
    setModal({ open: true, mode: "edit", section });
  };

  const closeModal = () => {
    if (saving) return;
    setModal({ open: false, mode: "create", section: null });
  };

  // ===== CRUD =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.warning("Title is required");
      return;
    }
    if (form.mode === "category" && !form.category) {
      toast.warning("Please select a category");
      return;
    }
    if (form.mode === "manual" && form.itemIds.length === 0) {
      toast.warning("Please select at least one item");
      return;
    }

    setSaving(true);
    try {
      const isCreate = modal.mode === "create";
      const url = isCreate
        ? "/api/admin/homepage-sections"
        : `/api/admin/homepage-sections/${modal.section.id}`;
      const method = isCreate ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (isCreate) {
        setSections((prev) => [...prev, data.section]);
        toast.success("Section created");
      } else {
        setSections((prev) =>
          prev.map((s) => (s.id === data.section.id ? data.section : s))
        );
        toast.success("Section updated");
      }

      closeModal();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section) => {
    if (!confirm(`Delete section "${section.title}"?`)) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/homepage-sections/${section.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSections((prev) =>
        prev
          .filter((s) => s.id !== section.id)
          .map((s, idx) => ({ ...s, order: idx }))
      );
      toast.success("Section deleted");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (section) => {
    try {
      const res = await fetch(
        `/api/admin/homepage-sections/${section.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !section.isActive }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? data.section : s))
      );
      toast.success(data.section.isActive ? "Activated" : "Deactivated");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      {/* ===== Header Actions ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 12, color: "#71807b" }}>
          <i className="fa-solid fa-hand-pointer me-1"></i>
          Drag to reorder · sections appear on the homepage in the order below.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={sections.length === 0}
            style={secondaryBtnStyle}
          >
            <i className="fa-solid fa-eye me-1"></i>
            Live Preview
          </button>
          <button
            onClick={openCreate}
            disabled={saving}
            style={primaryBtnStyle}
          >
            <i className="fa-solid fa-plus me-1"></i>
            Add Section
          </button>
        </div>
      </div>

      {/* ===== Sortable List ===== */}
      {sections.length === 0 ? (
        <div
          className="admin-card"
          style={{ padding: 60, textAlign: "center" }}
        >
          <i
            className="fa-solid fa-layer-group"
            style={{
              fontSize: 40,
              color: "#d1dbd6",
              marginBottom: 12,
            }}
          ></i>
          <p style={{ color: "#82918b", fontSize: 13 }}>
            No sections yet. Click "Add Section" to create one.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {sections.map((section, index) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  index={index}
                  totalCount={sections.length}
                  onToggleActive={handleToggleActive}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ===== Live Preview Modal ===== */}
      <HomepagePreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sections={sections}
      />

      {/* ===== Edit/Create Modal (unchanged) ===== */}
      {modal.open && (
        <div onClick={closeModal} style={overlayStyle}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={modalStyle}
          >
            <h3 style={modalTitleStyle}>
              {modal.mode === "create" ? "New Section" : "Edit Section"}
            </h3>
            <p style={modalSubtitleStyle}>
              Configure what appears on the homepage
            </p>

            {/* Type */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Type *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["products", "requests"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, type: t, itemIds: [] }))
                    }
                    style={segBtn(form.type === t)}
                  >
                    <i
                      className={`fa-solid ${t === "products" ? "fa-box" : "fa-shopping-cart"
                        }`}
                      style={{ marginRight: 6 }}
                    ></i>
                    {t === "products" ? "Products" : "Requests"}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Data Source *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { v: "latest", icon: "fa-clock", label: "Latest" },
                  { v: "category", icon: "fa-tag", label: "By Category" },
                  { v: "manual", icon: "fa-hand-pointer", label: "Manual" },
                ].map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        mode: m.v,
                        ...(m.v === "latest" && {
                          category: "",
                          subCategory: "",
                          itemIds: [],
                        }),
                        ...(m.v === "category" && { itemIds: [] }),
                      }))
                    }
                    style={segBtn(form.mode === m.v)}
                  >
                    <i className={`fa-solid ${m.icon}`} style={{ marginRight: 4 }}></i>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category (only when mode=category) */}
            {form.mode === "category" && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value,
                      subCategory: "",
                    }))
                  }
                  style={selectStyle}
                >
                  <option value="">Select category</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {form.category && (
                  <>
                    <label style={{ ...labelStyle, marginTop: 10, marginBottom: 6 }}>
                      Sub-Category (optional)
                    </label>
                    <select
                      value={form.subCategory}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, subCategory: e.target.value }))
                      }
                      style={selectStyle}
                    >
                      <option value="">All sub-categories</option>
                      {getSubCategories(form.category).map((sc) => (
                        <option key={sc.id} value={sc.name}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            {/* Manual Picker */}
            {form.mode === "manual" && (
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Selected {form.type === "products" ? "Products" : "Requests"} *
                </label>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  style={pickerBtnStyle}
                >
                  <div style={{ textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#0b5b43",
                      }}
                    >
                      {form.itemIds.length === 0
                        ? "Click to select items"
                        : `${form.itemIds.length} item${form.itemIds.length !== 1 ? "s" : ""
                        } selected`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#71807b",
                        marginTop: 2,
                      }}
                    >
                      {form.itemIds.length === 0
                        ? "Pick specific products/requests from any category"
                        : "Click to add, remove, or reorder"}
                    </div>
                  </div>
                  <i
                    className="fa-solid fa-chevron-right"
                    style={{ color: "#13795b", fontSize: 14 }}
                  ></i>
                </button>
              </div>
            )}

            {/* Title */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g., Fresh Vegetables"
                required
                style={inputStyle}
                disabled={saving}
              />
            </div>

            {/* Subtitle */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subtitle: e.target.value }))
                }
                placeholder="Short description"
                style={inputStyle}
                disabled={saving}
              />
            </div>
            {/* ✅ Position Selector */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Display Position *</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  {
                    v: "top",
                    icon: "fa-arrow-up",
                    label: "Top",
                    desc: "Above Trusted Partners",
                  },
                  {
                    v: "after-companies",
                    icon: "fa-arrow-down",
                    label: "After Partners",
                    desc: "Below Trusted Partners",
                  },
                  {
                    v: "before-cta",
                    icon: "fa-arrow-down-long",
                    label: "Before CTA",
                    desc: "Bottom of page",
                  },
                ].map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, position: p.v }))}
                    style={{
                      flex: 1,
                      minWidth: 130,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `2px solid ${form.position === p.v ? "#13795b" : "#e8edf0"
                        }`,
                      background: form.position === p.v ? "#eaf7f1" : "white",
                      color: form.position === p.v ? "#0b5b43" : "#334155",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <i className={`fa-solid ${p.icon}`} style={{ fontSize: 10 }}></i>
                      {p.label}
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: form.position === p.v ? "#0b5b43" : "#94a3b8",
                      }}
                    >
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Icon + Limit */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <label style={labelStyle}>Icon (optional)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="fa-leaf"
                  style={inputStyle}
                  disabled={saving}
                />
              </div>
              <div>
                <label style={labelStyle}>Limit (1-24)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={
                    form.mode === "manual" ? form.itemIds.length : form.limit
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      limit: parseInt(e.target.value) || 6,
                    }))
                  }
                  style={inputStyle}
                  disabled={saving || form.mode === "manual"}
                />
                {form.mode === "manual" && (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    Auto-set from selected items
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={secondaryBtnStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={primaryBtnStyle}
              >
                {saving
                  ? "Saving..."
                  : modal.mode === "create"
                    ? "Create"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item Picker Modal */}
      <ItemPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        type={form.type}
        selectedIds={form.itemIds}
        onSave={(ids) => setForm((f) => ({ ...f, itemIds: ids }))}
      />
    </>
  );
}

// ===== Styles =====
const segBtn = (active) => ({
  flex: 1,
  padding: "10px 12px",
  borderRadius: 10,
  border: `2px solid ${active ? "#13795b" : "#e8edf0"}`,
  background: active ? "#eaf7f1" : "white",
  color: active ? "#0b5b43" : "#334155",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
});

const pickerBtnStyle = {
  width: "100%",
  padding: "14px 16px",
  background: "#f8fdfb",
  border: "2px dashed #a7f3d0",
  borderRadius: 12,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: "inherit",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(6px)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  background: "white",
  borderRadius: 20,
  padding: 28,
  maxWidth: 520,
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
};

const modalTitleStyle = {
  font: "800 16px 'Manrope', sans-serif",
  color: "#13251f",
  margin: "0 0 6px 0",
};

const modalSubtitleStyle = {
  fontSize: 12.5,
  color: "#71807b",
  margin: "0 0 20px 0",
};

const fieldStyle = { marginBottom: 14 };

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--dark)",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: "white",
  color: "var(--text)",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

const primaryBtnStyle = {
  padding: "10px 20px",
  background: "linear-gradient(135deg, var(--green2), var(--green))",
  border: 0,
  borderRadius: 10,
  color: "white",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(19,121,91,0.25)",
  display: "inline-flex",
  alignItems: "center",
};

const secondaryBtnStyle = {
  padding: "10px 20px",
  background: "white",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};