// src/components/admin/EmailTemplateEditor.js
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const CATEGORIES = ["transactional", "behavioral", "marketing", "system"];

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

function toForm(tpl) {
  if (!tpl) {
    return {
      name: "",
      description: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      category: "transactional",
      isActive: true,
    };
  }
  return {
    name: tpl.name || "",
    description: tpl.description || "",
    subject: tpl.subject || "",
    htmlBody: tpl.htmlBody || "",
    textBody: tpl.textBody || "",
    category: tpl.category || "transactional",
    isActive: tpl.isActive !== false,
  };
}

function extractVariables(text) {
  const found = new Set();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(text || ""))) !== null) found.add(m[1]);
  return [...found];
}

export default function EmailTemplateEditor({ templates = [] }) {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState(templates[0]?.id || null);
  const [form, setForm] = useState(() => toForm(templates[0]));
  const [busy, setBusy] = useState(null);

  const selected = templates.find((t) => t.id === selectedId) || null;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const select = (tpl) => {
    setSelectedId(tpl.id);
    setForm(toForm(tpl));
  };

  // ===== Variables used vs. variables declared =====
  const declared = useMemo(
    () => (Array.isArray(selected?.variables) ? selected.variables : []),
    [selected]
  );

  const used = useMemo(
    () => extractVariables(`${form.subject} ${form.htmlBody}`),
    [form.subject, form.htmlBody]
  );

  const undeclared = used.filter((v) => !declared.includes(v));
  const unusedDeclared = declared.filter((v) => !used.includes(v));

  const save = async () => {
    if (!selected) return;
    setBusy("save");
    try {
      const res = await fetch(`/api/admin/email-templates/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      if (Array.isArray(data.warnings)) {
        data.warnings.forEach((w) => toast.warn(w));
      }
      toast.success("Template saved");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    if (!selected) return;
    setBusy("test");
    try {
      const res = await fetch(
        `/api/admin/email-templates/${selected.id}/test`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Test failed");
      toast.success(data.message || "Test email sent");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (templates.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
        <i
          className="fa-solid fa-file-code"
          style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}
        ></i>
        <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 8px" }}>
          No email templates in the database yet.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 11, margin: 0 }}>
          Run <code>node scripts/seed-email-templates.js</code> and reload this
          page.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* ===== Template list ===== */}
      <div
        className="admin-card"
        style={{ width: "270px", flexShrink: 0, padding: "10px" }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--muted)",
            padding: "6px 8px",
            textTransform: "uppercase",
            letterSpacing: ".4px",
          }}
        >
          Templates ({templates.length})
        </div>

        <div style={{ maxHeight: "620px", overflowY: "auto" }}>
          {templates.map((tpl) => {
            const isActive = tpl.id === selectedId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => select(tpl)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 10px",
                  marginBottom: "3px",
                  borderRadius: "8px",
                  border: 0,
                  cursor: "pointer",
                  background: isActive ? "#e8f6f0" : "transparent",
                  color: isActive ? "#12885f" : "var(--text)",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700 }}>
                  {tpl.name || tpl.key}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  <code>{tpl.key}</code>
                  {tpl.isActive === false && (
                    <span style={{ color: "#e75e5e" }}> · inactive</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Edit form ===== */}
      <div className="admin-card" style={{ flex: 1, minWidth: "380px", padding: "18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--dark)" }}>
              {selected?.name || selected?.key}
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
              key: <code>{selected?.key}</code>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              style={btnStyle}
              onClick={sendTest}
              disabled={busy !== null}
              title="Send a test email to your own admin address"
            >
              <i
                className={`fa-solid ${
                  busy === "test" ? "fa-spinner fa-spin" : "fa-paper-plane"
                }`}
              ></i>
              Send test
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
              Save
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "13px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div style={{ width: "160px" }}>
              <label style={labelStyle}>Category</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: "8px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "11px",
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                Active
              </label>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Subject</label>
            <input
              style={inputStyle}
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>HTML body</label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: "300px",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: "10px",
                lineHeight: 1.6,
                resize: "vertical",
              }}
              value={form.htmlBody}
              onChange={(e) => set("htmlBody", e.target.value)}
              spellCheck={false}
            />
          </div>

          <div>
            <label style={labelStyle}>Plain-text body (optional)</label>
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
              value={form.textBody}
              onChange={(e) => set("textBody", e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* ===== Variables ===== */}
          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: "13px",
              fontSize: "10px",
              lineHeight: 1.9,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>
              AVAILABLE VARIABLES
            </div>

            {declared.length === 0 ? (
              <span style={{ color: "var(--muted)" }}>
                None declared for this template.
              </span>
            ) : (
              declared.map((v) => (
                <code
                  key={v}
                  style={{
                    display: "inline-block",
                    padding: "2px 7px",
                    marginRight: "5px",
                    marginBottom: "5px",
                    background: "#f1f5f3",
                    borderRadius: "5px",
                    color: unusedDeclared.includes(v) ? "#ef9d1f" : "#12885f",
                  }}
                  title={
                    unusedDeclared.includes(v)
                      ? "Declared but not used in the subject/body"
                      : "Used"
                  }
                >
                  {`{{${v}}}`}
                </code>
              ))
            )}

            {undeclared.length > 0 && (
              <div style={{ color: "#e75e5e", marginTop: "8px" }}>
                <i className="fa-solid fa-triangle-exclamation"></i> Used but not
                declared: {undeclared.map((v) => `{{${v}}}`).join(", ")}
              </div>
            )}

            <div
              style={{
                color: "var(--muted)",
                marginTop: "10px",
                fontSize: "10px",
              }}
            >
              “Send test” renders this template with sample values and emails it
              to your own admin address.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
