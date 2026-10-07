// scripts/attach-images-to-products.js
// ============================================================
// اتصال عکس‌های دانلود‌شده به محصولات + جایگزینی عکس‌های قدیمی
//
// رفتار پیش‌فرض:
//   عکس‌های قبلی محصول (توی دیتابیس و روی دیسک) پاک می‌شن
//   و فقط عکس‌های جدید جایگزین می‌شن.
//
// اجرا:
//   node scripts/attach-images-to-products.js            ← جایگزینی
//   node scripts/attach-images-to-products.js --dry      ← تست بدون تغییر
//   node scripts/attach-images-to-products.js --keep-files
//                                                        ← فقط دیتابیس،
//                                                          فایل‌های قدیمی
//                                                          روی دیسک دست‌نخورده
// ============================================================

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// ============================================================
// تنظیمات
// ============================================================
const PROJECT_ROOT = path.join(__dirname, "..");
const PUBLIC_DIR   = path.join(PROJECT_ROOT, "public");
const IMAGES_DIR   = path.join(PUBLIC_DIR, "uploads", "products");

// اگه مسیرت upload (بدون s) هست:
// const IMAGES_DIR = path.join(PUBLIC_DIR, "upload", "products");

const PUBLIC_URL_PREFIX = "/uploads/products";
// اگه با upload هست: const PUBLIC_URL_PREFIX = "/upload/products";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const DRY_RUN         = process.argv.includes("--dry");
const KEEP_OLD_FILES  = process.argv.includes("--keep-files");


// ============================================================
// حذف امن یک فایل عکس روی دیسک
// فقط اگه واقعاً داخل پوشه‌ی public باشه
// ============================================================
function safeDeleteFile(publicUrl) {
  if (!publicUrl || typeof publicUrl !== "string") return false;
  if (!publicUrl.startsWith("/")) return false;

  // مسیر فیزیکی متناظر
  const rel = publicUrl.replace(/^\/+/, "");
  const abs = path.join(PUBLIC_DIR, rel);

  // چک امنیتی: مطمئن شو داخل public هست و ازش بیرون نمی‌زنه
  const normalized = path.normalize(abs);
  if (!normalized.startsWith(path.normalize(PUBLIC_DIR + path.sep))) {
    return false;
  }

  try {
    if (fs.existsSync(normalized)) {
      fs.unlinkSync(normalized);
      return true;
    }
  } catch (err) {
    console.warn(`   ⚠️  نتونستم حذف کنم: ${publicUrl} (${err.message})`);
  }
  return false;
}


