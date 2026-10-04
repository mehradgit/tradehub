// src/app/api/admin/maintenance/rebuild-indexes/route.js
// ============================================================
// بازسازی ایندکس‌های جست‌وجو برای ردیف‌های موجود
//
//   categoryPath  → مسیر slug سه‌سطحی دسته‌بندی
//                   ("grains-cereals/rice/basmati")
//   searchText    → متن یکجای جست‌وجو (نام + توضیح + دسته +
//                   اتریبیوت‌ها) برای ایندکس FULLTEXT
//
// این اندپوینت idempotent است: هر بار اجرا شود همان نتیجه را
// می‌سازد. بعد از تغییر دسته‌بندی‌ها یا اضافه‌شدن اتریبیوت‌های
// جدید، یک‌بار اجرا کنید.
//
// ورودی (اختیاری، JSON):
//   { only: "both" | "categoryPath" | "searchText" }   پیش‌فرض both
//
// خروجی:
//   { message, products: {total, updated, failed},
//     requests: {total, updated, failed}, durationMs }
//
// نکته‌ی کارایی: نوشتن ردیف‌به‌ردیف عمداً است — می‌خواهیم یک
// ردیف خراب کل اجرا را متوقف نکند. به همین دلیل برای هر ردیف
// update جداگانه با try/catch زده می‌شود.
// ============================================================
export const maxDuration = 300;

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { buildCategoryTree, resolveCategoryPath } from "@/lib/categoryTree";
import { getCategories } from "@/lib/categoriesService";
import { getProductAttributes } from "@/lib/attributesService";
import {
  buildProductSearchText,
  buildRequestSearchText,
  flattenAttributeValues,
} from "@/lib/searchText";

// اندازه‌ی هر batch — برای اینکه حافظه و event loop آزاد بماند
const BATCH_SIZE = 200;

// ============================================================
// پارس کردن ورودی
// ============================================================
function parseOnly(rawBody) {
  const raw = rawBody && typeof rawBody === "object" ? rawBody.only : undefined;
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value === "categoryPath" || value === "searchText" || value === "both") {
    return value;
  }

  return "both";
}

// ============================================================
// POST — اجرای بازسازی
// ============================================================
export async function POST(request) {
  const startedAt = Date.now();

  try {
    // ====== دسترسی ادمین ======
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ====== ورودی (بدنه اختیاری است) ======
    let body = null;
    try {
      body = await request.json();
    } catch {
      // بدنه‌ی خالی یا نامعتبر → پیش‌فرض
      body = null;
    }

    const only = parseOnly(body);
    const rebuildCategoryPath = only === "both" || only === "categoryPath";
    const rebuildSearchText = only === "both" || only === "searchText";

    // ====== درخت دسته‌بندی فقط یک‌بار خوانده می‌شود ======
    const tree = buildCategoryTree(await getCategories());

    const products = { total: 0, updated: 0, failed: 0 };
    const requests = { total: 0, updated: 0, failed: 0 };

    // ============================================================
    // محصولات
    // ============================================================
    let productSkip = 0;

    while (true) {
      let batch;
      try {
        batch = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            shortDesc: true,
            fullDesc: true,
            category: true,
            subCategory: true,
            productType: true,
            origin: true,
            country: true,
            certifications: true,
            packaging: true,
            shippingTerms: true,
            paymentTerms: true,
            unit: true,
            badge: true,
          },
          orderBy: { id: "asc" },
          skip: productSkip,
          take: BATCH_SIZE,
        });
      } catch (err) {
        console.error("[rebuild-indexes] product batch read failed:", err);
        break;
      }

      if (!batch || batch.length === 0) break;

      for (const product of batch) {
        products.total += 1;

        // فقط داخل try/catch تا یک ردیف خراب کل batch را نکشد
        try {
          const data = {};

          if (rebuildCategoryPath) {
            data.categoryPath = resolveCategoryPath(
              {
                category: product.category,
                subCategory: product.subCategory,
                productType: product.productType,
              },
              tree
            );
          }

          if (rebuildSearchText) {
            let attributes = [];
            try {
              attributes = await getProductAttributes(product.id);
            } catch (attrErr) {
              // اتریبیوت‌ها حیاتی نیستند؛ بقیه‌ی فیلدها بازسازی می‌شوند
              console.error(
                `[rebuild-indexes] product attributes failed (${product.id}):`,
                attrErr?.message || attrErr
              );
              attributes = [];
            }

            data.searchText = buildProductSearchText({
              product,
              attributeValues: flattenAttributeValues(attributes),
            });
          }

          if (Object.keys(data).length === 0) continue;

          await prisma.product.update({ where: { id: product.id }, data });
          products.updated += 1;
        } catch (rowErr) {
          products.failed += 1;
          console.error(
            `[rebuild-indexes] product update failed (${product.id}):`,
            rowErr?.message || rowErr
          );
        }
      }

      productSkip += batch.length;
    }

    // ============================================================
    // درخواست‌های خرید
    // ============================================================
    let requestSkip = 0;

    while (true) {
      let batch;
      try {
        batch = await prisma.buyingRequest.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            subCategory: true,
            productType: true,
            deliveryCountry: true,
            buyerCountry: true,
            certifications: true,
            packagingReq: true,
            shippingTerms: true,
            paymentTerms: true,
            budgetRange: true,
            unit: true,
          },
          orderBy: { id: "asc" },
          skip: requestSkip,
          take: BATCH_SIZE,
        });
      } catch (err) {
        console.error("[rebuild-indexes] request batch read failed:", err);
        break;
      }

      if (!batch || batch.length === 0) break;

      for (const req of batch) {
        requests.total += 1;

        try {
          const data = {};

          if (rebuildCategoryPath) {
            data.categoryPath = resolveCategoryPath(
              {
                category: req.category,
                subCategory: req.subCategory,
                productType: req.productType,
              },
              tree
            );
          }

          if (rebuildSearchText) {
            // درخواست خرید در اسکیما اتریبیوت EAV ندارد، پس آرایه‌ی
            // خالی داده می‌شود. اگر روزی اضافه شد، فقط این خط عوض شود.
            data.searchText = buildRequestSearchText({
              request: req,
              attributeValues: [],
            });
          }

          if (Object.keys(data).length === 0) continue;

          await prisma.buyingRequest.update({ where: { id: req.id }, data });
          requests.updated += 1;
        } catch (rowErr) {
          requests.failed += 1;
          console.error(
            `[rebuild-indexes] request update failed (${req.id}):`,
            rowErr?.message || rowErr
          );
        }
      }

      requestSkip += batch.length;
    }

    // ============================================================
    // نتیجه
    // ============================================================
    return NextResponse.json({
      message: `Rebuild finished (only: ${only}).`,
      products,
      requests,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    // پیام داخلی در پاسخ لو نمی‌رود
    console.error("Rebuild indexes error:", error);
    return NextResponse.json(
      { message: "Rebuild failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
