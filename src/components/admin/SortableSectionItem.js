// src/components/admin/SortableSectionItem.js
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableSectionItem({
    section,
    index,
    totalCount,
    onToggleActive,
    onEdit,
    onDelete,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : "auto",
        position: "relative",
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div
                className="admin-card"
                style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    opacity: section.isActive ? 1 : 0.55,
                    borderLeft: section.isActive
                        ? "4px solid #0f9e6e"
                        : "4px solid #cbd5d1",
                    boxShadow: isDragging
                        ? "0 20px 60px rgba(15, 158, 110, 0.3)"
                        : undefined,
                    transition: "box-shadow 0.2s ease",
                    cursor: isDragging ? "grabbing" : "default",
                }}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    style={{
                        cursor: "grab",
                        padding: "10px 6px",
                        display: "grid",
                        placeItems: "center",
                        color: "#94a3b8",
                        fontSize: 14,
                        flexShrink: 0,
                        borderRadius: 8,
                        transition: "all 0.15s ease",
                    }}
                    title="Drag to reorder"
                >
                    <i className="fa-solid fa-grip-vertical"></i>
                </div>

                {/* Order Number */}
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: "var(--bg)",
                        color: "#71807b",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                    }}
                >
                    {index + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 15,
                                fontWeight: 800,
                                color: "#0b1f18",
                                fontFamily: "Manrope, sans-serif",
                            }}
                        >
                            {section.title}
                        </span>

                        <Pill color="blue">
                            <i
                                className={`fa-solid ${section.type === "products" ? "fa-box" : "fa-shopping-cart"
                                    }`}
                                style={{ fontSize: 9, marginRight: 4 }}
                            ></i>
                            {section.type}
                        </Pill>

                        {section.mode === "manual" ? (
                            <Pill color="purple">
                                <i
                                    className="fa-solid fa-hand-pointer"
                                    style={{ fontSize: 9, marginRight: 4 }}
                                ></i>
                                Manual ({section.itemIds?.length || 0})
                            </Pill>
                        ) : section.mode === "category" ? (
                            <Pill color="amber">
                                <i
                                    className="fa-solid fa-tag"
                                    style={{ fontSize: 9, marginRight: 4 }}
                                ></i>
                                {section.category}
                                {section.subCategory && ` › ${section.subCategory}`}
                            </Pill>
                        ) : (
                            <Pill color="gray">Latest</Pill>
                        )}

                        {section.mode !== "manual" && (
                            <Pill color="gray">{section.limit} items</Pill>
                        )}

                        {!section.isActive && <Pill color="red">Inactive</Pill>}
                    </div>
                    {section.position && section.position !== "top" && (
                        <Pill color="blue">
                            <i
                                className={`fa-solid ${section.position === "after-companies"
                                        ? "fa-arrow-down"
                                        : "fa-arrow-down-long"
                                    }`}
                                style={{ fontSize: 9, marginRight: 4 }}
                            ></i>
                            {section.position === "after-companies"
                                ? "After Partners"
                                : "Before CTA"}
                        </Pill>
                    )}
                    {section.subtitle && (
                        <div
                            style={{
                                fontSize: 12,
                                color: "#71807b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {section.subtitle}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <ActionBtn
                        title={section.isActive ? "Deactivate" : "Activate"}
                        onClick={() => onToggleActive(section)}
                    >
                        <i
                            className={`fa-solid ${section.isActive ? "fa-eye-slash" : "fa-eye"
                                }`}
                        ></i>
                    </ActionBtn>
                    <ActionBtn title="Edit" onClick={() => onEdit(section)}>
                        <i className="fa-solid fa-pen"></i>
                    </ActionBtn>
                    <ActionBtn
                        title="Delete"
                        onClick={() => onDelete(section)}
                        danger
                    >
                        <i className="fa-solid fa-trash"></i>
                    </ActionBtn>
                </div>
            </div>
        </div>
    );
}

// ====== Helpers ======
function Pill({ color, children }) {
    const colors = {
        blue: { bg: "#eef0ff", fg: "#4f46e5" },
        amber: { bg: "#fff7e6", fg: "#b45309" },
        gray: { bg: "#f1f5f7", fg: "#64748b" },
        red: { bg: "#fef2f2", fg: "#dc2626" },
        purple: { bg: "#f3efff", fg: "#8b5cf6" },
    };
    const c = colors[color] || colors.gray;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 9px",
                borderRadius: 50,
                background: c.bg,
                color: c.fg,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    );
}

function ActionBtn({ children, onClick, title, danger }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                width: 30,
                height: 30,
                borderRadius: 8,
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