// ============================================================
// تابع اصلی
// ============================================================
async function main() {
  console.log("🚀 اتصال عکس‌ها به محصولات (جایگزینی)\n");

  if (DRY_RUN) {
    console.log("🧪 حالت DRY RUN — هیچ چیزی نوشته یا حذف نمی‌شه.\n");
  }
  if (KEEP_OLD_FILES) {
    console.log("📌 حالت KEEP-FILES — فایل‌های قدیمی روی دیسک دست‌نخورده می‌مونن.\n");
  }

  // ====== بررسی پوشه ======
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ پوشه پیدا نشد: ${IMAGES_DIR}`);
    process.exit(1);
  }

  // ====== خواندن فایل‌های عکس جدید ======
  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()));

  console.log(`📁 ${files.length} فایل عکس پیدا شد.\n`);

  if (files.length === 0) {
    console.log("⚠️  هیچ عکسی نیست.");
    return;
  }

  // ====== گروه‌بندی بر اساس productNumber ======
  const byProduct = new Map(); // productNumber -> [filenames]
  const notMatched = [];

  for (const file of files) {
    const m = file.match(/^(\d+)-(\d{1,3})\.(jpe?g|png|gif|webp)$/i);
    if (!m) {
      notMatched.push(file);
      continue;
    }
    const num = parseInt(m[1], 10);
    if (!byProduct.has(num)) byProduct.set(num, []);
    byProduct.get(num).push(file);
  }

  if (notMatched.length > 0) {
    console.log(`⚠️  ${notMatched.length} فایل با الگوی اسم درست نخورد:`);
    notMatched.slice(0, 5).forEach((f) => console.log(`   - ${f}`));
    if (notMatched.length > 5) {
      console.log(`   ... و ${notMatched.length - 5} فایل دیگه`);
    }
    console.log("");
  }

  console.log(`🎯 ${byProduct.size} محصول منحصربه‌فرد پیدا شد.\n`);
  console.log("=".repeat(60));

  // ====== شمارنده‌ها ======
  let updated         = 0;
  let unchanged       = 0;
  let notFound        = 0;
  let deletedFiles    = 0;
  const errors        = [];

  // ====== پردازش هر محصول ======
  for (const [productNumber, filenames] of byProduct.entries()) {
    // مرتب‌سازی: 01, 02, 03, ...
    filenames.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    // ====== پیدا کردن محصول ======
    const product = await prisma.product.findUnique({
      where: { productNumber },
      select: { id: true, name: true, images: true },
    });

    if (!product) {
      console.log(`❌ [${productNumber}] توی دیتابیس نیست`);
      notFound++;
      continue;
    }

    // ====== مسیرهای جدید ======
    const newImages = filenames.map((f) => `${PUBLIC_URL_PREFIX}/${f}`);

    // ====== عکس‌های قدیمی ======
    const oldImages = Array.isArray(product.images)
      ? product.images.filter((u) => typeof u === "string" && u.length > 0)
      : [];

    // ====== چک: عکس‌ها یکسانن؟ ======
    const isSame =
      oldImages.length === newImages.length &&
      oldImages.every((v, i) => v === newImages[i]);

    if (isSame) {
      console.log(
        `✅ [${productNumber}] «${product.name}» — عکس‌ها یکسانن (رد شد)`
      );
      unchanged++;
      continue;
    }

    // ====== حذف عکس‌های قدیمی روی دیسک ======
    // فقط اونایی که توی لیست عکس‌های جدید نیستن
    const newSet = new Set(newImages);
    const oldToDelete = oldImages.filter((u) => !newSet.has(u));

    let deletedForThis = 0;
    if (!KEEP_OLD_FILES && !DRY_RUN) {
      for (const url of oldToDelete) {
        if (safeDeleteFile(url)) {
          deletedForThis++;
          deletedFiles++;
        }
      }
    } else if (KEEP_OLD_FILES) {
      // در این حالت نمی‌خوایم حذف کنیم، فقط بشماریم
      deletedForThis = 0;
    }

    // ====== آپدیت دیتابیس ======
    try {
      if (!DRY_RUN) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: newImages },
        });
      }

      const summaryParts = [];
      summaryParts.push(`${newImages.length} عکس جدید`);
      if (oldToDelete.length > 0) {
        if (KEEP_OLD_FILES) {
          summaryParts.push(`(${oldToDelete.length} فایل قدیمی نگه داشته شد)`);
        } else if (DRY_RUN) {
          summaryParts.push(`(قراره ${oldToDelete.length} فایل قدیمی حذف شه)`);
        } else {
          summaryParts.push(`${deletedForThis} فایل قدیمی حذف شد`);
        }
      }

      console.log(
        `✅ [${productNumber}] «${product.name}» — ${summaryParts.join(" — ")}${
          DRY_RUN ? "  [شبیه‌سازی]" : ""
        }`
      );
      updated++;
    } catch (err) {
      console.error(`❌ [${productNumber}] خطای دیتابیس: ${err.message}`);
      errors.push({ productNumber, error: err.message });
    }
  }

  // ============================================================
  // گزارش نهایی
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 گزارش نهایی");
  console.log("=".repeat(60));
  console.log(`✅ آپدیت شد:                    ${updated}`);
  console.log(`⏭️  بدون تغییر:                  ${unchanged}`);
  console.log(`❌ توی دیتابیس پیدا نشد:         ${notFound}`);

  if (!KEEP_OLD_FILES) {
    console.log(
      `🗑️  فایل‌های قدیمی حذف‌شده روی دیسک: ${
        DRY_RUN ? "(شبیه‌سازی)" : deletedFiles
      }`
    );
  } else {
    console.log(`📌 فایل‌های قدیمی روی دیسک دست‌نخورده موند.`);
  }

  console.log(`⚠️  خطاها:                      ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n❌ جزئیات:");
    errors.slice(0, 10).forEach((e) =>
      console.log(`   • ${e.productNumber}: ${e.error}`)
    );
  }

  if (DRY_RUN) {
    console.log("\n🧪 این فقط شبیه‌سازی بود. برای اجرای واقعی بدون --dry اجرا کن.");
  } else {
    console.log("\n🎉 تمام شد.");
  }
}


main()
  .catch((err) => {
    console.error("\n❌ خطای کلی:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });