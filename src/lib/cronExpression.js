// src/lib/cronExpression.js
// ============================================================
// Minimal parser/matcher for standard five-field cron
//
//   ┌ minute      (0-59)
//   │ ┌ hour      (0-23)
//   │ │ ┌ day of month (1-31)
//   │ │ │ ┌ month   (1-12)
//   │ │ │ │ ┌ day of week (0-6, 0 = Sunday)
//   * * * * *
//
// Supports:  *   a   a,b,c   a-b   */n   a-b/n   and month/day names (jan, mon)
// With no external dependencies.
//
// Note: like standard cron, if both "day of month" and "day of week" are
// restricted, the relation is "or", not "and".
// ============================================================

const FIELD_RANGES = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // dayOfMonth
  [1, 12], // month
  [0, 6], // dayOfWeek
];

const FIELD_NAMES = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"];

const MONTH_ALIASES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const DOW_ALIASES = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

const FIELD_ALIASES = [null, null, null, MONTH_ALIASES, DOW_ALIASES];

// ============================================================
// Convert a value to a number (with name support)
// ============================================================
function toNumber(token, fieldIndex) {
  const t = String(token).trim().toLowerCase();
  if (t === "") return NaN;

  const direct = Number(t);
  if (!Number.isNaN(direct)) return direct;

  const aliases = FIELD_ALIASES[fieldIndex];
  if (aliases && Object.prototype.hasOwnProperty.call(aliases, t)) {
    return aliases[t];
  }
  return NaN;
}

// ============================================================
// Expand a field into a set of values
// ============================================================
function expandField(raw, fieldIndex) {
  const [min, max] = FIELD_RANGES[fieldIndex];
  const name = FIELD_NAMES[fieldIndex];
  const values = new Set();

  for (const rawPart of String(raw).split(",")) {
    const part = rawPart.trim();
    if (!part) throw new Error(`empty value in "${name}" field`);

    // Splitting off the step:  */5  or  1-10/2
    const slashIndex = part.indexOf("/");
    const rangePart = slashIndex === -1 ? part : part.slice(0, slashIndex);
    const stepPart = slashIndex === -1 ? null : part.slice(slashIndex + 1);

    let step = 1;
    if (stepPart !== null) {
      step = Number(stepPart);
      if (!Number.isInteger(step) || step < 1) {
        throw new Error(`invalid step "${stepPart}" in "${name}" field`);
      }
    }

    let start;
    let end;

    if (rangePart === "*") {
      start = min;
      end = max;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-");
      start = toNumber(a, fieldIndex);
      end = toNumber(b, fieldIndex);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        throw new Error(`invalid range "${rangePart}" in "${name}" field`);
      }
    } else {
      start = toNumber(rangePart, fieldIndex);
      end = start;
      if (Number.isNaN(start)) {
        throw new Error(`invalid value "${rangePart}" in "${name}" field`);
      }
    }

    // 7 is also accepted as Sunday
    if (fieldIndex === 4 && start === 7) start = 0;
    if (fieldIndex === 4 && end === 7) end = 0;

    if (start < min || start > max || end < min || end > max) {
      throw new Error(
        `value out of range (${min}-${max}) in "${name}" field: ${rangePart}`
      );
    }
    if (start > end) {
      throw new Error(`reversed range in "${name}" field: ${rangePart}`);
    }

    for (let v = start; v <= end; v += step) {
      values.add(v);
    }
  }

  if (values.size === 0) {
    throw new Error(`"${name}" field resolved to nothing`);
  }
  return values;
}

