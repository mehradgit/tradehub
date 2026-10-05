// src/components/admin/ItemPickerModal.js
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

export default function ItemPickerModal({
  isOpen,
  onClose,
  type = "products",
  selectedIds = [],
  onSave,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState([...selectedIds]);
  const [itemCache, setItemCache] = useState({}); // id → item data

  // ===== Fetch on open / query change =====
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/items/search?type=${type}&q=${encodeURIComponent(
            query
          )}&limit=30`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setResults(data.items || []);

        // cache it
        const newCache = { ...itemCache };
        for (const item of data.items || []) {
          newCache[item.id] = item;
        }
        setItemCache(newCache);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, query, type]);

  // ===== Reset on open =====
  useEffect(() => {
    if (isOpen) {
      setOrder([...selectedIds]);
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ===== Fetch missing cached items for selected IDs =====
  useEffect(() => {
    if (!isOpen || selectedIds.length === 0) return;
    const missing = selectedIds.filter((id) => !itemCache[id]);
    if (missing.length === 0) return;

    // Fetch all by ID (empty query)
    fetch(`/api/admin/items/search?type=${type}&q=&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const newCache = { ...itemCache };
        for (const item of data.items || []) {
          newCache[item.id] = item;
        }
        setItemCache(newCache);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedIds]);

  const toggle = useCallback((id) => {
    setOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const remove = (id) => {
    setOrder((prev) => prev.filter((x) => x !== id));
  };

  const handleSave = () => {
    onSave(order);
    onClose();
  };

  if (!isOpen) return null;

  const selectedSet = new Set(order);

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h3 style={titleStyle}>
              <i
                className={`fa-solid ${
                  type === "products" ? "fa-box" : "fa-shopping-cart"
                }`}
                style={{ marginRight: 8, color: "#13795b" }}
              ></i>
              Select {type === "products" ? "Products" : "Requests"}
            </h3>
            <p style={subtitleStyle}>
              {order.length} selected · drag or use arrows to reorder
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Selected List */}
        {order.length > 0 && (
          <div
            style={{
              padding: "12px 20px",
              background: "#f8fdfb",
              borderBottom: "1px solid #d1ede0",
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#0b5b43",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Selected ({order.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {order.map((id, index) => {
                const item = itemCache[id];
                return (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      background: "white",
                      border: "1px solid #d1ede0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: "#eaf7f1",
                        color: "#0b5b43",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        color: "#13251f",
                      }}
                    >
                      {item?.title || id}
                    </span>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      style={miniBtnStyle}
                      title="Move up"
                    >
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === order.length - 1}
                      style={miniBtnStyle}
                      title="Move down"
                    >
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      style={{ ...miniBtnStyle, color: "#dc2626" }}
                      title="Remove"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #e8edf0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "#f6f8f9",
              borderRadius: 10,
              border: "1px solid #e8edf0",
            }}
          >
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ color: "#94a3b8", fontSize: 12 }}
            ></i>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${
                type === "products" ? "products" : "requests"
              }...`}
              autoFocus
              style={{
                flex: 1,
                border: 0,
                outline: 0,
                background: "transparent",
                fontSize: 13,
                padding: 0,
                color: "#13251f",
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 0,
                  fontSize: 11,
                }}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px",
            minHeight: 240,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              <div className="spinner-border spinner-border-sm text-primary"></div>
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              <i
                className="fa-solid fa-inbox"
                style={{
                  fontSize: 32,
                  opacity: 0.3,
                  display: "block",
                  marginBottom: 8,
                }}
              ></i>
              {query
                ? "No results for your search"
                : "Type to search..."}
            </div>
          ) : (
            results.map((item) => {
              const isSelected = selectedSet.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: isSelected ? "#eaf7f1" : "transparent",
                    border: `1px solid ${
                      isSelected ? "#a7f3d0" : "transparent"
                    }`,
                    borderRadius: 10,
                    cursor: "pointer",
                    marginBottom: 4,
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* Checkbox */}
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${
                        isSelected ? "#13795b" : "#cbd5d1"
                      }`,
                      background: isSelected ? "#13795b" : "white",
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <i className="fa-solid fa-check"></i>}
                  </span>

                  {/* Image */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#f1f5f7",
                        display: "grid",
                        placeItems: "center",
                        color: "#94a3b8",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={`fa-solid ${
                          type === "products" ? "fa-box" : "fa-file-alt"
                        }`}
                      ></i>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#13251f",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#71807b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 2,
                      }}
                    >
                      {item.subtitle}
                      {item.meta && ` · ${item.meta}`}
                    </div>
                  </div>

                  {item.isUrgent && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 50,
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        flexShrink: 0,
                      }}
                    >
                      Urgent
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e8edf0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: "#71807b" }}>
            <i className="fa-solid fa-info-circle me-1"></i>
            Click items to add/remove · use ↑↓ to reorder
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={secondaryBtnStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={primaryBtnStyle}
            >
              <i className="fa-solid fa-check me-2"></i>
              Save Selection ({order.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Styles =====
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(6px)",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  background: "white",
  borderRadius: 20,
  width: "100%",
  maxWidth: 720,
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
};

const headerStyle = {
  padding: "18px 20px",
  borderBottom: "1px solid #e8edf0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const titleStyle = {
  font: "800 15px 'Manrope', sans-serif",
  color: "#13251f",
  margin: 0,
  display: "flex",
  alignItems: "center",
};

const subtitleStyle = {
  fontSize: 12,
  color: "#71807b",
  margin: "4px 0 0 0",
};

const closeBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "transparent",
  border: 0,
  color: "#71807b",
  cursor: "pointer",
  fontSize: 14,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const miniBtnStyle = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: "transparent",
  border: "1px solid #e8edf0",
  color: "#64748b",
  cursor: "pointer",
  fontSize: 9,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
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