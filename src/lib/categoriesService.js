// src/lib/categoriesService.js
import { prisma } from "@/lib/prisma";
import { categories as defaultCategories } from "@/lib/categories";

const SETTING_KEY = "categories";

// ============================================================
// ساخت داده‌های اولیه از فایل استاتیک
// ============================================================
function buildSeeded() {
  return defaultCategories.map((c, i) => ({
    id: c.id,
    name: c.name,
    nameFa: c.nameFa || null,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    sortOrder: c.sortOrder ?? i,
    parent: c.parent,
    productTypes: c.productTypes || [],
    isActive: true,
  }));
}

// ============================================================
// تشخیص نیاز به migration
// ============================================================
function needsMigration(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return true;

  // نسخه قدیمی: id عددی بود
  if (typeof value[0]?.id === "number") return true;

  // نسخه جدید باید slug داشته باشد
  const hasNewStructure = value.some((c) => c.slug && c.parent !== undefined);
  return !hasNewStructure;
}

// ============================================================
// دریافت
// ============================================================
export async function getCategories() {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (needsMigration(setting?.value)) {
    const seeded = buildSeeded();
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: seeded },
      create: { key: SETTING_KEY, value: seeded },
    });
    return seeded;
  }

  return setting.value;
}

// ============================================================
// ذخیره
// ============================================================
export async function saveCategories(categories) {
  return prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: categories },
    create: { key: SETTING_KEY, value: categories },
  });
}

// ============================================================
// âœ… Force re-seed
// ============================================================
export async function reseedCategories() {
  const seeded = buildSeeded();
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: seeded },
    create: { key: SETTING_KEY, value: seeded },
  });
  return seeded;
}