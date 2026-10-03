// src/lib/emailTemplateService.js
import { prisma } from "@/lib/prisma";

// ============================================================
// Cache ساده در حافظه (per-process)
// ============================================================
const templateCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 ثانیه

// ============================================================
// جایگزینی متغیرها در متن
// {{userName}} → "Ali"
// ============================================================
function renderTemplate(text, variables = {}) {
  if (!text) return "";
  return String(text).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === null || value === undefined) return "";
    return String(value);
  });
}

// ============================================================
// Layout عمومی (شبیه email.js فعلی)
// ============================================================
export function emailLayout(content) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e2da; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #13795b; padding: 12px 24px; border-radius: 12px; color: white; font-size: 22px; font-weight: bold;">
          FoodTradeLink
        </div>
      </div>
      ${content}
      <hr style="border: 1px solid #e8e2da; margin: 24px 0;" />
      <p style="color: #7a6e64; font-size: 11px; text-align: center; margin: 0;">
        This is an automated message from FoodTradeLink. Please do not reply directly to this email.
      </p>
    </div>
  `;
}

// ============================================================
// دریافت یک قالب با cache
// ============================================================
export async function getTemplate(key) {
  const cached = templateCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.template;
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { key },
  });

  if (template) {
    templateCache.set(key, {
      template,
      timestamp: Date.now(),
    });
  }

  return template;
}

// ============================================================
// رندر قالب: subject + html + text
// ============================================================
export async function renderEmail(key, variables = {}) {
  const template = await getTemplate(key);

  if (!template) {
    console.warn(`[EmailTemplateService] Template not found: ${key}`);
    return null;
  }

  if (!template.isActive) {
    console.warn(`[EmailTemplateService] Template inactive: ${key}`);
    return null;
  }

  const subject = renderTemplate(template.subject, variables);

  // اگر htmlBody فقط fragment باشد، آن را داخل layout می‌گذاریم
  const isFullHtml = template.htmlBody
    .toLowerCase()
    .includes("<!doctype") || template.htmlBody.toLowerCase().includes("<html");
  const bodyContent = renderTemplate(template.htmlBody, variables);
  const htmlBody = isFullHtml ? bodyContent : emailLayout(bodyContent);

  const textBody = template.textBody
    ? renderTemplate(template.textBody, variables)
    : stripHtml(htmlBody);

  return { subject, htmlBody, textBody };
}

// ============================================================
// helper: حذف تگ‌های HTML برای plain text
// ============================================================
function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// پاک کردن cache (بعد از ویرایش در پنل ادمین)
// ============================================================
export function clearTemplateCache(key = null) {
  if (key) templateCache.delete(key);
  else templateCache.clear();
}