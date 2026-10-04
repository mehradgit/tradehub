// src/components/admin/EmailBulkActions.js
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

export default function EmailBulkActions({ failedCount = 0 }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);

  const run = async (action, fallbackLabel) => {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/email-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `${fallbackLabel} failed`);
      toast.success(data.message || fallbackLabel);
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <button
        type="button"
        style={btnStyle}
        onClick={() => run("process-queue", "Queue processed")}
        disabled={busy !== null}
      >
        <i
          className={`fa-solid ${
            busy === "process-queue" ? "fa-spinner fa-spin" : "fa-play"
          }`}
        ></i>
        Process queue
      </button>

      <button
        type="button"
        style={{
          ...btnStyle,
          color: failedCount > 0 ? "#12885f" : "var(--muted)",
          borderColor: failedCount > 0 ? "#bfe3d3" : "var(--line)",
        }}
        onClick={() => run("retry-all-failed", "Failed emails retried")}
        disabled={busy !== null || failedCount === 0}
        title={
          failedCount === 0
            ? "No failed emails to retry"
            : `Retry ${failedCount} failed email(s)`
        }
      >
        <i
          className={`fa-solid ${
            busy === "retry-all-failed" ? "fa-spinner fa-spin" : "fa-rotate-right"
          }`}
        ></i>
        Retry all failed{failedCount > 0 ? ` (${failedCount})` : ""}
      </button>
    </div>
  );
}
