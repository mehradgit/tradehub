// scripts/migrate-categories-v2.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================================
// نقشه‌برداری: نام قدیم → ID جدید
// ============================================================
const CATEGORY_MAP = {
  "Protein": "meat-poultry-game",
  "Legumes, Grains, and Other Foods": "grains-cereals",
  "Dairy and Breakfast": "dairy-eggs",
  "Frozen Foods": "processed-convenience-foods",
  "Condiments": "spices-herbs-seasonings",
  "Canned and Ready-Made Food": "beverages",
  "Sweets and Snacks": "bakery-confectionery-snacks",
};

// زیردسته‌های قدیم هم به ID جدید نگاشت می‌شوند (مهم نیست چندتاش را نگاشت کردیم)
const SUBCATEGORY_MAP = {
  "Rice": "rice",
  "Legumes": null,        // در ساختار جدید نیست → null
  "Pasta": "pasta-noodles",
  "Sugar": "sugar",
  "Honey": "honey-bee-products",
  "Chocolate": "confectionery",
  "Saffron": "whole-spices",
  "Spices": "whole-spices",
  "Tea": "tea",
  "Milk": "milk",
  "Cheese": "cheese",
  "Butter": "butter-cream-ghee",
  // ... اگر نیاز شد بقیه را هم اضافه کنید
};

async function main() {
  console.log("ًںڑ€ Starting category migration...\n");

  // ============================================================
  // غ±. محصولات
  // ============================================================
  let productUpdated = 0;
  const products = await prisma.product.findMany({
    select: { id: true, category: true, subCategory: true },
  });

  for (const p of products) {
    const newCategory = CATEGORY_MAP[p.category];
    if (!newCategory) continue; // قبلاً migrate شده یا ناشناخته

    const newSub = p.subCategory
      ? SUBCATEGORY_MAP[p.subCategory] ?? null
      : null;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        category: newCategory,
        subCategory: newSub,
      },
    });
    productUpdated++;
  }
  console.log(`âœ… Products updated: ${productUpdated}`);

  // ============================================================
  // غ². درخواست‌های خرید
  // ============================================================
  let requestUpdated = 0;
  const requests = await prisma.buyingRequest.findMany({
    select: { id: true, category: true, subCategory: true },
  });

  for (const r of requests) {
    const newCategory = CATEGORY_MAP[r.category];
    if (!newCategory) continue;

    const newSub = r.subCategory
      ? SUBCATEGORY_MAP[r.subCategory] ?? null
      : null;

    await prisma.buyingRequest.update({
      where: { id: r.id },
      data: {
        category: newCategory,
        subCategory: newSub,
      },
    });
    requestUpdated++;
  }
  console.log(`âœ… Requests updated: ${requestUpdated}`);

  console.log("\nâœ¨ Migration completed!");
}

main()
  .catch((e) => {
    console.error("â‌Œ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());