// src/components/admin/MaintenanceTools.js
"use client";
// ============================================================
// ابزارهای تعمیر و نگهداری (پنل ادمین)
//
//   ۱) Rebuild search indexes
//      بازسازی categoryPath و searchText برای محصولات و درخواست‌ها.
//
//   ۲) Normalise legacy vocabulary values
//      فرم‌های قدیمی رشته‌ی نمایشی ذخیره می‌کردند
//      ("FOB (Free On Board)" یا "T/T") و فیلترهای فروشگاه با contains
//      کار می‌کنند، پس بعضی ردیف‌های قدیمی پیدا نمی‌شوند.
//      پیش‌نمایش (dry run) پیش‌فرض است و هیچ چیزی نمی‌نویسد؛ دکمه‌ی
//      Apply فقط بعد از یک پیش‌نمایش فعال می‌شود و قبل از اجرا
//      تأیید می‌گیرد. مقادیر تطبیق‌نشده هرگز حذف نمی‌شوند.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const REBUILD_URL = "/api/admin/maintenance/rebuild-indexes";
const NORMALIZE_URL = "/api/admin/maintenance/normalize-vocabularies";

const MAX_SAMPLES = 50;

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

const primaryBtnStyle = {
  ...btnStyle,
  background: "var(--green2)",
  color: "#fff",
  borderColor: "var(--green2)",
};

const disabledBtnStyle = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const cardTitleStyle = {
  fontSize: "13px",
  fontWeight: 800,
  color: "var(--dark)",
};

const cardHintStyle = {
  fontSize: "10px",
  color: "var(--muted)",
  lineHeight: 1.8,
  marginTop: "4px",
  marginBottom: "12px",
};

// ============================================================
// نمایش شمارنده‌ها با admin-pill
// ============================================================
function CountPill({ label, value, tone = "basic" }) {
  return (
    <span className={`admin-pill ${tone}`}>
      {label} {value}
    </span>
  );
}

