// src/app/api/admin/maintenance/rebuild-indexes/route.js
// ============================================================
// Rebuild the search indexes for existing rows
//
//   categoryPath  → three-level category slug path
//                   ("grains-cereals/rice/basmati")
//   searchText    → concatenated search text (name + description +
//                   category + attributes) for the FULLTEXT index
//
// This endpoint is idempotent: running it again produces the same
// result. After changing categories or adding new attributes,
// run it once.
//
// Input (optional, JSON):
//   { only: "both" | "categoryPath" | "searchText" }   default both
//
// Output:
//   { message, products: {total, updated, failed},
//     requests: {total, updated, failed}, durationMs }
//
// Performance note: writing row by row is intentional — we do not
// want one broken row to stop the whole run. That is why each row
// gets its own update inside a try/catch.
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

// Size of each batch — so memory and the event loop stay free
const BATCH_SIZE = 200;

// ============================================================
// Parse the input
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
// POST — run the rebuild
// ============================================================
export async function POST(request) {
  const startedAt = Date.now();

  try {
    // ====== Admin access ======
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ====== Input (the body is optional) ======
    let body = null;
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body → use defaults
      body = null;
    }

    const only = parseOnly(body);
    const rebuildCategoryPath = only === "both" || only === "categoryPath";
    const rebuildSearchText = only === "both" || only === "searchText";

    // ====== The category tree is read only once ======
    const tree = buildCategoryTree(await getCategories());

    const products = { total: 0, updated: 0, failed: 0 };
    const requests = { total: 0, updated: 0, failed: 0 };

    // ============================================================
    // Products
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

        // Only inside try/catch so one broken row does not kill the batch
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
              // Attributes are not critical; the other fields are still rebuilt
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
    // Buying requests
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
            // Buying requests have no EAV attributes in the schema, so an
            // empty array is passed. If that ever changes, only this line
            // needs updating.
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
    // Result
    // ============================================================
    return NextResponse.json({
      message: `Rebuild finished (only: ${only}).`,
      products,
      requests,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    // Internal details are not leaked in the response
    console.error("Rebuild indexes error:", error);
    return NextResponse.json(
      { message: "Rebuild failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
