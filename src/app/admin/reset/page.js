// src/app/admin/reset/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminResetPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-site");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStats(data);
    } catch (err) {
      toast.error(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReset = async () => {
    if (confirmation !== "RESET") {
      toast.warning('Please type "RESET" exactly to confirm.');
      return;
    }

    if (
      !confirm(
        "⚠️ FINAL WARNING: This will permanently delete ALL data. This action CANNOT be undone. Are you absolutely sure?"
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setResult(data);
      toast.success("Site data reset successfully!");
      setShowConfirm(false);
      setConfirmation("");
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Failed to reset site");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Reset Site Data"
        subtitle="Danger Zone — Permanently delete all site data"
      />

      {/* ====== Main warning ====== */}
      <div
        style={{
          background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
          border: "2px solid #fecaca",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(239,68,68,0.25)",
            }}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3
              style={{
                font: "800 16px 'Manrope', sans-serif",
                color: "#991b1b",
                margin: 0,
                marginBottom: 6,
              }}
            >
              ⚠️ Danger Zone
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#7f1d1d",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              This action will <strong>permanently delete</strong> all users,
              products, buying requests, inquiries, messages, tickets,
              subscriptions, payments, coupons, notifications, and uploaded
              files. <strong>This cannot be undone.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ====== What will be kept ====== */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <i
            className="fa-solid fa-shield-halved"
            style={{
              color: "#16a34a",
              fontSize: 20,
              marginTop: 3,
              flexShrink: 0,
            }}
          ></i>
          <div>
            <div
              style={{
                font: "800 13px 'Manrope', sans-serif",
                color: "#166534",
                marginBottom: 6,
              }}
            >
              What will be KEPT (not deleted):
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 12.5,
                color: "#166534",
                lineHeight: 1.8,
              }}
            >
              <li>
                <strong>Plans</strong> and Plan Prices
              </li>
              <li>
                <strong>Site Settings</strong> (including Access Control)
              </li>
              <li>
                <strong>Countries</strong> and <strong>Categories</strong>{" "}
                (hardcoded in app)
              </li>
              <li>
                <strong>Your admin account</strong> (you stay signed in)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ====== Stats ====== */}
      {loading ? (
        <div
          className="admin-card"
          style={{ padding: 40, textAlign: "center" }}
        >
          <div className="spinner-border text-danger"></div>
          <p style={{ marginTop: 12, color: "#82918b", fontSize: 13 }}>
            Loading stats...
          </p>
        </div>
      ) : stats ? (
        <>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-head">
              <div>
                <div className="admin-title">Data that will be deleted</div>
                <div className="admin-subtitle">
                  Current records in the database
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 12,
              }}
            >
              <StatCard
                icon="fa-users"
                label="Users"
                value={stats.database.users}
                color="#ef4444"
              />
              <StatCard
                icon="fa-box"
                label="Products"
                value={stats.database.products}
                color="#f97316"
              />
              <StatCard
                icon="fa-cart-shopping"
                label="Buying Requests"
                value={stats.database.requests}
                color="#f59e0b"
              />
              <StatCard
                icon="fa-envelope"
                label="Inquiries"
                value={stats.database.inquiries}
                color="#6366f1"
              />
              <StatCard
                icon="fa-comments"
                label="Messages"
                value={stats.database.messages}
                color="#8b5cf6"
              />
              <StatCard
                icon="fa-file-signature"
                label="Quotes"
                value={stats.database.quotes}
                color="#06b6d4"
              />
              <StatCard
                icon="fa-headset"
                label="Tickets"
                value={stats.database.tickets}
                color="#ec4899"
              />
              <StatCard
                icon="fa-bell"
                label="Notifications"
                value={stats.database.notifications}
                color="#14b8a6"
              />
              <StatCard
                icon="fa-crown"
                label="Subscriptions"
                value={stats.database.subscriptions}
                color="#a855f7"
              />
              <StatCard
                icon="fa-credit-card"
                label="Payments"
                value={stats.database.payments}
                color="#10b981"
              />
              <StatCard
                icon="fa-tag"
                label="Coupons"
                value={stats.database.coupons}
                color="#eab308"
              />
              <StatCard
                icon="fa-bookmark"
                label="Saved Items"
                value={
                  stats.database.savedProducts +
                  stats.database.savedRequests +
                  stats.database.savedProfiles
                }
                color="#64748b"
              />
            </div>

            <div
              style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: "1px dashed #e2e9e5",
              }}
            >
              <div
                style={{
                  font: "800 12px 'Manrope', sans-serif",
                  color: "#13251f",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Uploaded Files
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  fontSize: 12.5,
                  color: "#71807b",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Products: <strong>{stats.uploads.products}</strong>
                </span>
                <span>
                  Requests: <strong>{stats.uploads.requests}</strong>
                </span>
                <span>
                  Profiles: <strong>{stats.uploads.profiles}</strong>
                </span>
                <span>
                  Tickets: <strong>{stats.uploads.tickets}</strong>
                </span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>
                  Total: {stats.uploads.total} files
                </span>
              </div>
            </div>
          </div>

          {/* ====== Last reset result ====== */}
          {result && (
            <div
              className="admin-card"
              style={{
                marginBottom: 20,
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
              }}
            >
              <div className="admin-card-head">
                <div>
                  <div className="admin-title" style={{ color: "#166534" }}>
                    ✅ Last Reset Result
                  </div>
                  <div
                    className="admin-subtitle"
                    style={{ color: "#16a34a" }}
                  >
                    The following items were deleted
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 10,
                }}
              >
                {Object.entries(result.database).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      fontSize: 12.5,
                      padding: "6px 12px",
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
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: "white",
                  borderRadius: 10,
                  border: "1px solid #bbf7d0",
                  fontSize: 12.5,
                  color: "#166534",
                }}
              >
                <i className="fa-solid fa-file-circle-check me-2"></i>
                Uploaded files deleted:{" "}
                <strong>{result.uploads.deletedFiles}</strong>
              </div>
            </div>
          )}

          {/* ====== Confirmation and execution ====== */}
          <div
            className="admin-card"
            style={{
              border: "2px solid #fecaca",
              background: "linear-gradient(135deg, #fef2f2, white)",
            }}
          >
            <div className="admin-card-head">
              <div>
                <div className="admin-title" style={{ color: "#991b1b" }}>
                  Confirm Reset
                </div>
                <div className="admin-subtitle">
                  Read carefully before proceeding
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                padding: 16,
                background: "white",
                borderRadius: 12,
                marginBottom: 20,
                border: "1px solid #fee2e2",
              }}
            >
              <i
                className="fa-solid fa-circle-exclamation"
                style={{ color: "#dc2626", fontSize: 20, marginTop: 2 }}
              ></i>
              <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.7 }}>
                <strong>You are about to permanently delete:</strong>
                <div style={{ marginTop: 4 }}>
                  {stats.database.users} users · {stats.database.products}{" "}
                  products · {stats.database.requests} requests ·{" "}
                  {stats.database.messages} messages ·{" "}
                  {stats.uploads.total} uploaded files
                </div>
              </div>
            </div>

            {!showConfirm ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: "12px 24px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "2px solid #fecaca",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i className="fa-solid fa-trash"></i>
                I want to reset the site data
              </button>
            ) : (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#991b1b",
                    marginBottom: 8,
                  }}
                >
                  Type <code style={{ background: "#fee2e2", padding: "2px 8px", borderRadius: 4 }}>RESET</code> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                  placeholder="Type RESET here"
                  disabled={resetting}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    padding: "12px 16px",
                    border: "2px solid #fecaca",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                    outline: "none",
                    marginBottom: 16,
                    background: "white",
                    color: confirmation === "RESET" ? "#dc2626" : "#991b1b",
                  }}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={resetting || confirmation !== "RESET"}
                    style={{
                      padding: "12px 24px",
                      background:
                        confirmation === "RESET"
                          ? "linear-gradient(135deg, #ef4444, #dc2626)"
                          : "#fca5a5",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor:
                        resetting || confirmation !== "RESET"
                          ? "not-allowed"
                          : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow:
                        confirmation === "RESET"
                          ? "0 8px 20px rgba(239,68,68,0.35)"
                          : "none",
                      opacity: resetting ? 0.7 : 1,
                    }}
                  >
                    {resetting ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>
                        Resetting... Please wait
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        Yes, Reset Everything
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmation("");
                    }}
                    disabled={resetting}
                    style={{
                      padding: "12px 24px",
                      background: "white",
                      color: "#33413d",
                      border: "1px solid #e2e9e5",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: resetting ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

// ====== Stat card ======
function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "white",
        border: "1px solid #e2e9e5",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${color}15`,
          color: color,
          display: "grid",
          placeItems: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#13251f",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#71807b",
            marginTop: 4,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}