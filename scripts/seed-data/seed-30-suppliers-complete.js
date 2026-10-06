// scripts/seed-30-suppliers-complete.js
// ============================================================
// درج ۳۰ شرکت + ۳۰۰ محصول + دانلود ~۲۰۰۰ تصویر
//
// اجرا:
//   node scripts/seed-30-suppliers-complete.js --dry
//   node scripts/seed-30-suppliers-complete.js
//   node scripts/seed-30-suppliers-complete.js --images-only
//   node scripts/seed-30-suppliers-complete.js --no-images
// ============================================================

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const http = require("http");

const { companies } = require("./companies");
const { productPools } = require("./product-pools");

const prisma = new PrismaClient();

// ============================================================
// تنظیمات
// ============================================================
const CONFIG = {
  concurrency: 4,           // دانلود همزمان
  imageTimeout: 25000,      // ۲۵ ثانیه
  maxRetries: 3,
  retryBackoff: 1500,       // ms
  galleryPerCompany: 6,
  imagesPerProduct: 6,
  productPriceJitter: 0.12, // ±۱۲٪ نوسان قیمت
  sizes: {
    logo:    { w: 400,  h: 400  },
    cover:   { w: 1200, h: 400  },
    gallery: { w: 800,  h: 600  },
    product: { w: 800,  h: 600  },
  },
};

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const PROFILE_DIR = path.join(UPLOADS_ROOT, "profiles");
const PRODUCT_DIR = path.join(UPLOADS_ROOT, "products");

const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry");
const NO_IMAGES = ARGS.includes("--no-images");
const IMAGES_ONLY = ARGS.includes("--images-only");

// ============================================================
// ابزارها
// ============================================================
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function shortHash(input) {
  return crypto.createHash("md5").update(String(input)).digest("hex").slice(0, 8);
}

function generateProfileNumber(existing) {
  let n;
  do {
    n = Math.floor(Math.random() * 9000000) + 1000000;
  } while (existing.has(n));
  existing.add(n);
  return n;
}

function generateProductNumber(existing) {
  let n;
  do {
    n = Math.floor(Math.random() * 9000000) + 1000000;
  } while (existing.has(n));
  existing.add(n);
  return n;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function loremFlickrUrl(keyword, w, h, seed) {
  const kw = String(keyword).split(/[\s,]+/).filter(Boolean).join(",").toLowerCase();
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(kw)}?random=${seed}`;
}

function picsumUrl(w, h, seed) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}.jpg`;
}

