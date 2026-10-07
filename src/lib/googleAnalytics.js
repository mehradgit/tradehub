// src/lib/googleAnalytics.js
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// ============================================================
// کلاینت GA4 (فقط یک‌بار ساخته می‌شود)
// ============================================================
let clientInstance = null;

function getClient() {
  if (clientInstance) return clientInstance;

  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("GA credentials missing (GA_CLIENT_EMAIL / GA_PRIVATE_KEY)");
  }

  clientInstance = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });

  return clientInstance;
}

function getPropertyId() {
  const id = process.env.GA_PROPERTY_ID;
  if (!id) throw new Error("GA_PROPERTY_ID missing");
  return `properties/${id}`;
}

// ============================================================
// ۱. خلاصه‌ی دوره (کاربران، نشست‌ها، بازدید صفحه، نرخ پرش...)
// ============================================================
export async function getAnalyticsSummary({ days = 28 } = {}) {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
      { name: "newUsers" },
    ],
  });

  const row = response.rows?.[0];
  const m = row?.metricValues?.map((v) => Number(v.value)) || [];

  return {
    activeUsers: m[0] || 0,
    sessions: m[1] || 0,
    pageViews: m[2] || 0,
    bounceRate: m[3] || 0,          // 0..1
    avgSessionDuration: m[4] || 0,  // ثانیه
    newUsers: m[5] || 0,
  };
}

// ============================================================
// ۲. نمودار روزانه (برای Chart)
// ============================================================
export async function getAnalyticsDaily({ days = 28 } = {}) {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  return (response.rows || []).map((row) => {
    const dateStr = row.dimensionValues[0].value; // "20261007"
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);

    return {
      date: `${y}-${m}-${d}`,
      activeUsers: Number(row.metricValues[0].value),
      sessions: Number(row.metricValues[1].value),
      pageViews: Number(row.metricValues[2].value),
    };
  });
}

// ============================================================
// ۳. صفحات پربازدید
// ============================================================
export async function getTopPages({ days = 28, limit = 10 } = {}) {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (response.rows || []).map((row) => ({
    path: row.dimensionValues[0].value,
    title: row.dimensionValues[1].value,
    pageViews: Number(row.metricValues[0].value),
    activeUsers: Number(row.metricValues[1].value),
  }));
}

// ============================================================
// ۴. منابع ترافیک
// ============================================================
export async function getTrafficSources({ days = 28, limit = 10 } = {}) {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit,
  });

  return (response.rows || []).map((row) => ({
    source: row.dimensionValues[0].value,
    medium: row.dimensionValues[1].value,
    sessions: Number(row.metricValues[0].value),
    users: Number(row.metricValues[1].value),
  }));
}

// ============================================================
// ۵. کشورها
// ============================================================
export async function getTopCountries({ days = 28, limit = 10 } = {}) {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit,
  });

  return (response.rows || []).map((row) => ({
    country: row.dimensionValues[0].value,
    users: Number(row.metricValues[0].value),
    sessions: Number(row.metricValues[1].value),
  }));
}

// ============================================================
// ۶. دستگاه‌ها (موبایل/دسکتاپ/تبلت)
// ============================================================
export async function getDeviceBreakdown({ days = 28 } = {}) {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });

  return (response.rows || []).map((row) => ({
    device: row.dimensionValues[0].value,
    users: Number(row.metricValues[0].value),
  }));
}

// ============================================================
// ۷. Realtime (کاربران همین الان)
// ============================================================
export async function getRealtimeUsers() {
  const client = getClient();
  const property = getPropertyId();

  const [response] = await client.runRealtimeReport({
    property,
    metrics: [{ name: "activeUsers" }],
  });

  return Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
}