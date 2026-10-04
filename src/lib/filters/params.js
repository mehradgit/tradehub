// src/lib/filters/params.js
// ============================================================
// تبدیل پارامترهای URL ↔ شیء فیلتر
//
// PURE و مشترک بین سرور (searchParams) و کلاینت (useSearchParams)
// تا منطق در دو جا تکرار نشود.
// ============================================================

// ============================================================
// دسترسی یکنواخت به searchParams
// (می‌تواند URLSearchParams، آبجکت Next، یا آبجکت ساده باشد)
// ============================================================
export function makeGetter(searchParams) {
  if (!searchParams) return () => null;

  if (typeof searchParams.get === "function") {
    return (key) => searchParams.get(key);
  }

  return (key) => {
    const v = searchParams[key];
    if (v === undefined || v === null) return null;
    if (Array.isArray(v)) return v.length ? String(v[0]) : null;
    return String(v);
  };
}

// ============================================================
// پیمایش همه‌ی کلید/مقدارها
// ============================================================
export function entriesOf(searchParams) {
  const out = [];

  if (!searchParams) return out;

  if (typeof searchParams.forEach === "function" && !Array.isArray(searchParams)) {
    // URLSearchParams یا ReadonlyURLSearchParams
    searchParams.forEach((value, key) => out.push([key, value]));
    return out;
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) out.push([key, String(v)]);
    } else {
      out.push([key, String(value)]);
    }
  }

  return out;
}

// ============================================================
// "a,b,c" یا ["a","b"] → ["a","b","c"]
// ============================================================
export function parseList(raw) {
  if (!raw) return [];
  const source = Array.isArray(raw) ? raw.join(",") : String(raw);
  return source
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinList(list) {
  return (Array.isArray(list) ? list : [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join(",");
}

// ============================================================
// خواندن مقادیر فیلتر از searchParams بر اساس اسکیما
//
// خروجی نمونه برای products:
// {
//   search: "honey",
//   categoryPath: "honey",
//   origin: ["Iran","India"],
//   price: { min: "2", max: "10" },
//   isUrgent: true,
//   attributes: { "<attrId>": ["amber"], "<attrId2>": { min, max } },
//   sort: "price_low"
// }
// ============================================================
export function readFilterValues(fields = [], searchParams) {
  const get = makeGetter(searchParams);
  const values = {};

  for (const field of fields) {
    switch (field.type) {
      case "numberRange": {
        const minKey = field.minParam || `${field.name}Min`;
        const maxKey = field.maxParam || `${field.name}Max`;
        const min = get(minKey);
        const max = get(maxKey);
        if (min || max) values[field.name] = { min: min || "", max: max || "" };
        break;
      }

      case "multiSelect": {
        const list = parseList(get(field.name));
        if (list.length) values[field.name] = list;
        break;
      }

      case "boolean": {
        const raw = get(field.name);
        if (raw === "true" || raw === "1") values[field.name] = true;
        break;
      }

      case "sort": {
        const raw = get("sort");
        if (raw) values[field.name] = raw;
        break;
      }

      case "dynamicAttributes": {
        const attrs = {};
        for (const [key, raw] of entriesOf(searchParams)) {
          if (!key.startsWith("attr_") || !raw) continue;
          const id = key.slice(5);

          if (key.endsWith("Min") || key.endsWith("Max")) continue;

          // بازه‌ی عددی
          const minRaw = get(`attr_${id}Min`);
          const maxRaw = get(`attr_${id}Max`);
          if (minRaw || maxRaw) {
            attrs[id] = { min: minRaw || "", max: maxRaw || "" };
            continue;
          }

          if (raw === "true") {
            attrs[id] = true;
            continue;
          }

          const list = parseList(raw);
          if (list.length === 1) attrs[id] = list;
          else if (list.length > 1) attrs[id] = list;
        }
        if (Object.keys(attrs).length) values[field.name] = attrs;
        break;
      }

      default: {
        const raw = get(field.name);
        if (raw) values[field.name] = raw;
      }
    }
  }

  return values;
}

// ============================================================
// تبدیل مقادیر فیلتر به پارامترهای URL
// ============================================================
export function filtersToParams(values = {}, fields = []) {
  const params = new URLSearchParams();

  for (const field of fields) {
    const value = values[field.name];

    if (field.type === "numberRange") {
      const minKey = field.minParam || `${field.name}Min`;
      const maxKey = field.maxParam || `${field.name}Max`;
      const min = value?.min;
      const max = value?.max;
      if (min !== undefined && min !== null && String(min) !== "") {
        params.set(minKey, String(min));
      }
      if (max !== undefined && max !== null && String(max) !== "") {
        params.set(maxKey, String(max));
      }
      continue;
    }

    if (field.type === "dynamicAttributes") {
      for (const [id, raw] of Object.entries(value || {})) {
        if (raw === null || raw === undefined || raw === "") continue;

        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          if (raw.min !== undefined && String(raw.min) !== "") {
            params.set(`attr_${id}Min`, String(raw.min));
          }
          if (raw.max !== undefined && String(raw.max) !== "") {
            params.set(`attr_${id}Max`, String(raw.max));
          }
          continue;
        }

        if (raw === true) {
          params.set(`attr_${id}`, "true");
          continue;
        }

        const joined = joinList(Array.isArray(raw) ? raw : [raw]);
        if (joined) params.set(`attr_${id}`, joined);
      }
      continue;
    }

    if (value === true) {
      params.set(field.name, "true");
      continue;
    }
    if (value === false || value === null || value === undefined || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      const joined = joinList(value);
      if (joined) params.set(field.name, joined);
      continue;
    }
    params.set(field.name, String(value));
  }

  return params;
}

// ============================================================
// شمارش فیلترهای فعال (برای بج روی دکمه «فیلترهای بیشتر»)
// ============================================================
export function countActiveFilters(values = {}, { includeSearch = false, includeSort = false } = {}) {
  let count = 0;

  for (const [key, value] of Object.entries(values)) {
    if (!includeSearch && key === "search") continue;
    if (!includeSort && key === "sort") continue;
    if (key === "categoryPath" && !includeSearch) {
      // دسته‌بندی را حساب می‌کنیم چون فیلتر مهمی است
    }

    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const hasAny = Object.values(value).some(
        (v) => v !== "" && v !== null && v !== undefined
      );
      if (hasAny) count++;
      continue;
    }

    count++;
  }

  return count;
}

// ============================================================
// ساخت URL جدید با اعمال تغییرات (برای کلاینت)
// ============================================================
export function buildUrl(pathname, currentParams, updates = {}, { resetPage = true } = {}) {
  const params =
    currentParams instanceof URLSearchParams
      ? new URLSearchParams(currentParams.toString())
      : new URLSearchParams(currentParams || {});

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
      continue;
    }
    if (Array.isArray(value)) {
      const joined = joinList(value);
      if (joined) params.set(key, joined);
      else params.delete(key);
      continue;
    }
    params.set(key, String(value));
  }

  if (resetPage) params.set("page", "1");

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

// ============================================================
// حذف همه‌ی فیلترها (حفظ sort در صورت تمایل)
// ============================================================
export function clearFilterParams(fields = [], { keepSort = false } = {}) {
  const updates = {};

  for (const field of fields) {
    if (field.type === "numberRange") {
      updates[field.minParam || `${field.name}Min`] = "";
      updates[field.maxParam || `${field.name}Max`] = "";
      continue;
    }
    if (field.type === "dynamicAttributes") continue; // جداگانه پاک می‌شود
    if (field.type === "sort" && keepSort) continue;
    updates[field.name] = "";
  }

  return updates;
}
