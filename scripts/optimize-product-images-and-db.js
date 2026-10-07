
// scripts/optimize-product-images-and-db.js
// ============================================================
// بهینه‌سازی تصاویر محصولات + بروزرسانی URL در Prisma
//
// مثال:
//   2759501-04.jpg
//
// تبدیل:
//   2759501-04.webp
//
// و در دیتابیس:
//
//   /uploads/products/2759501-04.jpg
//
// تبدیل می‌شود به:
//
//   /uploads/products/2759501-04.webp
//
// خروجی تصاویر:
//   1200 × 1200
//   WebP
//   Quality 82
//   پس‌زمینه سفید
//
// اجرا:
//
//   node scripts/optimize-product-images-and-db.js
//
// تست بدون تغییر:
//
//   node scripts/optimize-product-images-and-db.js --dry
//
// پردازش مجدد WebP:
//
//   node scripts/optimize-product-images-and-db.js --force
//
// ============================================================

require("dotenv/config");

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ============================================================
// تنظیمات
// ============================================================

const PROJECT_ROOT = path.join(__dirname, "..");

const IMAGES_DIR = path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "products"
);

const PUBLIC_URL_PREFIX = "/uploads/products";

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 1200;

const WEBP_QUALITY = 82;

const IMAGE_EXTS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".avif",
]);

const DRY_RUN = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");

// ============================================================
// ابزارها
// ============================================================

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];

    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}

function compressionPercent(oldSize, newSize) {
    if (!oldSize) return 0;

    return ((oldSize - newSize) / oldSize) * 100;
}

function isImageFile(filename) {
    return IMAGE_EXTS.has(
        path.extname(filename).toLowerCase()
    );
}

function getOutputFilename(filename) {
    const ext = path.extname(filename);

    const baseName = path.basename(
        filename,
        ext
    );

    return `${baseName}.webp`;
}

function getPublicUrl(filename) {
    return `${PUBLIC_URL_PREFIX}/${filename}`;
}

// ============================================================
// پیدا کردن محصولات دارای URL یک فایل
// ============================================================

async function findProductsUsingImage(publicUrl) {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            productNumber: true,
            name: true,
            images: true,
        },
    });

    return products.filter((product) => {
        if (!Array.isArray(product.images)) {
            return false;
        }

        return product.images.includes(publicUrl);
    });
}

// ============================================================
// تبدیل یک تصویر
// ============================================================

async function optimizeImage(filename) {
    const sourcePath = path.join(
        IMAGES_DIR,
        filename
    );

    const outputFilename =
        getOutputFilename(filename);

    const outputPath = path.join(
        IMAGES_DIR,
        outputFilename
    );

    const sourceStats = fs.statSync(sourcePath);

    const metadata = await sharp(sourcePath)
        .metadata();

    // ----------------------------------------------------------
    // اگر WebP است و force نداریم
    // ----------------------------------------------------------

    if (
        path.extname(filename).toLowerCase() === ".webp" &&
        !FORCE
    ) {
        return {
            skipped: true,
            reason: "already-webp",
            filename,
            outputFilename: filename,
            oldSize: sourceStats.size,
            newSize: sourceStats.size,
            oldWidth: metadata.width,
            oldHeight: metadata.height,
        };
    }

    // ----------------------------------------------------------
    // Dry Run
    // ----------------------------------------------------------

    if (DRY_RUN) {
        return {
            dryRun: true,
            filename,
            outputFilename,
            oldSize: sourceStats.size,
            oldWidth: metadata.width,
            oldHeight: metadata.height,
        };
    }

    // ----------------------------------------------------------
    // فایل موقت
    // ----------------------------------------------------------

    const tempFilename =
        `.__tmp__${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.webp`;

    const tempPath = path.join(
        IMAGES_DIR,
        tempFilename
    );

    try {
        await sharp(sourcePath)
            // چرخش بر اساس EXIF
            .rotate()

            // تبدیل transparency به سفید
            .flatten({
                background: {
                    r: 255,
                    g: 255,
                    b: 255,
                },
            })

            // حفظ نسبت تصویر
            .resize(
                OUTPUT_WIDTH,
                OUTPUT_HEIGHT,
                {
                    fit: "contain",
                    background: {
                        r: 255,
                        g: 255,
                        b: 255,
                    },
                }
            )

            // خروجی WebP
            .webp({
                quality: WEBP_QUALITY,
                effort: 5,
            })

            .toFile(tempPath);

        const outputStats = fs.statSync(tempPath);

        // --------------------------------------------------------
        // اگر خروجی همان فایل نیست
        // --------------------------------------------------------

        if (sourcePath !== outputPath) {
            // اگر فایل WebP مقصد از قبل وجود دارد
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }

            fs.renameSync(
                tempPath,
                outputPath
            );

            // حذف فایل اصلی فقط بعد از موفقیت
            fs.unlinkSync(sourcePath);
        } else {
            // force روی WebP
            fs.renameSync(
                tempPath,
                outputPath
            );
        }

        return {
            success: true,
            filename,
            outputFilename,

            oldSize: sourceStats.size,
            newSize: outputStats.size,

            oldWidth: metadata.width,
            oldHeight: metadata.height,

            reduction: compressionPercent(
                sourceStats.size,
                outputStats.size
            ),
        };
    } catch (error) {
        if (fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
            } catch { }
        }

        throw error;
    }
}

