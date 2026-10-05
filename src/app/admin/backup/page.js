// src/app/admin/backup/page.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminBackupPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedBackup, setParsedBackup] = useState(null);
  const [confirmation, setConfirmation] = useState("");
  const [restoreResult, setRestoreResult] = useState(null);

  // ============================================================
  // Download backup
  // ============================================================
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup");

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create backup");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Extract the file name from the Content-Disposition header
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `backup-${Date.now()}.json`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup downloaded successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================
  // Upload the backup file
  // ============================================================
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a valid JSON backup file");
      e.target.value = "";
      return;
    }

    // Size limit: 50 megabytes
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Backup file is too large (max 50MB)");
      e.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed?.data || !parsed?.meta) {
        throw new Error("Invalid backup file structure");
      }

      if (parsed.meta.appName !== "FoodTradeHub") {
        throw new Error("This file is not a FoodTradeHub backup");
      }

      setParsedBackup({ file, parsed });
      setConfirmation("");
      toast.success("Backup file loaded. Review the details below.");
    } catch (err) {
      toast.error(err.message || "Failed to read backup file");
      setParsedBackup(null);
      e.target.value = "";
    }
  };

  // ============================================================
  // Run the restore
  // ============================================================
  const handleRestore = async () => {
    if (!parsedBackup) return;
    if (confirmation !== "RESTORE") {
      toast.warning('Please type "RESTORE" exactly to confirm.');
      return;
    }

    if (
      !confirm(
        "⚠️ This will REPLACE all current data with the backup. Continue?"
      )
    ) {
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: parsedBackup.parsed,
          mode: "replace",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRestoreResult(data.counts);
      toast.success("Backup restored successfully!");

      // Refresh the dependent URLs
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      toast.error(err.message || "Failed to restore backup");
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setParsedBackup(null);
    setConfirmation("");
    setRestoreResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <AdminPageHeader
        title="Backup & Restore"
        subtitle="Export all site data or restore from a previous backup"
      />

      {/* ============================================================ */}
      {/* Download backup */}
      {/* ============================================================ */}
      <div
        className="admin-card"
        style={{
          marginBottom: 20,
          borderLeft: "4px solid #13795b",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #13795b, #1d9a71)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(19,121,91,0.25)",
            }}
          >
            <i className="fa-solid fa-download"></i>
          </div>

          <div style={{ flex: 1, minWidth: 250 }}>
            <h3
              style={{
                font: "800 16px 'Manrope', sans-serif",
                color: "#13251f",
                marginBottom: 6,
              }}
            >
              Download Backup
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#71807b",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Export all site data (users, products, requests, orders,
              messages, tickets, subscriptions, payments, settings and plans)
              into a single JSON file. Keep this file safe — it contains all
              your site data.
            </p>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #13795b, #1d9a71)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: downloading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 20px rgba(19,121,91,0.25)",
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  Preparing backup...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-down"></i>
                  Download Backup File
                </>
              )}
            </button>

            <div
              style={{
                marginTop: 12,
                fontSize: 11.5,
                color: "#94a3b8",
              }}
            >
              <i className="fa-solid fa-info-circle me-1"></i>
              Includes uploaded file paths (not the physical files). To
              include uploaded images, back up the{" "}
              <code
                style={{
                  background: "#f1f5f7",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                /public/uploads
              </code>{" "}
              folder separately.
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Restore */}
      {/* ============================================================ */}
      <div
        className="admin-card"
        style={{
          marginBottom: 20,
          borderLeft: "4px solid #f59e0b",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(245,158,11,0.25)",
            }}
          >
            <i className="fa-solid fa-upload"></i>
          </div>

          <div style={{ flex: 1, minWidth: 250 }}>
            <h3
              style={{
                font: "800 16px 'Manrope', sans-serif",
                color: "#13251f",
                marginBottom: 6,
              }}
            >
              Restore From Backup
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#71807b",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Upload a backup file to restore site data.{" "}
              <strong style={{ color: "#dc2626" }}>
                This will REPLACE all current data
              </strong>{" "}
              with the backup content. Your admin account will remain
              untouched.
            </p>

            {!parsedBackup ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: uploading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 8px 20px rgba(245,158,11,0.25)",
                  }}
                >
                  <i className="fa-solid fa-folder-open"></i>
                  Select Backup File
                </button>
              </>
            ) : (
              <div
                style={{
                  padding: 20,
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 12,
                }}
              >
                {/* Selected file */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: "1px dashed #fde68a",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "white",
                      color: "#d97706",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-file-code"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#78350f",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {parsedBackup.file.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#92400e" }}>
                      {(
                        parsedBackup.file.size /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB ·{" "}
                      {new Date(
                        parsedBackup.parsed.meta.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cancelUpload}
                    disabled={uploading}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid #fde68a",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#92400e",
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {/* Content preview */}
                <div
                  style={{
                    fontSize: 12,
                    color: "#78350f",
                    marginBottom: 16,
                  }}
                >
                  <strong>What's inside:</strong>
                  <div
                    style={{
                      marginTop: 8,
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: 6,
                    }}
                  >
                    {Object.entries(parsedBackup.parsed.counts || {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          style={{
                            fontSize: 11.5,
                            padding: "4px 10px",
                            background: "white",
                            borderRadius: 6,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ textTransform: "capitalize" }}>
                            {key}
                          </span>
                          <strong>{value}</strong>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Confirmation */}
                <div
                  style={{
                    padding: 14,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#991b1b",
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    All current site data will be{" "}
                    <strong>permanently deleted</strong> and replaced with the
                    backup content.
                  </div>
                </div>

                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#78350f",
                    marginBottom: 8,
                  }}
                >
                  Type{" "}
                  <code
                    style={{
                      background: "white",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    RESTORE
                  </code>{" "}
                  to confirm:
                </label>

                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) =>
                    setConfirmation(e.target.value.toUpperCase())
                  }
                  placeholder="Type RESTORE here"
                  disabled={uploading}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    padding: "12px 16px",
                    border: "2px solid #fde68a",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                    outline: "none",
                    marginBottom: 14,
                    background: "white",
                  }}
                />

                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={uploading || confirmation !== "RESTORE"}
                  style={{
                    padding: "12px 24px",
                    background:
                      confirmation === "RESTORE"
                        ? "linear-gradient(135deg, #ef4444, #dc2626)"
                        : "#fca5a5",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor:
                      uploading || confirmation !== "RESTORE"
                        ? "not-allowed"
                        : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Restoring... Please wait
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-database"></i>
                      Restore Backup
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Restore result */}
      {/* ============================================================ */}
      {restoreResult && (
        <div
          className="admin-card"
          style={{
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
          }}
        >
          <div className="admin-card-head">
            <div>
              <div className="admin-title" style={{ color: "#166534" }}>
                ✅ Restore Completed
              </div>
              <div className="admin-subtitle" style={{ color: "#16a34a" }}>
                The following items were restored
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {Object.entries(restoreResult).map(([key, value]) => (
              <div
                key={key}
                style={{
                  fontSize: 12.5,
                  padding: "8px 12px",
                  background: "white",
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#166534", textTransform: "capitalize" }}>
                  {key}
                </span>
                <strong style={{ color: "#166534" }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}