// src/components/admin/VocabularyManager.js
"use client";
// ============================================================
// ویرایشگر واژگان کنترل‌شده
//
// هر گروه یک کارت است: چیپ‌های قابل حذف + ورودی افزودن.
// «Save» فقط همان کلید را می‌فرستد (سرور با مقادیر فعلی ادغام
// می‌کند) و «Save all» همه‌ی گروه‌ها را یک‌جا ذخیره می‌کند.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const MAX_ITEMS = 200;
const MAX_ITEM_LENGTH = 120;

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

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "9px",
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  color: "var(--text)",
};

// ============================================================
// نرمال‌سازی ورودی سرور برای state داخلی
// ============================================================
function fromGroups(groups) {
  return (Array.isArray(groups) ? groups : []).map((g) => ({
    key: g.key,
    label: g.label,
    items: (Array.isArray(g.items) ? g.items : []).map((i) => ({
      value: i.value,
      label: i.label || i.value,
    })),
  }));
}

function makeDrafts(groups) {
  return Object.fromEntries(
    (Array.isArray(groups) ? groups : []).map((g) => [g.key, ""])
  );
}

export default function VocabularyManager({ groups = [] }) {
  const router = useRouter();

  const [lists, setLists] = useState(() => fromGroups(groups));
  const [drafts, setDrafts] = useState(() => makeDrafts(groups));
  const [busy, setBusy] = useState(null); // key یا "__all__"

  // ===== جایگزینی state با پاسخ سرور (منبع حقیقت) =====
  const applyGroups = (next) => {
    setLists(fromGroups(next));
    setDrafts(makeDrafts(next));
  };

  // ===== افزودن یک آیتم به یک گروه =====
  const addItem = (key) => {
    const list = lists.find((l) => l.key === key);
    if (!list) return;

    const raw = (drafts[key] || "").trim();

    if (!raw) {
      toast.warning("Type a value first");
      return;
    }

    if (raw.length > MAX_ITEM_LENGTH) {
      toast.warning(`Values can be at most ${MAX_ITEM_LENGTH} characters`);
      return;
    }

    // جلوگیری از تکرار بدون حساسیت به بزرگی/کوچکی حروف
    if (
      list.items.some(
        (i) => String(i.value).toLowerCase() === raw.toLowerCase()
      )
    ) {
      toast.warning(`"${raw}" is already in ${list.label}`);
      return;
    }

    if (list.items.length >= MAX_ITEMS) {
      toast.warning(`${list.label} already has the maximum of ${MAX_ITEMS} items`);
      return;
    }

    setLists((prev) =>
      prev.map((l) =>
        l.key === key ? { ...l, items: [...l.items, { value: raw, label: raw }] } : l
      )
    );
    setDrafts((d) => ({ ...d, [key]: "" }));
  };

  // ===== حذف یک آیتم =====
  const removeItem = (key, value) => {
    setLists((prev) =>
      prev.map((l) =>
        l.key === key
          ? { ...l, items: l.items.filter((i) => i.value !== value) }
          : l
      )
    );
  };

  // ===== ذخیره‌ی یک گروه یا همه =====
  const save = async (mode, key = null) => {
    const target = mode === "all" ? lists : lists.filter((l) => l.key === key);
    if (target.length === 0) return;

    const empty = target.find((l) => l.items.length === 0);
    if (empty) {
      toast.warning(
        `"${empty.label}" cannot be empty — add at least one item before saving`
      );
      return;
    }

    const busyKey = mode === "all" ? "__all__" : key;
    setBusy(busyKey);

    try {
      const body = Object.fromEntries(
        target.map((l) => [l.key, l.items.map((i) => i.value)])
      );

      const res = await fetch("/api/admin/vocabularies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      if (Array.isArray(data.groups)) applyGroups(data.groups);

      toast.success(data.message || "Vocabularies saved");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (lists.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
        <i
          className="fa-solid fa-list"
          style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}
        ></i>
        <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
          No vocabulary groups are declared in{" "}
          <code>src/lib/vocabularies.js</code>.
        </p>
      </div>
    );
  }

  const totalItems = lists.reduce((sum, l) => sum + l.items.length, 0);

  return (
    <>
      {/* ===== نوار بالا: ذخیره‌ی همه ===== */}
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
          {lists.length} lists · {totalItems} values · changes apply to the
          search filters and the create forms
        </div>

        <button
          type="button"
          style={{
            ...btnStyle,
            background: "var(--green2)",
            color: "#fff",
            borderColor: "var(--green2)",
          }}
          onClick={() => save("all")}
          disabled={busy !== null}
        >
          <i
            className={`fa-solid ${
              busy === "__all__" ? "fa-spinner fa-spin" : "fa-floppy-disk"
            }`}
          ></i>
          Save all
        </button>
      </div>

      {/* ===== کارت هر گروه ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
          gap: "12px",
          alignItems: "start",
        }}
      >
        {lists.map((list) => (
          <div className="admin-card" key={list.key}>
            <div className="admin-card-head">
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "var(--dark)",
                  }}
                >
                  {list.label}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--muted)",
                    marginTop: "3px",
                  }}
                >
                  {list.items.length} item(s) · <code>{list.key}</code>
                </div>
              </div>

              <button
                type="button"
                style={btnStyle}
                onClick={() => save("one", list.key)}
                disabled={busy !== null}
                title={`Save ${list.label}`}
              >
                <i
                  className={`fa-solid ${
                    busy === list.key ? "fa-spinner fa-spin" : "fa-floppy-disk"
                  }`}
                ></i>
                Save
              </button>
            </div>

            {/* ===== چیپ‌ها ===== */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                minHeight: "30px",
                marginBottom: "10px",
              }}
            >
              {list.items.length === 0 ? (
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  No items yet — add one below.
                </span>
              ) : (
                list.items.map((item) => (
                  <span
                    key={item.value}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 6px 4px 9px",
                      borderRadius: "20px",
                      background: "#f1f5f3",
                      border: "1px solid var(--line)",
                      fontSize: "11px",
                      color: "var(--text)",
                    }}
                  >
                    {item.label}
                    <button
                      type="button"
                      onClick={() => removeItem(list.key, item.value)}
                      title={`Remove ${item.label}`}
                      style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--muted)",
                        fontSize: "11px",
                        lineHeight: 1,
                        padding: "2px",
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* ===== افزودن ===== */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                style={inputStyle}
                value={drafts[list.key] || ""}
                placeholder="Add a new value…"
                maxLength={MAX_ITEM_LENGTH}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [list.key]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem(list.key);
                  }
                }}
              />
              <button
                type="button"
                style={btnStyle}
                onClick={() => addItem(list.key)}
              >
                <i className="fa-solid fa-plus"></i>
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