// ============================================================
// گزارش یک مدل: شمارنده‌ها + جدول نمونه‌ها
// ============================================================
function ModelReport({ title, data }) {
  if (!data) return null;

  const samples = Array.isArray(data.samples) ? data.samples : [];
  const hasUnmatched = Number(data.unmatched) > 0;

  return (
    <div
      style={{
        borderTop: "1px solid var(--line)",
        marginTop: "14px",
        paddingTop: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--dark)" }}>
          {title}
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <CountPill label="Scanned" value={data.scanned} />
          <CountPill
            label="Changed"
            value={data.changed}
            tone={Number(data.changed) > 0 ? "pending" : "basic"}
          />
          <CountPill
            label="Unmatched"
            value={data.unmatched}
            tone={hasUnmatched ? "suspended" : "basic"}
          />
        </div>
      </div>

      {samples.length === 0 ? (
        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "8px" }}>
          No differences found in this table.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: "10px",
              color: "var(--muted)",
              margin: "9px 0 6px",
            }}
          >
            {samples.length >= MAX_SAMPLES
              ? `Showing the first ${MAX_SAMPLES} differences.`
              : `${samples.length} sample(s).`}{" "}
            <span style={{ color: "var(--muted)" }}>
              “kept as-is” means the stored value was not recognised and was left
              untouched.
            </span>
          </div>

          <div
            className="admin-table-wrap"
            style={{ maxHeight: "300px", overflowY: "auto" }}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Before</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s, index) => (
                  <tr key={`${s.id}-${s.field}-${index}`}>
                    <td>
                      <code style={{ fontSize: "10px" }}>{s.field}</code>
                    </td>
                    <td style={{ whiteSpace: "normal", maxWidth: "280px" }}>
                      {s.before}
                    </td>
                    <td style={{ whiteSpace: "normal", maxWidth: "280px" }}>
                      {s.after === null || s.after === undefined ? (
                        <span className="admin-pill suspended">kept as-is</span>
                      ) : (
                        <span style={{ color: "#12885f", fontWeight: 700 }}>
                          {s.after}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function MaintenanceTools() {
  const router = useRouter();

  const [busy, setBusy] = useState(null); // "rebuild" | "preview" | "apply"
  const [indexResult, setIndexResult] = useState(null);
  const [report, setReport] = useState(null); // پاسخ نرمال‌سازی
  const [applied, setApplied] = useState(false); // آخرین اجرا واقعی بوده؟

  const anyBusy = busy !== null;

  // ===== فراخوانی مشترک POST =====
  const post = async (url, payload) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");

    return data;
  };

  // ===== ۱) بازسازی ایندکس‌ها =====
  const rebuildIndexes = async () => {
    setBusy("rebuild");
    try {
      const data = await post(REBUILD_URL, { only: "both" });
      setIndexResult(data);
      toast.success(data.message || "Rebuild finished");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  // ===== ۲) پیش‌نمایش (dry run) =====
  const runPreview = async () => {
    setBusy("preview");
    try {
      const data = await post(NORMALIZE_URL, { dryRun: true, only: "both" });
      setReport(data);
      setApplied(false);
      toast.success(data.message || "Preview finished");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  // ===== ۲) اجرای واقعی =====
  const applyChanges = async () => {
    if (!report || applied) {
      toast.warning("Run the dry-run preview first");
      return;
    }

    const rows =
      Number(report.requests?.changed || 0) +
      Number(report.products?.changed || 0);
    const unmatched =
      Number(report.requests?.unmatched || 0) +
      Number(report.products?.unmatched || 0);

    const confirmed = window.confirm(
      `Apply vocabulary normalisation?\n\n` +
        `${rows} row(s) will be updated.\n` +
        `${unmatched} unrecognised value(s) will be kept exactly as they are.\n\n` +
        `Tip: the preview was generated earlier — run it again if the data may have changed.`
    );

    if (!confirmed) return;

    setBusy("apply");
    try {
      const data = await post(NORMALIZE_URL, { dryRun: false, only: "both" });
      setReport(data);
      setApplied(true);
      toast.success(data.message || "Normalisation applied");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const applyDisabled = anyBusy || !report || applied;

  return (
    <>
      {/* ============================================================
          کارت ۱: بازسازی ایندکس‌های جست‌وجو
          ============================================================ */}
      <div className="admin-card" style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "620px" }}>
            <div style={cardTitleStyle}>
              <i
                className="fa-solid fa-magnifying-glass-chart"
                style={{ color: "var(--green2)", marginRight: "7px" }}
              ></i>
              Rebuild search indexes
            </div>
            <div style={cardHintStyle}>
              Backfills <code>categoryPath</code> (the 3-level category slug used
              by the category filter) and <code>searchText</code> (the combined
              keyword text used by full-text search) for every existing product
              and buying request. Run it after changing categories or adding
              attributes. It is idempotent — running it again gives the same
              result.
            </div>
          </div>

          <button
            type="button"
            style={{
              ...primaryBtnStyle,
              ...(anyBusy ? disabledBtnStyle : null),
            }}
            onClick={rebuildIndexes}
            disabled={anyBusy}
          >
            <i
              className={`fa-solid ${
                busy === "rebuild" ? "fa-spinner fa-spin" : "fa-rotate"
              }`}
            ></i>
            {busy === "rebuild" ? "Rebuilding…" : "Rebuild indexes"}
          </button>
        </div>

        {indexResult && (
          <div
            style={{
              borderTop: "1px solid var(--line)",
              marginTop: "14px",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                marginBottom: "10px",
              }}
            >
              {indexResult.message} · {((indexResult.durationMs || 0) / 1000).toFixed(1)}s
            </div>

            {["products", "requests"].map((key) => {
              const counts = indexResult[key];
              if (!counts) return null;

              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "7px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--dark)",
                      minWidth: "80px",
                      textTransform: "capitalize",
                    }}
                  >
                    {key}
                  </span>
                  <CountPill label="Total" value={counts.total} />
                  <CountPill
                    label="Updated"
                    value={counts.updated}
                    tone={counts.updated > 0 ? "active" : "basic"}
                  />
                  <CountPill
                    label="Failed"
                    value={counts.failed}
                    tone={counts.failed > 0 ? "suspended" : "basic"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================
          کارت ۲: نرمال‌سازی مقادیر قدیمی واژگان
          ============================================================ */}
      <div className="admin-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "620px" }}>
            <div style={cardTitleStyle}>
              <i
                className="fa-solid fa-wand-magic-sparkles"
                style={{ color: "var(--green2)", marginRight: "7px" }}
              ></i>
              Normalise legacy vocabulary values
            </div>
            <div style={cardHintStyle}>
              Older forms stored display strings (for example{" "}
              <code>FOB (Free On Board)</code> or <code>T/T</code>) while the
              storefront filters match the canonical vocabulary values ({" "}
              <code>FOB</code>, <code>T/T in advance</code>). Preview is a dry
              run and writes nothing — nothing can be changed by accident.
              Applying only touches rows whose value actually differs; values
              that cannot be recognised are <b>never</b> deleted or blanked,
              they are reported as unmatched (add the missing entry in
              Vocabularies and run again).
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              style={{
                ...btnStyle,
                ...(anyBusy ? disabledBtnStyle : null),
              }}
              onClick={runPreview}
              disabled={anyBusy}
            >
              <i
                className={`fa-solid ${
                  busy === "preview" ? "fa-spinner fa-spin" : "fa-eye"
                }`}
              ></i>
              {busy === "preview" ? "Previewing…" : "Preview (dry run)"}
            </button>

            <button
              type="button"
              style={{
                ...primaryBtnStyle,
                ...(applyDisabled ? disabledBtnStyle : null),
              }}
              onClick={applyChanges}
              disabled={applyDisabled}
              title={
                !report
                  ? "Run the dry-run preview first"
                  : applied
                  ? "Changes were already applied — preview again to continue"
                  : "Apply the changes to the database"
              }
            >
              <i
                className={`fa-solid ${
                  busy === "apply" ? "fa-spinner fa-spin" : "fa-check-double"
                }`}
              ></i>
              {busy === "apply" ? "Applying…" : "Apply changes"}
            </button>
          </div>
        </div>

        {report && (
          <div
            style={{
              borderTop: "1px solid var(--line)",
              marginTop: "14px",
              paddingTop: "12px",
            }}
          >
            {/* ===== وضعیت: پیش‌نمایش یا اجراشده ===== */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                className={`admin-pill ${report.dryRun ? "pending" : "active"}`}
              >
                {report.dryRun ? "Dry run — nothing written" : "Applied"}
              </span>
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                {report.message} · {((report.durationMs || 0) / 1000).toFixed(1)}s
              </span>
            </div>

            {!report.dryRun && (
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--muted)",
                  marginTop: "7px",
                }}
              >
                Changes were written. Run the preview again to see the current
                state of the data.
              </div>
            )}

            {/* ===== تعداد گزینه‌های هر واژگان ===== */}
            {report.vocabularies && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".4px",
                  }}
                >
                  Vocabulary options
                </span>
                {Object.entries(report.vocabularies).map(([key, count]) => (
                  <span key={key} className="admin-pill basic">
                    {key} {count}
                  </span>
                ))}
              </div>
            )}

            {/* ===== گزارش هر مدل ===== */}
            <ModelReport title="Buying requests" data={report.requests} />
            <ModelReport title="Products" data={report.products} />

            {/* ===== راهنما وقتی مقدار ناشناخته داریم ===== */}
            {(Number(report.requests?.unmatched || 0) > 0 ||
              Number(report.products?.unmatched || 0) > 0) && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "10px",
                  color: "var(--muted)",
                  lineHeight: 1.9,
                }}
              >
                Unmatched values are stored exactly as they were. If one of them
                is legitimate, add it to the vocabulary in{" "}
                <Link
                  href="/admin/vocabularies"
                  style={{ color: "var(--green2)", fontWeight: 700 }}
                >
                  Vocabularies
                </Link>{" "}
                and run the preview again — the next run will pick it up.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