// ============================================================
// parseCron
// → { ok: true, sets: { minute:Set, hour:Set, ... } }
// → { ok: false, error: "..." }
// ============================================================
export function parseCron(expression) {
  try {
    const raw = String(expression || "").trim();
    if (!raw) return { ok: false, error: "Expression is empty" };

    const parts = raw.split(/\s+/);
    if (parts.length !== 5) {
      return {
        ok: false,
        error: `Expected 5 fields (minute hour dayOfMonth month dayOfWeek), got ${parts.length}`,
      };
    }

    const sets = {};
    for (let i = 0; i < 5; i++) {
      sets[FIELD_NAMES[i]] = expandField(parts[i], i);
    }

    return { ok: true, sets };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// Does this date match the expression? (minute precision)
// ============================================================
export function matchesCron(expression, date = new Date()) {
  const parsed =
    typeof expression === "object" && expression?.ok !== undefined
      ? expression
      : parseCron(expression);

  if (!parsed.ok) return false;
  const { sets } = parsed;

  if (!sets.minute.has(date.getMinutes())) return false;
  if (!sets.hour.has(date.getHours())) return false;
  if (!sets.month.has(date.getMonth() + 1)) return false;

  const domRestricted = sets.dayOfMonth.size < 31;
  const dowRestricted = sets.dayOfWeek.size < 7;

  const domOk = sets.dayOfMonth.has(date.getDate());
  const dowOk = sets.dayOfWeek.has(date.getDay());

  // Standard cron rule: if both are restricted, use "or"
  if (domRestricted && dowRestricted) return domOk || dowOk;
  if (domRestricted) return domOk;
  if (dowRestricted) return dowOk;
  return true;
}

// ============================================================
// Compute the next run time
//
// For efficiency it advances day by day (at most 400 days) and then
// finds the hour/minute inside that day — not minute by minute.
// ============================================================
export function getNextRunAt(expression, from = new Date()) {
  const parsed = parseCron(expression);
  if (!parsed.ok) return null;

  const { sets } = parsed;
  const minutes = [...sets.minute].sort((a, b) => a - b);
  const hours = [...sets.hour].sort((a, b) => a - b);

  const start = new Date(from.getTime());
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  for (let offset = 0; offset < 400; offset++) {
    const day = new Date(start.getTime());
    day.setDate(day.getDate() + offset);
    day.setHours(0, 0, 0, 0);

    if (!sets.month.has(day.getMonth() + 1)) continue;

    const domRestricted = sets.dayOfMonth.size < 31;
    const dowRestricted = sets.dayOfWeek.size < 7;
    const domOk = sets.dayOfMonth.has(day.getDate());
    const dowOk = sets.dayOfWeek.has(day.getDay());

    let dayOk;
    if (domRestricted && dowRestricted) dayOk = domOk || dowOk;
    else if (domRestricted) dayOk = domOk;
    else if (dowRestricted) dayOk = dowOk;
    else dayOk = true;

    if (!dayOk) continue;

    for (const h of hours) {
      for (const m of minutes) {
        const candidate = new Date(day.getTime());
        candidate.setHours(h, m, 0, 0);
        if (candidate.getTime() >= start.getTime()) return candidate;
      }
    }
  }

  return null;
}

// ============================================================
// Human-readable description (for display in the admin panel)
// ============================================================
const DOW_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function describeCron(expression) {
  const parsed = parseCron(expression);
  if (!parsed.ok) return `Invalid: ${parsed.error}`;

  const { sets } = parsed;
  const [, , , , dow] = String(expression).trim().split(/\s+/);

  if (expression.trim() === "* * * * *") return "Every minute";
  if (/^\*\/\d+ \* \* \* \*$/.test(expression.trim())) {
    return `Every ${expression.trim().split("/")[1].split(" ")[0]} minutes`;
  }
  if (/^\d+ \* \* \* \*$/.test(expression.trim())) {
    return `Every hour at minute ${expression.trim().split(" ")[0]}`;
  }
  if (/^\d+ \d+ \* \* \*$/.test(expression.trim())) {
    const [m, h] = expression.trim().split(" ");
    return `Daily at ${pad(h)}:${pad(m)}`;
  }
  if (/^\d+ \d+ \* \* [0-6]$/.test(expression.trim())) {
    const [m, h, , , d] = expression.trim().split(" ");
    return `Weekly on ${DOW_LABELS[Number(d)]} at ${pad(h)}:${pad(m)}`;
  }
  if (/^\d+ \d+ \d+ \* \*$/.test(expression.trim())) {
    const [m, h, dom] = expression.trim().split(" ");
    return `Monthly on day ${dom} at ${pad(h)}:${pad(m)}`;
  }

  // Generic case
  const bits = [];
  if (sets.dayOfWeek.size < 7) {
    bits.push(`on ${[...sets.dayOfWeek].map((d) => DOW_LABELS[d]).join(", ")}`);
  }
  if (sets.dayOfMonth.size < 31) {
    bits.push(`on day ${[...sets.dayOfMonth].join(", ")}`);
  }
  return `Custom (${expression.trim()})${bits.length ? " " + bits.join(" ") : ""}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// ============================================================
// Ready-made presets for the admin panel
// ============================================================
export const CRON_PRESETS = [
  { value: "* * * * *", label: "Every minute" },
  { value: "*/5 * * * *", label: "Every 5 minutes" },
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 3 * * *", label: "Daily at 03:00" },
  { value: "30 3 * * *", label: "Daily at 03:30" },
  { value: "0 9 * * *", label: "Daily at 09:00" },
  { value: "0 9 * * 1", label: "Weekly — Monday 09:00" },
  { value: "0 9 * * 6", label: "Weekly — Saturday 09:00" },
  { value: "0 9 1 * *", label: "Monthly — 1st at 09:00" },
];