// ============================================================
// بروزرسانی URL در دیتابیس
// ============================================================

async function updateDatabaseUrls(
    oldFilename,
    newFilename
) {
    const oldUrl =
        getPublicUrl(oldFilename);

    const newUrl =
        getPublicUrl(newFilename);

    const products =
        await findProductsUsingImage(
            oldUrl
        );

    if (products.length === 0) {
        return {
            updated: 0,
            oldUrl,
            newUrl,
            products: [],
        };
    }

    if (DRY_RUN) {
        return {
            updated: products.length,
            oldUrl,
            newUrl,
            products,
        };
    }

    let updatedCount = 0;

    for (const product of products) {
        if (!Array.isArray(product.images)) {
            continue;
        }

        const newImages =
            product.images.map((url) =>
                url === oldUrl
                    ? newUrl
                    : url
            );

        await prisma.product.update({
            where: {
                id: product.id,
            },
            data: {
                images: newImages,
            },
        });

        updatedCount++;

        console.log(
            `   🗄️  DB: ${product.productNumber} — ${product.name}`
        );
    }

    return {
        updated: updatedCount,
        oldUrl,
        newUrl,
        products,
    };
}

// ============================================================
// Main
// ============================================================

async function main() {
    console.log("");
    console.log(
        "============================================================"
    );
    console.log(
        "🖼️  Product Image Optimizer + Prisma DB"
    );
    console.log(
        "============================================================"
    );
    console.log("");

    console.log(
        `📂 مسیر: ${IMAGES_DIR}`
    );

    console.log(
        `📐 اندازه: ${OUTPUT_WIDTH} × ${OUTPUT_HEIGHT}`
    );

    console.log(
        `🎨 فرمت: WebP`
    );

    console.log(
        `⭐ کیفیت: ${WEBP_QUALITY}`
    );

    console.log(
        `🔲 پس‌زمینه: سفید`
    );

    console.log("");

    if (DRY_RUN) {
        console.log(
            "🧪 DRY RUN فعال است."
        );

        console.log(
            "هیچ فایل یا دیتابیسی تغییر نمی‌کند."
        );

        console.log("");
    }

    if (FORCE) {
        console.log(
            "⚡ FORCE فعال است."
        );

        console.log(
            "WebPهای موجود نیز دوباره پردازش می‌شوند."
        );

        console.log("");
    }

    // ----------------------------------------------------------
    // بررسی پوشه
    // ----------------------------------------------------------

    if (!fs.existsSync(IMAGES_DIR)) {
        throw new Error(
            `پوشه پیدا نشد: ${IMAGES_DIR}`
        );
    }

    // ----------------------------------------------------------
    // لیست فایل‌ها
    // ----------------------------------------------------------

    const files = fs
        .readdirSync(IMAGES_DIR)
        .filter(isImageFile)
        .sort((a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                }
            )
        );

    console.log(
        `📁 تعداد تصاویر: ${files.length}`
    );

    console.log("");
    console.log(
        "------------------------------------------------------------"
    );

    // ----------------------------------------------------------
    // آمار
    // ----------------------------------------------------------

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    let databaseUpdated = 0;

    let totalOldSize = 0;
    let totalNewSize = 0;

    const errors = [];

    // ----------------------------------------------------------
    // پردازش فایل‌ها
    // ----------------------------------------------------------

    for (const filename of files) {
        try {
            const result =
                await optimizeImage(filename);

            // ------------------------------------------------------
            // WebP موجود
            // ------------------------------------------------------

            if (result.skipped) {
                skipped++;

                console.log(
                    `⏭️  ${filename} — WebP است`
                );

                continue;
            }

            // ------------------------------------------------------
            // Dry Run
            // ------------------------------------------------------

            if (result.dryRun) {
                processed++;

                totalOldSize += result.oldSize;

                console.log(
                    `🧪 ${filename}`
                );

                console.log(
                    `   ${result.oldWidth}×${result.oldHeight} → ${OUTPUT_WIDTH}×${OUTPUT_HEIGHT}`
                );

                console.log(
                    `   ${formatBytes(result.oldSize)} → ${result.outputFilename}`
                );

                const dbResult =
                    await updateDatabaseUrls(
                        filename,
                        result.outputFilename
                    );

                if (dbResult.updated > 0) {
                    console.log(
                        `   🗄️  ${dbResult.updated} محصول در DB باید اصلاح شود`
                    );
                } else {
                    console.log(
                        `   ℹ️  این فایل در DB استفاده نشده`
                    );
                }

                console.log("");

                continue;
            }

            // ------------------------------------------------------
            // پردازش موفق
            // ------------------------------------------------------

            processed++;

            totalOldSize += result.oldSize;
            totalNewSize += result.newSize;

            console.log(
                `✅ ${result.filename} → ${result.outputFilename}`
            );

            console.log(
                `   ${result.oldWidth}×${result.oldHeight} → ${OUTPUT_WIDTH}×${OUTPUT_HEIGHT}`
            );

            console.log(
                `   ${formatBytes(result.oldSize)} → ${formatBytes(result.newSize)}`
            );

            console.log(
                `   📉 کاهش: ${result.reduction.toFixed(1)}%`
            );

            // ------------------------------------------------------
            // دیتابیس
            // ------------------------------------------------------

            const dbResult =
                await updateDatabaseUrls(
                    result.filename,
                    result.outputFilename
                );

            if (dbResult.updated > 0) {
                databaseUpdated +=
                    dbResult.updated;

                console.log(
                    `   🗄️  ${dbResult.updated} محصول اصلاح شد`
                );
            } else {
                console.log(
                    `   ℹ️  این فایل در DB ثبت نشده بود`
                );
            }

            console.log("");
        } catch (error) {
            failed++;

            errors.push({
                filename,
                error: error.message,
            });

            console.error(
                `❌ ${filename}`
            );

            console.error(
                `   ${error.message}`
            );

            console.log("");
        }
    }

    // ==========================================================
    // گزارش نهایی
    // ==========================================================

    console.log("");
    console.log(
        "============================================================"
    );
    console.log(
        "📊 گزارش نهایی"
    );
    console.log(
        "============================================================"
    );

    console.log(
        `🖼️  تصاویر پردازش‌شده:       ${processed}`
    );

    console.log(
        `⏭️  تصاویر رد‌شده:            ${skipped}`
    );

    console.log(
        `❌ خطاها:                    ${failed}`
    );

    console.log(
        `🗄️  رکوردهای DB اصلاح‌شده:   ${databaseUpdated}`
    );

    if (!DRY_RUN && processed > 0) {
        console.log("");

        console.log(
            `💾 حجم قبل:                  ${formatBytes(totalOldSize)}`
        );

        console.log(
            `💾 حجم بعد:                  ${formatBytes(totalNewSize)}`
        );

        console.log(
            `📉 کاهش حجم کل:              ${compressionPercent(
                totalOldSize,
                totalNewSize
            ).toFixed(1)}%`
        );
    }

    if (errors.length > 0) {
        console.log("");

        console.log(
            "❌ جزئیات خطاها:"
        );

        errors
            .slice(0, 20)
            .forEach((item) => {
                console.log(
                    `   • ${item.filename}`
                );

                console.log(
                    `     ${item.error}`
                );
            });
    }

    console.log("");

    if (DRY_RUN) {
        console.log(
            "🧪 DRY RUN تمام شد."
        );

        console.log(
            "هیچ فایلی یا رکورد دیتابیسی تغییر نکرد."
        );

        console.log("");

        console.log(
            "برای اجرای واقعی:"
        );

        console.log(
            "node scripts/optimize-product-images-and-db.js"
        );
    } else {
        console.log(
            "🎉 عملیات با موفقیت تمام شد."
        );
    }

    console.log(
        "============================================================"
    );

    console.log("");
}

// ============================================================
// اجرا
// ============================================================

main()
    .catch((error) => {
        console.error("");
        console.error(
            "❌ خطای کلی:"
        );

        console.error(error);

        console.error("");

        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

