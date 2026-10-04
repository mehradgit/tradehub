// src/components/admin/ScheduledJobsManager.js
"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--muted)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: ".4px",
};

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relative(dt) {
  if (!dt) return "";
  const diff = new Date(dt).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);

  let text;
  if (mins < 1) text = "less than a minute";
  else if (mins < 60) text = `${mins} min`;
  else if (mins < 1440) text = `${Math.round(mins / 60)} h`;
  else text = `${Math.round(mins / 1440)} d`;

  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

const STATUS_META = {
  success: { cls: "active", label: "Success" },
  failed: { cls: "suspended", label: "Failed" },
  running: { cls: "pending", label: "Running" },
};

export default function ScheduledJobsManager({
  initialJobs = [],
  presets = [],
  availableHandlers = [],
}) {
  const router = useRouter();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    cronExpression: "",
    isActive: true,
  });
  const [busy, setBusy] = useState(null); // `${id}:${action}`

  const startEdit = (job) => {
    setEditingId(job.id);
    setForm({
      name: job.name || "",
      description: job.description || "",
      cronExpression: job.cronExpression || "",
      isActive: job.isActive !== false,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // ===== اجرای فوری =====
  const runNow = async (job) => {
    setBusy(`${job.id}:run`);
    try {
      const res = await fetch(`/api/admin/scheduled-jobs/${job.id}/run`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Run failed");

      if (data.ok) toast.success(data.message || "Job finished");
      else toast.error(data.message || "Job failed");

      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  // ===== روشن/خاموش =====
  const toggleActive = async (job) => {
    setBusy(`${job.id}:toggle`);
    try {
      const res = await fetch(`/api/admin/scheduled-jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !job.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      toast.success(job.isActive ? "Job disabled" : "Job enabled");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  // ===== ذخیره =====
  const save = async () => {
    if (!editingId) return;
    setBusy(`${editingId}:save`);
    try {
      const res = await fetch(`/api/admin/scheduled-jobs/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      toast.success("Job saved");
      setEditingId(null);
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (initialJobs.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
        <i
          className="fa-solid fa-clock-rotate-left"
          style={{ fontSize: 40, color: "#d1dbd6", marginBottom: 12 }}
        ></i>
        <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
          No scheduled jobs yet. They are created automatically the first time
          the scheduler runs.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 8 }}>
          Run: <code>sudo /usr/local/bin/foodtrade-cron tick</code>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Schedule</th>
                <th>Next run</th>
                <th>Last run</th>
                <th>Counts</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialJobs.map((job) => {
                const status = STATUS_META[job.lastRunStatus] || {
                  cls: "basic",
                  label: job.lastRunStatus || "Never run",
                };
                const isEditing = editingId === job.id;
                const runBusy = busy === `${job.id}:run`;
                const toggleBusy = busy === `${job.id}:toggle`;

                return (
                  <Fragment key={job.id}>
                    <tr>
                      <td style={{ maxWidth: "260px" }}>
                        <div style={{ fontWeight: 700, fontSize: "11px" }}>
                          {job.name}
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "var(--muted)",
                            marginTop: "2px",
                          }}
                        >
                          <code>{job.jobKey}</code>
                        </div>
                        {!job.handlerExists && (
                          <div style={{ fontSize: "10px", color: "#e75e5e" }}>
                            handler missing in code
                          </div>
                        )}
                        {job.lastRunError && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#e75e5e",
                              marginTop: "3px",
                              lineHeight: 1.5,
                            }}
                          >
                            {String(job.lastRunError).slice(0, 110)}
                          </div>
                        )}
                      </td>

                      <td>
                        <code style={{ fontSize: "10px" }}>
                          {job.cronExpression}
                        </code>
                        {!job.scheduleValid && (
                          <div style={{ fontSize: "10px", color: "#e75e5e" }}>
                            {job.scheduleError}
                          </div>
                        )}
                      </td>

                      <td style={{ fontSize: "11px" }}>
                        {job.isActive ? (
                          <>
                            {fmt(job.nextRunAt)}
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--muted)",
                              }}
                            >
                              {relative(job.nextRunAt)}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>
                            disabled
                          </span>
                        )}
                      </td>

                      <td style={{ fontSize: "11px" }}>
                        {fmt(job.lastRunAt)}
                        <div style={{ marginTop: "2px" }}>
                          <span className={`admin-pill ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                      </td>

                      <td style={{ fontSize: "11px" }}>
                        <span title="Successful runs">{job.runCount} runs</span>
                        {job.failCount > 0 && (
                          <div style={{ color: "#e75e5e", fontSize: "10px" }}>
                            {job.failCount} failed
                          </div>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => toggleActive(job)}
                          disabled={toggleBusy}
                          title={job.isActive ? "Disable" : "Enable"}
                          style={{
                            ...btnStyle,
                            padding: "5px 10px",
                            color: job.isActive ? "#12885f" : "var(--muted)",
                            borderColor: job.isActive
                              ? "#bfe3d3"
                              : "var(--line)",
                          }}
                        >
                          <i
                            className={`fa-solid ${
                              toggleBusy
                                ? "fa-spinner fa-spin"
                                : job.isActive
                                ? "fa-toggle-on"
                                : "fa-toggle-off"
                            }`}
                          ></i>
                        </button>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            style={{ ...btnStyle, color: "#12885f", borderColor: "#bfe3d3" }}
                            onClick={() => runNow(job)}
                            disabled={runBusy}
                            title="Run now (ignores the schedule)"
                          >
                            <i
                              className={`fa-solid ${
                                runBusy ? "fa-spinner fa-spin" : "fa-play"
                              }`}
                            ></i>
                          </button>

                          <button
                            type="button"
                            style={btnStyle}
                            onClick={() =>
                              isEditing ? cancelEdit() : startEdit(job)
                            }
                            title="Edit schedule"
                          >
                            <i
                              className={`fa-solid ${
                                isEditing ? "fa-xmark" : "fa-pen"
                              }`}
                            ></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isEditing && (
                      <tr>
                        <td colSpan={7} style={{ background: "#fafcfb" }}>
                          <div
                            style={{
                              display: "grid",
                              gap: "12px",
                              padding: "6px 0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: "200px" }}>
                                <label style={labelStyle}>Name</label>
                                <input
                                  style={inputStyle}
                                  value={form.name}
                                  onChange={(e) => set("name", e.target.value)}
                                />
                              </div>

                              <div style={{ flex: 2, minWidth: "240px" }}>
                                <label style={labelStyle}>
                                  Schedule (cron: minute hour day month weekday)
                                </label>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <select
                                    style={{
                                      ...inputStyle,
                                      flex: 1,
                                      minWidth: "170px",
                                      cursor: "pointer",
                                    }}
                                    value={
                                      presets.some(
                                        (p) => p.value === form.cronExpression
                                      )
                                        ? form.cronExpression
                                        : ""
                                    }
                                    onChange={(e) =>
                                      e.target.value &&
                                      set("cronExpression", e.target.value)
                                    }
                                  >
                                    <option value="">Custom…</option>
                                    {presets.map((p) => (
                                      <option key={p.value} value={p.value}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    style={{
                                      ...inputStyle,
                                      flex: 1,
                                      minWidth: "170px",
                                      fontFamily:
                                        "ui-monospace, Menlo, Consolas, monospace",
                                    }}
                                    value={form.cronExpression}
                                    onChange={(e) =>
                                      set("cronExpression", e.target.value)
                                    }
                                    placeholder="* * * * *"
                                    spellCheck={false}
                                  />
                                </div>
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
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) =>
                                      set("isActive", e.target.checked)
                                    }
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
                                onChange={(e) =>
                                  set("description", e.target.value)
                                }
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                style={{
                                  ...btnStyle,
                                  background: "var(--green2)",
                                  color: "#fff",
                                  borderColor: "var(--green2)",
                                }}
                                onClick={save}
                                disabled={busy === `${job.id}:save`}
                              >
                                <i
                                  className={`fa-solid ${
                                    busy === `${job.id}:save`
                                      ? "fa-spinner fa-spin"
                                      : "fa-floppy-disk"
                                  }`}
                                ></i>
                                Save
                              </button>
                              <button
                                type="button"
                                style={btnStyle}
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== handler های موجود در کد ===== */}
      <div
        className="admin-card"
        style={{ padding: "16px 18px", marginTop: "16px" }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--dark)",
            marginBottom: "8px",
          }}
        >
          Available job handlers (defined in code)
        </div>
        <div style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.9 }}>
          {availableHandlers.map((h) => (
            <div key={h.key}>
              <code>{h.key}</code> — {h.name}
              {h.defaultCron ? (
                <span style={{ color: "var(--muted)" }}>
                  {" "}
                  · default <code>{h.defaultCron}</code>
                </span>
              ) : null}
            </div>
          ))}
          <div style={{ marginTop: "8px" }}>
            Adding a brand-new job still requires code: add a handler in{" "}
            <code>src/lib/jobHandlers.js</code>, then it is created
            automatically on the next tick.
          </div>
        </div>
      </div>
    </>
  );
}
