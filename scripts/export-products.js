// scripts/export-products.js
// ============================================================
// خروجی گرفتن از اسم و شماره‌ی محصولات در فایل اکسل
//
// اجرا:
//   node scripts/export-products.js
//
// خروجی:
//   scripts/products-export.xlsx
// ============================================================

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("📦 در حال خواندن محصولات از دیتابیس...\n");

  const products = await prisma.product.findMany({
    select: {
      productNumber: true,
      name: true,
    },
    orderBy: { productNumber: "asc" },
  });

  console.log(`✅ ${products.length} محصول پیدا شد.\n`);

  if (products.length === 0) {
    console.log("⚠️  هیچ محصولی توی دیتابیس نیست.");
    return;
  }

  // ====== تبدیل به آرایه‌ی قابل تبدیل به اکسل ======
  // ستون‌ها به انگلیسی نوشته می‌شن تا اکسل مشکل نداشته باشه
  const rows = products.map((p) => ({
    "Product Number": p.productNumber,
    Name: p.name,
  }));

  // ====== ساخت فایل اکسل ======
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // عرض ستون‌ها
  worksheet["!cols"] = [
    { wch: 18 }, // Product Number
    { wch: 60 }, // Name
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  const outputPath = path.join(__dirname, "products-export.xlsx");
  XLSX.writeFile(workbook, outputPath);

  console.log(`🎉 فایل اکسل ساخته شد:\n   ${outputPath}\n`);
  console.log(`📊 مجموع ردیف‌ها: ${rows.length}`);
}

main()
  .catch((err) => {
    console.error("❌ خطا:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });