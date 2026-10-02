// src/lib/categoriesService.js
import { prisma } from "@/lib/prisma";
import { categories as defaultCategories } from "@/lib/categories";

const SETTING_KEY = "categories";

/**
 * دریافت همه‌ی دسته‌بندی‌ها.
 * اگر در DB نبود، از فایل استاتیک seed می‌کنه.
 */
export async function getCategories() {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (!setting?.value || !Array.isArray(setting.value)) {
    // Seed با مقادیر پیش‌فرض
    const seeded = defaultCategories.map((c, i) => ({
      id: c.id,
      name: c.name,
      parent: c.parent,
      icon: null,
      order: i,
      isActive: true,
    }));

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: seeded },
      create: { key: SETTING_KEY, value: seeded },
    });

    return seeded;
  }

  return setting.value;
}

/**
 * ذخیره‌ی آرایه‌ی دسته‌بندی‌ها.
 */
export async function saveCategories(categories) {
  return prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: categories },
    create: { key: SETTING_KEY, value: categories },
  });
}