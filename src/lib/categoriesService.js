// src/lib/categoriesService.js
import { prisma } from "@/lib/prisma";
import { categories as defaultCategories } from "@/lib/categories";

const SETTING_KEY = "categories";

// ============================================================
// Build the initial data from the static file
// ============================================================
function buildSeeded() {
  return defaultCategories.map((c, i) => ({
    id: c.id,
    name: c.name,
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
// Detect whether a migration is needed
// ============================================================
function needsMigration(value) {
  if (!value || !Array.isArray(value) || value.length === 0) return true;

  // Old version: the id was numeric
  if (typeof value[0]?.id === "number") return true;

  // The new version must have a slug
  const hasNewStructure = value.some((c) => c.slug && c.parent !== undefined);
  return !hasNewStructure;
}

// ============================================================
// Read
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
// Save
// ============================================================
export async function saveCategories(categories) {
  return prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: categories },
    create: { key: SETTING_KEY, value: categories },
  });
}

// ============================================================
// Force re-seed
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