// scripts/import-honey-products.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");

const prisma = new PrismaClient();

// ============================================================
// تنظیمات
// ============================================================
const INPUT_FILE = path.join(__dirname, "honey-cleaned.json");
const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

// ============================================================
// توابع کمکی
// ============================================================
function generateNumber() {
  return Math.floor(Math.random() * 9000000) + 1000000;
}

function generateSlug(text) {
  if (!text) return "item";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

async function generateUniqueUserNumber() {
  let attempts = 0;
  while (attempts < 20) {
    const num = generateNumber();
    const exists = await prisma.user.findUnique({
      where: { profileNumber: num },
    });
    if (!exists) return num;
    attempts++;
  }
  throw new Error("Could not generate unique profile number");
}

async function generateUniqueProductNumber() {
  let attempts = 0;
  while (attempts < 20) {
    const num = generateNumber();
    const exists = await prisma.product.findUnique({
      where: { productNumber: num },
    });
    if (!exists) return num;
    attempts++;
  }
  throw new Error("Could not generate unique product number");
}

async function generateUniqueUserSlug(baseText) {
  const baseSlug = generateSlug(baseText || "user");
  let slug = baseSlug;
  let counter = 1;

  while (counter < 200) {
    const exists = await prisma.user.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return `${baseSlug}_${Date.now()}`;
}

async function generateUniqueProductSlug(baseText) {
  const baseSlug = generateSlug(baseText || "product");
  let slug = baseSlug;
  let counter = 1;

  while (counter < 200) {
    const exists = await prisma.product.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return `${baseSlug}_${Date.now()}`;
}

// ============================================================
// ساخت ایمیل یکتا برای تأمین‌کننده
// ============================================================
function buildSupplierEmail(supplierName, index) {
  const base = generateSlug(supplierName) || `supplier${index}`;
  return `${base}_${index}@imported.foodhub.local`;
}

// ============================================================
// دانلود تصویر
// ============================================================
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const request = client.get(
      url,
      {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; FoodHub-Importer/1.0)",
        },
      },
      (response) => {
        // پیگیری redirect
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          return downloadImage(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          return reject(
            new Error(`HTTP ${response.statusCode} for ${url}`)
          );
        }

        const fileStream = fs.createWriteStream(destPath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolve(destPath);
        });

        fileStream.on("error", (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }
    );

    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// ============================================================
// پردازش تصاویر یک محصول
// ============================================================
async function processImages(imageUrls, productSlug) {
  if (!imageUrls || imageUrls.length === 0) {
    return ["/uploads/products/placeholder.jpg"];
  }

  const localPaths = [];
  const MAX_IMAGES = 3; // فقط ۳ تصویر اول

  for (let i = 0; i < Math.min(imageUrls.length, MAX_IMAGES); i++) {
    const url = imageUrls[i];
    if (!url || typeof url !== "string") continue;

    try {
      // تشخیص پسوند از URL
      const extMatch = url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const filename = `${productSlug}-${i + 1}-${crypto
        .randomBytes(4)
        .toString("hex")}.${ext}`;
      const destPath = path.join(UPLOAD_DIR, filename);

      await downloadImage(url, destPath);
      localPaths.push(`/uploads/products/${filename}`);
      console.log(`      📸 Downloaded: ${filename}`);
    } catch (err) {
      console.warn(
        `      ⚠️  Failed to download image: ${err.message}`
      );
    }
  }

  return localPaths.length > 0
    ? localPaths
    : ["/uploads/products/placeholder.jpg"];
}

// ============================================================
// ساخت یا یافتن تأمین‌کننده
// ============================================================
async function findOrCreateSupplier(supplierData, index) {
  // اول با ایمیل چک کن
  const email = buildSupplierEmail(supplierData.name, index);

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) return { user, created: false };

  // اگه نبود، با companyName چک کن
  user = await prisma.user.findFirst({
    where: { companyName: supplierData.companyName, role: "SUPPLIER" },
  });
  if (user) return { user, created: false };

  // ساخت کاربر جدید
  const profileNumber = await generateUniqueUserNumber();
  const slug = await generateUniqueUserSlug(supplierData.companyName);

  const newUser = await prisma.user.create({
    data: {
      email,
      name: supplierData.contactPerson || supplierData.name,
      companyName: supplierData.companyName,
      profileNumber,
      slug,
      role: "SUPPLIER",
      plan: "FREE",
      country: supplierData.country,
      countryCode: supplierData.countryCode,
      businessType: supplierData.businessType,
      phone: supplierData.phone,
      website: supplierData.website,
      address: supplierData.address,
      bio: supplierData.bio,
      companyEmail: email,
      employeeCount: supplierData.establishedYear
        ? null
        : null,
      socialLinks: {
        contactPerson: supplierData.contactPerson,
        contactDesignation: supplierData.contactDesignation,
        establishedYear: supplierData.establishedYear,
        memberSince: supplierData.memberSince,
        membershipStatus: supplierData.membershipStatus,
        marketsCovered: supplierData.marketsCovered,
        domesticMarkets: supplierData.domesticMarkets,
        certifications: supplierData.certifications,
        importedFrom: "Go4WorldBusiness",
      },
      registrationComplete: true,
      emailVerified: new Date(),
    },
  });

  return { user: newUser, created: true };
}

// ============================================================
// تابع اصلی
// ============================================================
async function main() {
  console.log("🚀 Starting Honey Products Import...\n");

  // ==== بررسی فایل ورودی ====
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error(`   Please run: node scripts/cleanup-honey-data.js first.`);
    process.exit(1);
  }

  // ==== بررسی پوشه‌ی آپلود ====
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Created upload directory: ${UPLOAD_DIR}\n`);
  }

  // ==== خواندن داده ====
  const items = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  console.log(`📦 Loaded ${items.length} items from ${INPUT_FILE}\n`);

  // ==== آمار ====
  const stats = {
    suppliersCreated: 0,
    suppliersReused: 0,
    productsCreated: 0,
    productsSkipped: 0,
    imagesDownloaded: 0,
    errors: [],
  };

  // ==== کش تأمین‌کنندگان ====
  const supplierCache = new Map();

  // ==== پردازش هر آیتم ====
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = `[${i + 1}/${items.length}]`;

    try {
      console.log(`${progress} Processing: "${item.product.name}"`);

      // ==== تأمین‌کننده ====
      let supplier;
      if (supplierCache.has(item.supplier.name)) {
        supplier = supplierCache.get(item.supplier.name);
        stats.suppliersReused++;
      } else {
        const result = await findOrCreateSupplier(item.supplier, i + 1);
        supplier = result.user;
        supplierCache.set(item.supplier.name, supplier);

        if (result.created) {
          stats.suppliersCreated++;
          console.log(`      ✅ Created supplier: ${supplier.companyName}`);
        } else {
          stats.suppliersReused++;
          console.log(`      ♻️  Reused supplier: ${supplier.companyName}`);
        }
      }

      // ==== بررسی وجود محصول تکراری ====
      const existingProduct = await prisma.product.findFirst({
        where: {
          userId: supplier.id,
          name: item.product.name,
        },
      });

      if (existingProduct) {
        console.log(`      ⏭️  Product already exists, skipping.\n`);
        stats.productsSkipped++;
        continue;
      }

      // ==== تولید شماره و اسلاگ یکتا ====
      const productNumber = await generateUniqueProductNumber();
      const productSlug = await generateUniqueProductSlug(
        item.product.name
      );

      // ==== پردازش تصاویر ====
      const images = await processImages(
        item.product.images,
        productSlug
      );
      stats.imagesDownloaded += images.filter(
        (p) => !p.includes("placeholder")
      ).length;

      // ==== ساخت محصول ====
      await prisma.product.create({
        data: {
          productNumber,
          slug: productSlug,
          name: item.product.name.slice(0, 200),
          category: item.product.category,
          subCategory: item.product.subCategory,
          shortDesc:
            item.product.shortDesc.slice(0, 250) ||
            item.product.name.slice(0, 200),
          fullDesc: item.product.fullDesc,
          price: item.product.price,
          currency: item.product.currency,
          unit: item.product.unit,
          moq: item.product.moq,
          stock: null,
          leadTime: item.product.leadTime,
          images: images,
          badge: null,
          country: item.product.country,
          countryCode: item.product.countryCode,
          origin: item.product.origin,
          certifications: item.product.certifications,
          packaging: item.product.packaging,
          shippingTerms: item.product.shippingTerms,
          isVisible: true,
          status: "APPROVED",
          approvedAt: new Date(),
          userId: supplier.id,
        },
      });

      stats.productsCreated++;
      console.log(`      ✅ Product created (ID #${productNumber})\n`);
    } catch (err) {
      stats.errors.push(
        `${item.product.name}: ${err.message}`
      );
      console.error(`      ❌ Error: ${err.message}\n`);
    }
  }

  // ============================================================
  // گزارش نهایی
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Suppliers created:   ${stats.suppliersCreated}`);
  console.log(`♻️  Suppliers reused:   ${stats.suppliersReused}`);
  console.log(`✅ Products created:    ${stats.productsCreated}`);
  console.log(`⏭️  Products skipped:   ${stats.productsSkipped}`);
  console.log(`📸 Images downloaded:   ${stats.imagesDownloaded}`);
  console.log(`❌ Errors:              ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n❌ Error details:");
    stats.errors.slice(0, 10).forEach((e) => console.log(`   • ${e}`));
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }

  console.log("\n✨ Import completed!");
}

main()
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });