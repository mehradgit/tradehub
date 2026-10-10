// src/lib/adminAlerts.js
// ============================================================
// قالب‌های اطلاع‌رسانی تلگرامی برای رویدادهای مهم سایت
//
// هر تابع fire-and-forget است: هرگز خطا برنمی‌گرداند
// و هرگز درخواست کاربر را کند یا خراب نمی‌کند.
//
// خاموش/روشن کردن هر نوع از طریق .env:
//   TELEGRAM_USER_ALERTS     ← عضویت‌های جدید (پیش‌فرض true)
//   TELEGRAM_PRODUCT_ALERTS  ← محصولات جدید (پیش‌فرض true)
//   TELEGRAM_REQUEST_ALERTS  ← درخواست‌های خرید جدید (پیش‌فرض true)
//   TELEGRAM_VIEW_ALERTS     ← بازدیدها (پیش‌فرض true)
//   TELEGRAM_AD_ALERTS       ← درخواست‌های تبلیغات (پیش‌فرض true)
// ============================================================
import { sendTelegramAlert } from "@/lib/telegramService";
import { countryLabel } from "@/lib/geoIp";

// ====== کمکی‌ها ======

function flagEnabled(name, fallback = true) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value !== "false" && value !== "0";
}

function baseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return String(raw).replace(/\/+$/, "");
}

// زمان محلی سرور (تایم‌زون سرور مهم است — در مستندات توضیح داده شده)
function formatTime(date = new Date()) {
  return date.toLocaleString("en-GB", { hour12: false });
}

function countryText(code) {
  if (!code) return "نامشخص";
  const name = countryLabel(code);
  return name ? `${name} (${code})` : code;
}

function categoryPath(parts = []) {
  return parts.filter(Boolean).join(" › ") || "—";
}

// ============================================================
// 👤 عضویت کاربر جدید
// ============================================================
export function alertNewUser(user) {
  if (!flagEnabled("TELEGRAM_USER_ALERTS")) return;

  sendTelegramAlert(
    "عضویت جدید",
    [
      ["نام", user.name || "—"],
      ["شرکت", user.companyName || "—"],
      ["ایمیل", user.email || "—"],
      ["کشور", user.country || "—"],
      ["زمان", formatTime()],
    ],
    {
      icon: "👤",
      link: {
        url: `${baseUrl()}/admin/users/${user.id}`,
        label: "مشاهده کاربر در پنل",
      },
    }
  );
}

// ============================================================
// 📦 محصول جدید (در انتظار تأیید)
// ============================================================
export function alertNewProduct(product, supplier = {}) {
  if (!flagEnabled("TELEGRAM_PRODUCT_ALERTS")) return;

  sendTelegramAlert(
    "محصول جدید — در انتظار تأیید",
    [
      ["محصول", product.name || "—"],
      [
        "تأمین‌کننده",
        supplier.companyName || supplier.name || "—",
      ],
      [
        "دسته‌بندی",
        categoryPath([
          product.category,
          product.subCategory,
          product.productType,
        ]),
      ],
      [
        "قیمت",
        `${product.price ?? "—"} ${product.currency || "USD"} / ${
          product.unit || "kg"
        }`,
      ],
      ["MOQ", product.moq ?? "—"],
      ["زمان", formatTime()],
    ],
    {
      icon: "📦",
      link: {
        url: `${baseUrl()}/admin/products/${product.id}`,
        label: "تأیید محصول در پنل",
      },
    }
  );
}

// ============================================================
// 📋 درخواست خرید جدید (در انتظار تأیید)
// ============================================================
export function alertNewBuyingRequest(request, buyer = {}) {
  if (!flagEnabled("TELEGRAM_REQUEST_ALERTS")) return;

  sendTelegramAlert(
    "درخواست خرید جدید — در انتظار تأیید",
    [
      ["عنوان", request.title || "—"],
      ["خریدار", buyer.companyName || buyer.name || "—"],
      [
        "دسته‌بندی",
        categoryPath([
          request.category,
          request.subCategory,
          request.productType,
        ]),
      ],
      ["مقدار", `${request.quantity ?? "—"} ${request.unit || "kg"}`],
      ["تحویل به", request.deliveryCountry || "—"],
      ["زمان", formatTime()],
    ],
    {
      icon: "📋",
      link: {
        url: `${baseUrl()}/admin/requests/${request.id}`,
        label: "تأیید درخواست در پنل",
      },
    }
  );
}

// ============================================================
// 👁️ بازدید (محصول / درخواست / پروفایل)
// ============================================================
export function alertNewView({ kind, title, url, countryCode, views }) {
  if (!flagEnabled("TELEGRAM_VIEW_ALERTS")) return;

  const titles = {
    product: "بازدید محصول",
    request: "بازدید درخواست خرید",
    profile: "بازدید پروفایل",
  };

  sendTelegramAlert(
    titles[kind] || "بازدید",
    [
      ["عنوان", title || "—"],
      ["کشور بازدیدکننده", countryText(countryCode)],
      ["تعداد کل بازدید", views ?? "—"],
      ["زمان", formatTime()],
    ],
    {
      icon: "👁️",
      link: url ? { url, label: "مشاهده صفحه" } : undefined,
    }
  );
}

// ============================================================
// 📣 درخواست تبلیغات (صفحه /advertise)
// ============================================================
export function alertAdvertiseInquiry({
  name,
  company,
  email,
  phone,
  country,
  placements = [],
  budget,
  message,
}) {
  if (!flagEnabled("TELEGRAM_AD_ALERTS")) return;

  const rows = [
    ["نام", name || "—"],
    ["شرکت", company || "—"],
    ["ایمیل", email || "—"],
    ["تلفن", phone || "—"],
    ["کشور", country || "—"],
    ["بودجه", budget || "—"],
    ["صفحات", placements.join(", ") || "—"],
  ];

  if (message) {
    rows.push([
      "پیام",
      message.length > 180 ? message.slice(0, 180) + "…" : message,
    ]);
  }

  rows.push(["زمان", formatTime()]);

  sendTelegramAlert("درخواست تبلیغات", rows, {
    icon: "📣",
    link: {
      url: `${baseUrl()}/advertise`,
      label: "صفحه تبلیغات",
    },
  });
}
