// src/app/api/products/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; // ✅ Bug fix: it was not imported before and POST threw after the insert
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { generateNumber, generateSlug } from "@/utils/generate";
import { canAddProduct, getUserActivePlan } from "@/lib/planService";
// ====== Three-level category + search text + dynamic attributes ======
import { buildCategoryTree, resolveCategoryPath } from "@/lib/categoryTree";
import { getCategories } from "@/lib/categoriesService";
import {
  buildProductSearchText,
  flattenAttributeValues,
} from "@/lib/searchText";
import {
  setProductAttributes,
  getProductAttributes,
} from "@/lib/attributesService";

// ====== Base64 image saving helper ======
function getUploadDir(folder) {
  const base = process.cwd();
  const segments = ["public", "uploads", folder].filter(Boolean);
  return [base, ...segments].join(path.sep);
}
async function saveBase64Image(base64String, folder = "products") {
  if (!base64String) return null;

  const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) return null;

  const ext = matches[1] || "jpg";
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = getUploadDir(folder);
  const filePath = [uploadDir, filename].join(path.sep);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  return `/uploads/${folder}/${filename}`;
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { plan, subscription } = await getUserActivePlan(session.user.id);

    if (!(await canAddProduct(session.user.id, plan))) {
      return NextResponse.json(
        {
          message:
            "You have reached the maximum product limit for your plan. Please upgrade.",
        },
        { status: 403 },
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      name,
      category,
      subCategory,
      productType,
      shortDesc,
      fullDesc,
      price,
      currency,
      unit,
      moq,
      stock,
      leadTime,
      images = [],
      badge,
      countryCode,
      origin,
      certifications,
      packaging,
      shippingTerms,
      paymentTerms,
      isVisible,
      // Note: specs no longer exists — specifications are stored as attributes (EAV)
      // via `attributes`. specs used to be destructured here
      // but was never saved (and had no column in the schema).
      attributes,
    } = body;

    if (
      images.length > plan.maxImagesPerProduct &&
      plan.maxImagesPerProduct !== -1
    ) {
      return NextResponse.json(
        {
          message: `You can upload a maximum of ${plan.maxImagesPerProduct} images per product.`,
        },
        { status: 403 },
      );
    }

    const productNumber = generateNumber();
    const slug = generateSlug(name);

    if (!name || !category || !shortDesc || !price || !moq) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // ====== Incoming attributes ======
    // Only rows with a string attributeId are kept;
    // validation and type conversion (number/boolean/multi-select) happen inside
    // setProductAttributes and are not repeated here.
    const attributeItems = Array.isArray(attributes)
      ? attributes.filter((a) => a && typeof a.attributeId === "string")
      : [];

    const imagePaths = [];
    for (const img of images) {
      if (img.startsWith("data:image")) {
        const savedPath = await saveBase64Image(img);
        if (savedPath) {
          imagePaths.push(savedPath);
        }
      } else {
        imagePaths.push(img);
      }
    }

    // ====== Three-level category path ======
    // Computed before create so it is written together with the other
    // fields in the same INSERT: "grains-cereals/rice/basmati"
    const tree = buildCategoryTree(await getCategories());
    const categoryPath = resolveCategoryPath(
      { category, subCategory, productType },
      tree,
    );

    // ====== Fields that get written ======
    // The same object builds searchText so the search text
    // is built from exactly the stored values.
    const productData = {
      name,
      category,
      subCategory: subCategory || null,
      productType: productType || null,
      categoryPath,
      shortDesc,
      fullDesc: fullDesc || null,
      price: parseFloat(price),
      currency: currency || "USD",
      unit: unit || "kg",
      moq: parseInt(moq),
      stock: stock ? parseInt(stock) : null,
      leadTime: leadTime ? parseInt(leadTime) : null,
      images: imagePaths,
      badge: badge || null,
      country: origin || null,
      countryCode: countryCode || null,
      origin: origin || null,
      certifications: certifications || null,
      packaging: packaging || null,
      shippingTerms: shippingTerms || null,
      paymentTerms: paymentTerms || null,
    };

    const product = await prisma.product.create({
      data: {
        ...productData,
        // Combined search text (attributes are added in the next step)
        searchText: buildProductSearchText({
          product: productData,
          attributeValues: [],
        }),
        isVisible: false,
        status: "PENDING",
        userId,
        productNumber,
        slug,
      },
    });

    // ====== Save the attributes (EAV) ======
    // Only when the array is non-empty. An attribute error must not
    // break product creation, so it is wrapped in try/catch.
    let attributesSaved = false;
    if (attributeItems.length > 0) {
      try {
        await setProductAttributes(product.id, attributeItems);
        attributesSaved = true;
      } catch (attrError) {
        console.error("Error saving product attributes:", attrError);
      }
    }

    // ====== Align searchText with the attribute values ======
    // nice-to-have: the stored values are read back (because
    // setProductAttributes converts the data type) and searchText
    // is written once more. A failure here does not invalidate the product.
    if (attributesSaved) {
      try {
        const savedAttributes = await getProductAttributes(product.id);
        await prisma.product.update({
          where: { id: product.id },
          data: {
            searchText: buildProductSearchText({
              product: productData,
              attributeValues: flattenAttributeValues(savedAttributes),
            }),
          },
        });
      } catch (attrError) {
        console.error("Error rebuilding searchText with attributes:", attrError);
      }
    }

    // ✅ Invalidate caches
    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json(
      {
        message: "Product created successfully",
        id: product.id,
        productNumber: product.productNumber,
        slug: product.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Failed to create product", error: error.message },
      { status: 500 },
    );
  }
}

// ====== DELETE: delete a product ======
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    if (product.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 },
    );
  }
}

// ====== PATCH: partial update (visibility) ======
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { isVisible } = body;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    if (product.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isVisible },
    });

    return NextResponse.json(
      { message: "Product updated successfully", product: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 },
    );
  }
}
