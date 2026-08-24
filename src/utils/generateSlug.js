// src/utils/generateSlug.js
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // حذف کاراکترهای غیرمجاز
    .replace(/\s+/g, '_')         // جایگزینی فاصله با زیرخط
    .slice(0, 50);                // محدودیت طول
}