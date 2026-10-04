// src/components/admin/EmailLogActions.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "9px 14px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  color: "var(--text)",
};

export default function EmailLogActions({ id, status, html = "" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);

  const retry = async () => {
    setBusy("retry");
    try {
      const res = await fetch(`/api/admin/email-logs/${id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Retry failed");
      toast.success(data.message || "Email re-sent");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this email log permanently?")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/email-logs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("Log deleted");
      router.push("/admin/emails");
    } catch (e) {
      toast.error(e.message);
      setBusy(null);
    }
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html || "");
      toast.success("HTML copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {status !== "sent" && (
        <button
          type="button"
          style={{ ...btnStyle, color: "#12885f", borderColor: "#bfe3d3" }}
          onClick={retry}
          disabled={busy !== null}
        >
          <i
            className={`fa-solid ${
              busy === "retry" ? "fa-spinner fa-spin" : "fa-rotate-right"
            }`}
          ></i>
          Retry
        </button>
      )}

      {html && (
        <button
          type="button"
          style={btnStyle}
          onClick={copyHtml}
          disabled={busy !== null}
        >
          <i className="fa-solid fa-code"></i>
          Copy HTML
        </button>
      )}

      <button
        type="button"
        style={{ ...btnStyle, color: "#e75e5e", borderColor: "#f5c9c4" }}
        onClick={remove}
        disabled={busy !== null}
      >
        <i
          className={`fa-solid ${
            busy === "delete" ? "fa-spinner fa-spin" : "fa-trash"
          }`}
        ></i>
        Delete
      </button>
    </div>
  );
}