// ============================================================
// دانلود یک تصویر با retry
// ============================================================
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(
      url,
      {
        timeout: CONFIG.imageTimeout,
        headers: { "User-Agent": "Mozilla/5.0 FoodHub-Seeder/1.0" },
      },
      (response) => {
        // redirect
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          return downloadFile(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        const stream = fsSync.createWriteStream(dest);
        response.pipe(stream);
        stream.on("finish", () => stream.close(() => resolve(dest)));
        stream.on("error", (err) => {
          fsSync.unlink(dest, () => {});
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

async function downloadWithRetry(url, dest) {
  for (let i = 0; i < CONFIG.maxRetries; i++) {
    try {
      await downloadFile(url, dest);
      const stat = await fs.stat(dest);
      if (stat.size < 100) throw new Error("Empty file");
      return true;
    } catch (err) {
      if (i === CONFIG.maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, CONFIG.retryBackoff * (i + 1)));
    }
  }
  return false;
}

// ============================================================
// دانلود با fallback (LoremFlickr → Picsum)
// ============================================================
async function fetchImage({ keyword, width, height, destDir, filenameSeed, existingFiles }) {
  const ext = "jpg";
  const filename = `${filenameSeed}.${ext}`;
  const dest = path.join(destDir, filename);

  // اگر قبلاً دانلود شده، دوباره نکن
  if (existingFiles.has(filename) || (await fileExists(dest))) {
    existingFiles.add(filename);
    return `/uploads/${path.basename(destDir)}/${filename}`;
  }

  if (DRY || NO_IMAGES) {
    return `/uploads/${path.basename(destDir)}/${filename}`;
  }

  const seed = shortHash(filenameSeed);

  // تلاش اول: LoremFlickr
  const primaryUrl = loremFlickrUrl(keyword, width, height, seed);
  try {
    await downloadWithRetry(primaryUrl, dest);
    existingFiles.add(filename);
    return `/uploads/${path.basename(destDir)}/${filename}`;
  } catch (err) {
    // Fallback: Picsum
  }

  // تلاش دوم: Picsum (تصادفی، ولی همیشه کار می‌کند)
  const fallbackUrl = picsumUrl(width, height, seed);
  try {
    await downloadWithRetry(fallbackUrl, dest);
    existingFiles.add(filename);
    return `/uploads/${path.basename(destDir)}/${filename}`;
  } catch (err) {
    console.warn(`   ⚠️  Failed image ${filename}: ${err.message}`);
    return null;
  }
}

// ============================================================
// دانلود مجموعه‌ای از تصاویر به‌صورت موازی
// ============================================================
async function downloadBatch(tasks, existingFiles) {
  const results = [];
  const queue = [...tasks];

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;
      const result = await fetchImage({ ...task, existingFiles });
      results.push({ ...task, path: result });
    }
  }

  const workers = Array.from({ length: CONFIG.concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

// ============================================================
// انتخاب محصولات یک شرکت
// ============================================================
function pickProductsForCompany(company, count = 10) {
  const pool = productPools[company.primaryCategory] || [];
  if (pool.length === 0) return [];

  // shuffle deterministic بر اساس نام شرکت
  const seedNum = parseInt(shortHash(company.email).slice(0, 6), 16);
  const shuffled = [...pool].sort((a, b) => {
    const ha = parseInt(shortHash(company.email + a.name).slice(0, 6), 16);
    const hb = parseInt(shortHash(company.email + b.name).slice(0, 6), 16);
    return ha - hb;
  });

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function jitterPrice(basePrice, seed) {
  const h = parseInt(shortHash(seed).slice(0, 6), 16) / 0xffffff;
  const factor = 1 + (h - 0.5) * 2 * CONFIG.productPriceJitter;
  return Math.round(basePrice * factor * 100) / 100;
}

function buildProductDescription(product, company) {
  const country = company.country;
  return `<p><strong>${product.name}</strong> is a premium product supplied directly from ${country} by ${company.companyName}. We offer consistent quality, competitive pricing, and reliable export documentation.</p><p>Available in bulk (container loads) and retail packaging. Custom packaging and private label available on request. Full traceability from source to destination.</p><p><strong>Certifications:</strong> ISO 22000, HACCP — additional certifications available per buyer requirements.</p><p><strong>Shipping:</strong> FOB / CIF / CFR — major ports from ${country}.</p>`;
}

// ============================================================
// Main
// ============================================================
async function main() {
  const startTime = Date.now();

  console.log(`\n${DRY ? "🔍 DRY RUN" : "🚀"} Seeding 30 suppliers + products + images`);
  console.log(`   Images: ${NO_IMAGES ? "DISABLED" : IMAGES_ONLY ? "ONLY" : "ENABLED"}`);
  console.log(`   Concurrency: ${CONFIG.concurrency}\n`);

  // ---------- دایرکتوری‌ها ----------
  if (!DRY && !NO_IMAGES) {
    await ensureDir(PROFILE_DIR);
    await ensureDir(PRODUCT_DIR);
    console.log(`📁 Profiles: ${PROFILE_DIR}`);
    console.log(`📁 Products: ${PRODUCT_DIR}\n`);
  }

  // ---------- کش فایل‌های موجود ----------
  let existingProfileFiles = new Set();
  let existingProductFiles = new Set();
  if (fsSync.existsSync(PROFILE_DIR)) {
    existingProfileFiles = new Set(await fs.readdir(PROFILE_DIR));
  }
  if (fsSync.existsSync(PRODUCT_DIR)) {
    existingProductFiles = new Set(await fs.readdir(PRODUCT_DIR));
  }

  // ---------- شماره‌های یکتا ----------
  const existingProfileNumbers = new Set(
    (await prisma.user.findMany({ select: { profileNumber: true } })).map(
      (u) => u.profileNumber
    )
  );
  const existingProductNumbers = new Set(
    (await prisma.product.findMany({ select: { productNumber: true } })).map(
      (p) => p.productNumber
    )
  );

  const stats = {
    usersCreated: 0,
    usersUpdated: 0,
    usersSkipped: 0,
    productsCreated: 0,
    productsSkipped: 0,
    imagesDownloaded: 0,
    errors: [],
  };

  // ============================================================
  // حلقه روی شرکت‌ها
  // ============================================================
  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const progress = `[${i + 1}/${companies.length}]`;
    const companySlug = slugify(c.companyName);

    console.log(`\n${progress} 🏢 ${c.companyName} (${c.country})`);

    try {
      // ---------- تصاویر شرکت ----------
      let logoPath = null;
      let coverPath = null;
      let galleryPaths = [];

      if (!NO_IMAGES) {
        // لوگو
        console.log(`   📸 logo, cover, ${CONFIG.galleryPerCompany} gallery...`);
        const logoTask = {
          keyword: c.logoKeyword || "food,company",
          width: CONFIG.sizes.logo.w, height: CONFIG.sizes.logo.h,
          destDir: PROFILE_DIR,
          filenameSeed: `logo-${companySlug}-${shortHash(c.email)}`,
        };
        const coverTask = {
          keyword: c.coverKeyword || "food,export",
          width: CONFIG.sizes.cover.w, height: CONFIG.sizes.cover.h,
          destDir: PROFILE_DIR,
          filenameSeed: `cover-${companySlug}-${shortHash(c.email)}`,
        };
        const galleryTasks = Array.from({ length: CONFIG.galleryPerCompany }, (_, gi) => ({
          keyword: (c.galleryKeywords && c.galleryKeywords[gi]) || "food",
          width: CONFIG.sizes.gallery.w, height: CONFIG.sizes.gallery.h,
          destDir: PROFILE_DIR,
          filenameSeed: `gallery-${companySlug}-${gi + 1}-${shortHash(c.email)}`,
        }));

        const allTasks = [logoTask, coverTask, ...galleryTasks];
        const results = await downloadBatch(allTasks, existingProfileFiles);

        logoPath = results[0]?.path || null;
        coverPath = results[1]?.path || null;
        galleryPaths = results.slice(2).map((r) => r.path).filter(Boolean);
        stats.imagesDownloaded += results.filter((r) => r.path).length;

        console.log(`   ✅ Images: ${results.filter((r) => r.path).length}/${allTasks.length}`);
      }

      // ---------- Upsert User ----------
      let user = await prisma.user.findUnique({ where: { email: c.email } });

      if (user) {
        if (!IMAGES_ONLY) {
          // فقط تصاویر را به‌روز کن اگر خالی بودند
          if (logoPath || coverPath || galleryPaths.length > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                logo: logoPath || user.logo,
                coverImage: coverPath || user.coverImage,
                galleryImages:
                  galleryPaths.length > 0 ? galleryPaths : user.galleryImages,
              },
            });
            stats.usersUpdated++;
            console.log(`   ♻️  Updated: ${c.email}`);
          } else {
            stats.usersSkipped++;
            console.log(`   ♻️  Skip (exists): ${c.email}`);
          }
        } else {
          stats.usersSkipped++;
          console.log(`   ♻️  Skip (images-only, user exists)`);
        }
      } else if (!IMAGES_ONLY) {
        const profileNumber = generateProfileNumber(existingProfileNumbers);
        user = await prisma.user.create({
          data: {
            profileNumber,
            slug: companySlug,
            name: c.name,
            email: c.email,
            emailVerified: new Date(),
            role: "SUPPLIER",
            plan: c.plan,
            companyName: c.companyName,
            country: c.country,
            city: c.city,
            countryCode: c.countryCode,
            postalCode: c.postalCode,
            businessType: c.businessType,
            phone: c.phone,
            bio: c.bio,
            address: c.address,
            website: c.website || null,
            companyEmail: c.companyEmail,
            employeeCount: c.employeeCount,
            socialLinks: c.socialLinks,
            galleryImages: galleryPaths,
            logo: logoPath,
            coverImage: coverPath,
            primaryCategory: c.primaryCategory,
            primarySubCategory: c.primarySubCategory,
            registrationComplete: true,
          },
        });
        stats.usersCreated++;
        console.log(`   ✅ User created: #${profileNumber}`);
      }

      if (!user) continue;

      // ---------- محصولات ----------
      if (IMAGES_ONLY) continue;

      const existingProductCount = await prisma.product.count({
        where: { userId: user.id },
      });
      const productsToCreate = Math.max(0, 10 - existingProductCount);
      if (productsToCreate === 0) {
        console.log(`   ♻️  10 products already exist, skipping.`);
        continue;
      }

      const productPicks = pickProductsForCompany(c, 10);
      console.log(`   📦 Creating ${productPicks.length} products...`);

      for (let pi = 0; pi < productPicks.length; pi++) {
        const pool = productPicks[pi];

        // بررسی وجود محصول
        const existingProduct = await prisma.product.findFirst({
          where: { userId: user.id, name: pool.name },
          select: { id: true },
        });
        if (existingProduct) {
          stats.productsSkipped++;
          continue;
        }

        // ---------- تصاویر محصول ----------
        let productImages = [];
        if (!NO_IMAGES) {
          const productSlug = slugify(pool.name);
          const imageTasks = Array.from(
            { length: CONFIG.imagesPerProduct },
            (_, ii) => ({
              keyword: pool.keywords,
              width: CONFIG.sizes.product.w,
              height: CONFIG.sizes.product.h,
              destDir: PRODUCT_DIR,
              filenameSeed: `prod-${companySlug}-${productSlug}-${ii + 1}-${shortHash(c.email + pool.name + ii)}`,
            })
          );
          const imageResults = await downloadBatch(imageTasks, existingProductFiles);
          productImages = imageResults.map((r) => r.path).filter(Boolean);
          stats.imagesDownloaded += productImages.length;
        }

        if (productImages.length === 0) {
          productImages = ["/uploads/products/placeholder.jpg"];
        }

        // ---------- قیمت با jitter ----------
        const price = jitterPrice(pool.price, c.email + pool.name);

        // ---------- محصول ----------
        const productNumber = generateProductNumber(existingProductNumbers);
        const productSlug = slugify(pool.name);

        await prisma.product.create({
          data: {
            productNumber,
            slug: productSlug,
            name: pool.name,
            category: c.primaryCategory,
            subCategory: c.primarySubCategory,
            productType: null,
            shortDesc: `${pool.name} from ${c.companyName}, ${c.country}. Bulk export quality, competitive pricing.`,
            fullDesc: buildProductDescription(pool, c),
            price,
            currency: "USD",
            unit: pool.unit,
            moq: pool.moq,
            stock: null,
            leadTime: null,
            images: productImages,
            country: c.country,
            countryCode: c.countryCode,
            origin: c.country,
            certifications: c.socialLinks?.certifications || null,
            shippingTerms: "FOB",
            isVisible: true,
            status: "APPROVED",
            approvedAt: new Date(),
            userId: user.id,
          },
        });

        stats.productsCreated++;
        if ((pi + 1) % 5 === 0) {
          console.log(`      … ${pi + 1}/${productPicks.length} products`);
        }
      }

      console.log(`   ✅ Products done: ${productPicks.length}`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      stats.errors.push({ company: c.companyName, error: err.message });
    }
  }

  // ============================================================
  // گزارش نهایی
  // ============================================================
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n" + "=".repeat(64));
  console.log("📊 SEED SUMMARY");
  console.log("=".repeat(64));
  console.log(`👥 Users created:        ${stats.usersCreated}`);
  console.log(`♻️  Users updated:        ${stats.usersUpdated}`);
  console.log(`⏭️  Users skipped:        ${stats.usersSkipped}`);
  console.log(`📦 Products created:     ${stats.productsCreated}`);
  console.log(`⏭️  Products skipped:     ${stats.productsSkipped}`);
  console.log(`📸 Images downloaded:    ${stats.imagesDownloaded}`);
  console.log(`❌ Errors:               ${stats.errors.length}`);
  console.log(`⏱️  Duration:             ${duration} min`);

  if (stats.errors.length) {
    console.log("\n❌ Error details (first 10):");
    stats.errors.slice(0, 10).forEach((e) =>
      console.log(`   • ${e.company}: ${e.error}`)
    );
  }

  // آمار دیتابیس
  const [totalSuppliers, totalProducts, totalImages] = await Promise.all([
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.product.count(),
    Promise.resolve(stats.imagesDownloaded),
  ]);
  console.log(`\n📍 Total suppliers in DB: ${totalSuppliers}`);
  console.log(`📍 Total products in DB:  ${totalProducts}`);
  console.log("\n✨ Done!");
}

main()
  .catch((err) => {
    console.error("\n❌ Fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());