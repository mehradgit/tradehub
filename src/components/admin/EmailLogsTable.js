// src/components/admin/EmailLogsTable.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

// ============================================================
// نگاشت وضعیت به کلاس و برچسب
// ============================================================
const STATUS_META = {
  queued: { cls: "pending", label: "Queued" },
  sent: { cls: "active", label: "Sent" },
  failed: { cls: "suspended", label: "Failed" },
  permanently_failed: { cls: "suspended", label: "Permanent fail" },
  bounced: { cls: "suspended", label: "Bounced" },
};

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: "11px",
  cursor: "pointer",
  color: "var(--text)",
  textDecoration: "none",
};

export default function EmailLogsTable({ logs = [] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  const retry = async (id) => {
    setBusyId(id);
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
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this email log?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/email-logs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("Log deleted");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
        <i
          className="fa-solid fa-envelope-open"
          style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}
        ></i>
        <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
          No email logs found. Trigger an event (register, inquiry, ticket…) to
          see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Template</th>
              <th>Attempts</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const meta =
                STATUS_META[log.status] || {
                  cls: "basic",
                  label: log.status,
                };
              const busy = busyId === log.id;
              const canRetry = log.status !== "sent";

              return (
                <tr key={log.id}>
                  <td>
                    <span className={`admin-pill ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </td>

                  <td style={{ fontSize: "11px" }}>{log.toEmail}</td>

                  <td style={{ maxWidth: "300px" }}>
                    <Link
                      href={`/admin/emails/${log.id}`}
                      style={{ color: "var(--text)", fontWeight: 600 }}
                    >
                      {log.subject}
                    </Link>
                    {log.errorMessage && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#e75e5e",
                          marginTop: "3px",
                          lineHeight: 1.5,
                        }}
                      >
                        {String(log.errorMessage).slice(0, 140)}
                      </div>
                    )}
                    {log.nextRetryAt && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--muted)",
                          marginTop: "2px",
                        }}
                      >
                        Next retry: {formatDate(log.nextRetryAt)}
                      </div>
                    )}
                  </td>

                  <td style={{ fontSize: "11px" }}>
                    {log.templateKey ? (
                      <code style={{ fontSize: "10px" }}>
                        {log.templateKey}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td style={{ fontSize: "11px" }}>
                    {log.retryCount}/{log.maxRetries}
                  </td>

                  <td style={{ fontSize: "11px" }}>
                    {formatDate(log.createdAt)}
                  </td>

                  <td>
                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      <Link
                        href={`/admin/emails/${log.id}`}
                        style={btnStyle}
                        title="View details"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </Link>

                      {canRetry && (
                        <button
                          type="button"
                          style={{
                            ...btnStyle,
                            color: "#12885f",
                            borderColor: "#bfe3d3",
                          }}
                          onClick={() => retry(log.id)}
                          disabled={busy}
                          title="Retry sending"
                        >
                          <i
                            className={`fa-solid ${
                              busy ? "fa-spinner fa-spin" : "fa-rotate-right"
                            }`}
                          ></i>
                        </button>
                      )}

                      <button
                        type="button"
                        style={{
                          ...btnStyle,
                          color: "#e75e5e",
                          borderColor: "#f5c9c4",
                        }}
                        onClick={() => remove(log.id)}
                        disabled={busy}
                        title="Delete log"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
