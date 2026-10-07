"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RANGES = [
  { value: 1,   label: "Today" },
  { value: 7,   label: "7 days" },
  { value: 28,  label: "28 days" },
  { value: 90,  label: "90 days" },
  { value: 365, label: "1 year" },
];

function formatDuration(seconds) {
  const s = Math.round(seconds || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatPercent(v) {
  return `${(Number(v) * 100).toFixed(1)}%`;
}

export default function GoogleAnalyticsDashboard() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (d) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics/google?days=${d}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      setData(json);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // ============================================================
  // حالت‌های خطا / لودینگ
  // ============================================================
  if (error) {
    return (
      <div className="admin-card" style={{ padding: 40, textAlign: "center" }}>
        <i
          className="fa-solid fa-triangle-exclamation"
          style={{ fontSize: 40, color: "#e75e5e", marginBottom: 12 }}
        ></i>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>
          Google Analytics unavailable
        </h3>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
          {error}
        </p>
        <div
          style={{
            marginTop: 16,
            textAlign: "left",
            background: "#f9fbfa",
            padding: 16,
            borderRadius: 10,
            fontSize: 12,
            color: "var(--muted)",
            lineHeight: 1.8,
          }}
        >
          <strong>Checklist:</strong>
          <ul style={{ paddingLeft: 20, margin: "6px 0 0" }}>
            <li><code>GA_PROPERTY_ID</code> — numeric, e.g. 123456789</li>
            <li><code>GA_CLIENT_EMAIL</code> — service account email</li>
            <li><code>GA_PRIVATE_KEY</code> — with real newlines (\n)</li>
            <li>Service account added as Viewer in GA4 Property Access</li>
            <li>Google Analytics Data API enabled in Google Cloud</li>
          </ul>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="admin-card" style={{ padding: 60, textAlign: "center" }}>
        <div className="spinner-border text-success"></div>
        <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
          Loading Google Analytics…
        </p>
      </div>
    );
  }

  const s = data.summary;

  // ============================================================
  // داده‌ی چارت روزانه
  // ============================================================
  const dailyChart = {
    labels: data.daily.map((d) => {
      const [, m, day] = d.date.split("-");
      return `${m}/${day}`;
    }),
    datasets: [
      {
        label: "Users",
        data: data.daily.map((d) => d.activeUsers),
        borderColor: "#0f9e6e",
        backgroundColor: "rgba(15,158,110,0.08)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Page views",
        data: data.daily.map((d) => d.pageViews),
        borderColor: "#6366f1",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        borderDash: [5, 4],
      },
    ],
  };

  const dailyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
          font: { size: 11 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f7" },
        ticks: { color: "#94a3b8", font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10 }, maxTicksLimit: 10 },
      },
    },
  };

  // ============================================================
  // Donut دستگاه‌ها
  // ============================================================
  const deviceColors = { desktop: "#0f9e6e", mobile: "#6366f1", tablet: "#f5b544" };
  const deviceChart = {
    labels: data.devices.map((d) => d.device),
    datasets: [
      {
        data: data.devices.map((d) => d.users),
        backgroundColor: data.devices.map(
          (d) => deviceColors[d.device] || "#cbd5d1"
        ),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ============ RANGE SELECTOR ============ */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setDays(r.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 50,
              fontSize: 12,
              fontWeight: 700,
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              background: days === r.value ? "#0f9e6e" : "white",
              color: days === r.value ? "white" : "var(--text)",
              borderColor: days === r.value ? "#0f9e6e" : "var(--line)",
            }}
          >
            {r.label}
          </button>
        ))}

        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "#eaf7f1",
            borderRadius: 50,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0f9e6e",
              animation: "gaPulse 1.5s infinite",
            }}
          ></span>
          {data.realtime} online now
        </span>
      </div>

      {/* ============ KPI CARDS ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <KPI label="Active Users" value={s.activeUsers.toLocaleString()} icon="fa-users" color="green" />
        <KPI label="New Users" value={s.newUsers.toLocaleString()} icon="fa-user-plus" color="indigo" />
        <KPI label="Sessions" value={s.sessions.toLocaleString()} icon="fa-chart-line" color="blue" />
        <KPI label="Page Views" value={s.pageViews.toLocaleString()} icon="fa-eye" color="amber" />
        <KPI label="Avg. Session" value={formatDuration(s.avgSessionDuration)} icon="fa-clock" color="purple" />
        <KPI label="Bounce Rate" value={formatPercent(s.bounceRate)} icon="fa-arrow-right-from-bracket" color="rose" />
      </div>

      {/* ============ DAILY CHART ============ */}
      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-title">Daily Traffic</div>
            <div className="admin-subtitle">
              Users and page views over the last {days} days
            </div>
          </div>
        </div>
        <div style={{ height: 300, position: "relative" }}>
          {data.daily.length > 0 ? (
            <Line data={dailyChart} options={dailyOptions} />
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* ============ 2-COLUMN ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)",
          gap: 16,
        }}
      >
        {/* Top pages */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Top Pages</div>
              <div className="admin-subtitle">
                Most viewed pages in the selected period
              </div>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th style={{ textAlign: "right" }}>Views</th>
                  <th style={{ textAlign: "right" }}>Users</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((p) => (
                  <tr key={p.path}>
                    <td style={{ maxWidth: 340 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--dark)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={p.title}
                      >
                        {p.title || p.path}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.path}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {p.pageViews.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>
                      {p.activeUsers.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Devices */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Devices</div>
              <div className="admin-subtitle">Users by device category</div>
            </div>
          </div>
          <div style={{ height: 200, position: "relative" }}>
            {data.devices.length > 0 ? (
              <Doughnut
                data={deviceChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        padding: 12,
                        font: { size: 11 },
                      },
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>

      {/* ============ 2-COLUMN ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Traffic sources */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Traffic Sources</div>
              <div className="admin-subtitle">Where your visitors come from</div>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Medium</th>
                  <th style={{ textAlign: "right" }}>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {data.trafficSources.map((t, i) => (
                  <tr key={`${t.source}-${t.medium}-${i}`}>
                    <td style={{ fontWeight: 600 }}>{t.source}</td>
                    <td>
                      <span className="admin-pill basic">{t.medium}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {t.sessions.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Countries */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Top Countries</div>
              <div className="admin-subtitle">Audience location</div>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th style={{ textAlign: "right" }}>Users</th>
                  <th style={{ textAlign: "right" }}>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {data.countries.map((c) => (
                  <tr key={c.country}>
                    <td style={{ fontWeight: 600 }}>{c.country}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {c.users.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>
                      {c.sessions.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// KPI Card
// ============================================================
function KPI({ label, value, icon, color }) {
  const colors = {
    green:  { bg: "#eaf7f1", fg: "#0b5b43" },
    indigo: { bg: "#eef0ff", fg: "#4f46e5" },
    blue:   { bg: "#e5efff", fg: "#2563eb" },
    amber:  { bg: "#fff7e6", fg: "#b45309" },
    purple: { bg: "#f3efff", fg: "#8b5cf6" },
    rose:   { bg: "#fef2f2", fg: "#dc2626" },
  };
  const c = colors[color] || colors.green;

  return (
    <div
      className="admin-card"
      style={{
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: c.bg,
          color: c.fg,
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--dark)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.1,
            letterSpacing: -0.3,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
        fontSize: 12,
      }}
    >
      No data for this period
    </div>
  );
}