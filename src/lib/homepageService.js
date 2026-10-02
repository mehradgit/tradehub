// src/lib/homepageService.js
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "homepageSections";

export const DEFAULT_SECTIONS = [
  {
    id: "products-latest",
    type: "products",
    mode: "latest",
    title: "Featured Products",
    subtitle: "Popular wholesale products from verified suppliers.",
    icon: "fa-star",
    category: null,
    subCategory: null,
    itemIds: [],
    limit: 6,
    order: 0,
    position: "top",           // ✅ جدید
    isActive: true,
  },
  {
    id: "requests-latest",
    type: "requests",
    mode: "latest",
    title: "Buying Requests",
    subtitle: "Connect with buyers actively looking for food products.",
    icon: "fa-shopping-cart",
    category: null,
    subCategory: null,
    itemIds: [],
    limit: 6,
    order: 1,
    position: "top",           // ✅ جدید
    isActive: true,
  },
];

export async function getHomepageSections() {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (!setting?.value || !Array.isArray(setting.value)) {
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: DEFAULT_SECTIONS },
      create: { key: SETTING_KEY, value: DEFAULT_SECTIONS },
    });
    return DEFAULT_SECTIONS;
  }

  // ✅ اطمینان از وجود position برای بخش‌های قدیمی
  const normalized = setting.value.map((s) => ({
    ...s,
    position: s.position || "top",
    itemIds: s.itemIds || [],
  }));

  return normalized;
}

export async function getActiveHomepageSections() {
  const sections = await getHomepageSections();
  return sections
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveHomepageSections(sections) {
  return prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: sections },
    create: { key: SETTING_KEY, value: sections },
  });
}