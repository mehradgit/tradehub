// src/components/admin/CategoryManager.js
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function CategoryManager({
  initialCategories,
  productCounts = {},
  requestCounts = {},
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    parentId: 0,
    category: null,
  });

  const [form, setForm] = useState({ name: "", icon: "" });

  // ====== derived ======
  const mainCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parent === 0)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const getSubs = (parentId) =>
    categories
      .filter((c) => c.parent === parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // ====== modal ======
  const openCreate = (parentId = 0) => {
    setForm({ name: "", icon: "" });
    setModal({ open: true, mode: "create", parentId, category: null });
  };

  const openEdit = (category) => {
    setForm({ name: category.name, icon: category.icon || "" });
    setModal({
      open: true,
      mode: "edit",
      parentId: category.parent,
      category,
    });
  };

  const closeModal = () => {
    if (saving) return;
    setModal({ open: false, mode: "create", parentId: 0, category: null });
  };

  // ====== CRUD ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning("Name is required");
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === "create") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            parent: modal.parentId,
            icon: form.icon.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setCategories((prev) => [...prev, data.category]);
        toast.success("Category created");
      } else {
        const res = await fetch(
          `/api/admin/categories/${modal.category.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name.trim(),
              icon: form.icon.trim() || null,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setCategories((prev) =>
          prev.map((c) => (c.id === modal.category.id ? data.category : c))
        );
        toast.success("Category updated");
      }

      closeModal();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const subs = getSubs(category.id);

    // âœ… شمارش با ID (نه name)
    const productCount = productCounts[category.id] || 0;
    const requestCount = requestCounts[category.id] || 0;

    if (productCount > 0 || requestCount > 0) {
      toast.error(
        `Cannot delete: ${productCount} product(s), ${requestCount} request(s) use this category.`
      );
      return;
    }

    const message =
      subs.length > 0
        ? `Delete "${category.name}" and its ${subs.length} subcategorie(s)?`
        : `Delete "${category.name}"?`;

    if (!confirm(message)) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${category.id}?cascade=true`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCategories((prev) =>
        prev.filter(
          (c) => c.id !== category.id && c.parent !== category.id
        )
      );
      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? data.category : c))
      );
      toast.success(
        category.isActive
          ? `"${category.name}" deactivated`
          : `"${category.name}" activated`
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      {/* ===== Top Actions ===== */}
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
          <i className="fa-solid fa-info-circle me-1"></i>
          Changes apply instantly to the whole site.
        </div>
        <button
          onClick={() => openCreate(0)}
          disabled={saving}
          style={primaryBtnStyle}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
          Add Main Category
        </button>
      </div>

      {/* ===== Cards Grid ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {mainCategories.map((cat) => {
          const subs = getSubs(cat.id);

          // âœ… شمارش با ID
          const productCount = productCounts[cat.id] || 0;
          const requestCount = requestCounts[cat.id] || 0;

          return (
            <div
              key={cat.id}
              className="admin-card"
              style={{
                opacity: cat.isActive ? 1 : 0.55,
                borderLeft: cat.isActive
                  ? "3px solid #0f9e6e"
                  : "3px solid #cbd5d1",
              }}
            >
              <div className="admin-card-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="admin-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {cat.name}
                    {!cat.isActive && (
                      <span
                        style={{
                          fontSize: 9,
                          background: "#f1f5f9",
                          color: "#64748b",
                          padding: "2px 8px",
                          borderRadius: 50,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="admin-subtitle">
                    {subs.length} subcategories · {productCount} products ·{" "}
                    {requestCount} requests
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <IconBtn
                    title={cat.isActive ? "Deactivate" : "Activate"}
                    onClick={() => handleToggleActive(cat)}
                  >
                    <i
                      className={`fa-solid ${
                        cat.isActive ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </IconBtn>
                  <IconBtn title="Edit" onClick={() => openEdit(cat)}>
                    <i className="fa-solid fa-pen"></i>
                  </IconBtn>
                  <IconBtn
                    title="Delete"
                    onClick={() => handleDelete(cat)}
                    danger
                  >
                    <i className="fa-solid fa-trash"></i>
                  </IconBtn>
                </div>
              </div>

              {/* Subcategories */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {subs.length === 0 ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      fontStyle: "italic",
                    }}
                  >
                    No subcategories yet
                  </span>
                ) : (
                  subs.map((sub) => (
                    <span
                      key={sub.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px 4px 12px",
                        borderRadius: 50,
                        background: sub.isActive ? "#f0faf6" : "#f1f5f7",
                        color: sub.isActive ? "#0b5b43" : "#94a3b8",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      title={
                        sub.productTypes?.length
                          ? `${sub.productTypes.length} product types`
                          : ""
                      }
                    >
                      {sub.name}
                      {sub.productTypes?.length > 0 && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "white",
                            padding: "1px 6px",
                            borderRadius: 50,
                            color: "#13795b",
                            fontWeight: 700,
                          }}
                        >
                          {sub.productTypes.length}
                        </span>
                      )}
                      <button
                        onClick={() => openEdit(sub)}
                        style={chipBtnStyle}
                        title="Edit"
                      >
                        <i
                          className="fa-solid fa-pen"
                          style={{ fontSize: 9 }}
                        ></i>
                      </button>
                      <button
                        onClick={() => handleDelete(sub)}
                        style={{ ...chipBtnStyle, color: "#dc2626" }}
                        title="Delete"
                      >
                        <i
                          className="fa-solid fa-times"
                          style={{ fontSize: 10 }}
                        ></i>
                      </button>
                    </span>
                  ))
                )}

                <button
                  onClick={() => openCreate(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 50,
                    background: "transparent",
                    border: "1px dashed #cbd5d1",
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <i
                    className="fa-solid fa-plus"
                    style={{ fontSize: 9 }}
                  ></i>
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Modal ===== */}
      {modal.open && (
        <div onClick={closeModal} style={overlayStyle}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={modalStyle}
          >
            <h3 style={modalTitleStyle}>
              {modal.mode === "create"
                ? modal.parentId === 0
                  ? "New Main Category"
                  : "New Subcategory"
                : "Edit Category"}
            </h3>
            <p style={modalSubtitleStyle}>
              {modal.mode === "create" && modal.parentId !== 0
                ? `Under: ${
                    categories.find((c) => c.id === modal.parentId)?.name ||
                    "â€”"
                  }`
                : modal.mode === "edit"
                  ? `ID: ${modal.category?.id}`
                  : "Enter the name for the new category"}
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g., Organic Honey"
                autoFocus
                required
                style={inputStyle}
                disabled={saving}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Icon (optional)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value }))
                }
                placeholder="e.g., fa-drumstick-bite"
                style={inputStyle}
                disabled={saving}
              />
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginTop: 4,
                }}
              >
                Font Awesome class name (e.g. fa-leaf or fa-crown)
              </div>
            </div>

            {/* âœ… نمایش فقط-خواندنی productTypes در حالت edit */}
            {modal.mode === "edit" &&
              modal.category?.parent !== 0 &&
              modal.category?.productTypes?.length > 0 && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: 12,
                    background: "#f9fbfa",
                    borderRadius: 10,
                    border: "1px solid #eef2f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#71807b",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Product Types ({modal.category.productTypes.length})
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#33413d",
                      lineHeight: 1.6,
                    }}
                  >
                    {modal.category.productTypes.join(", ")}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#94a3b8",
                      marginTop: 6,
                    }}
                  >
                    <i className="fa-solid fa-info-circle me-1"></i>
                    To edit product types, modify the JSON file directly.
                  </div>
                </div>
              )}

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
    </>
  );
}

// ====== Helpers ======
function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: "var(--bg)",
        color: danger ? "#dc2626" : "#64748b",
        border: 0,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        fontSize: 11,
      }}
    >
      {children}
    </button>
  );
}

const chipBtnStyle = {
  background: "transparent",
  border: 0,
  cursor: "pointer",
  color: "#64748b",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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
  maxWidth: 440,
  width: "100%",
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
};