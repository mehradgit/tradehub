// src/app/api/products/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; // ✅ رفع باگ: قبلاً import نشده بود و POST بعد از insert خطا می‌داد
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { generateNumber, generateSlug } from "@/utils/generate";
import { canAddProduct, getUserActivePlan } from "@/lib/planService";
// ====== دسته‌بندی سه‌سطحی + متن جست‌وجو + اتریبیوت‌های پویا ======
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

// ====== تابع ذخیره تصویر Base64 ======
async function saveBase64Image(base64String, folder = "products") {
  if (!base64String) return null;

  const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) return null;

  const ext = matches[1] || "jpg";
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  const filePath = path.join(uploadDir, filename);

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
      // توجه: دیگر specs وجود ندارد — مشخصات به‌صورت اتریبیوت (EAV)
      // با attributes ذخیره می‌شوند. specs قبلاً اینجا destructure
      // می‌شد ولی هرگز ذخیره نمی‌شد (ستونی هم در شِما نداشت).
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

    // ====== اتریبیوت‌های ورودی ======
    // فقط ردیف‌هایی که attributeId رشته‌ای دارند نگه داشته می‌شوند؛
    // اعتبارسنجی و تبدیل نوع (عدد/بولین/چندانتخابی) داخل
    // setProductAttributes انجام می‌شود و اینجا تکرار نمی‌شود.
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

    // ====== مسیر سه‌سطحی دسته‌بندی ======
    // قبل از create محاسبه می‌شود تا همراه بقیه‌ی فیلدها در همان
    // یک INSERT نوشته شود: "grains-cereals/rice/basmati"
    const tree = buildCategoryTree(await getCategories());
    const categoryPath = resolveCategoryPath(
      { category, subCategory, productType },
      tree,
    );

    // ====== فیلدهایی که نوشته می‌شوند ======
    // همان آبجکت برای ساخت searchText استفاده می‌شود تا متن جست‌وجو
    // دقیقاً از مقادیر ذخیره‌شده ساخته شود.
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
        // متن یکجای جست‌وجو (اتریبیوت‌ها در گام بعد اضافه می‌شوند)
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

    // ====== ذخیره‌ی اتریبیوت‌ها (EAV) ======
    // فقط وقتی آرایه غیرخالی است. خطای اتریبیوت نباید ساخت محصول را
    // شکست دهد، پس داخل try/catch است.
    let attributesSaved = false;
    if (attributeItems.length > 0) {
      try {
        await setProductAttributes(product.id, attributeItems);
        attributesSaved = true;
      } catch (attrError) {
        console.error("Error saving product attributes:", attrError);
      }
    }

    // ====== همسان‌کردن searchText با مقادیر اتریبیوت‌ها ======
    // nice-to-have: مقادیر ذخیره‌شده دوباره خوانده می‌شوند (چون
    // setProductAttributes نوع داده را تبدیل می‌کند) و searchText
    // یک‌بار دیگر نوشته می‌شود. شکست این مرحله محصول را باطل نمی‌کند.
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

// ====== DELETE: حذف محصول ======
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

// ====== PATCH: به‌روزرسانی جزئی (visibility) ======
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
