// src/app/api/products/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserActivePlan } from "@/lib/planService";
import { revalidatePath } from "next/cache"; // ✅ جدید
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

// ===== GET =====
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            country: true,
            countryCode: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    // ====== اتریبیوت‌های محصول ======
    // نبود جدول اتریبیوت یا هر خطای دیگر نباید GET را بشکند.
    let attributes = [];
    try {
      attributes = await getProductAttributes(id);
    } catch (attrError) {
      console.error("Error fetching product attributes:", attrError);
      attributes = [];
    }

    return NextResponse.json({ ...product, attributes });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { message: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// ===== PUT: ویرایش کامل =====
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
      shippingTerms,
      packaging,
      certifications,
      paymentTerms,
      origin,
      isVisible,
      images,
      attributes,
    } = body;

    const { plan } = await getUserActivePlan(userId);

    if (
      images &&
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        userId: true,
        productNumber: true,
        slug: true,
        // برای fallback در محاسبه‌ی categoryPath و searchText
        category: true,
        subCategory: true,
        productType: true,
        categoryPath: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    if (existingProduct.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // ====== دسته‌بندی: مقادیر مؤثر ======
    // هر سطحی که در body نیامده باشد، از ردیف موجود استفاده می‌شود
    // تا categoryPath با دسته‌ی واقعاً ذخیره‌شده هم‌خوان بماند.
    const hasCategoryFields =
      category !== undefined ||
      subCategory !== undefined ||
      productType !== undefined;

    const effectiveCategory = category ?? existingProduct.category;
    const effectiveSubCategory = subCategory ?? existingProduct.subCategory;
    const effectiveProductType = productType ?? existingProduct.productType;

    // اگر دسته‌بندی تغییر نکرده، همان مسیر قبلی حفظ می‌شود؛
    // در غیر این صورت از درخت فعلی دسته‌بندی‌ها دوباره حل می‌شود.
    let categoryPath = existingProduct.categoryPath;
    if (hasCategoryFields) {
      const tree = buildCategoryTree(await getCategories());
      categoryPath = resolveCategoryPath(
        {
          category: effectiveCategory,
          subCategory: effectiveSubCategory,
          productType: effectiveProductType,
        },
        tree,
      );
    }

    // ====== ذخیره‌ی اتریبیوت‌ها (EAV) ======
    // اگر attributes در body باشد (حتی آرایه‌ی خالی = پاک‌کردن همه)
    // setProductAttributes صدا زده می‌شود. خطای اتریبیوت هرگز نباید
    // به‌روزرسانی محصول را بشکند.
    if (Array.isArray(attributes)) {
      // فقط ردیف‌های دارای attributeId رشته‌ای؛ اعتبارسنجی و تبدیل
      // نوع داخل setProductAttributes انجام می‌شود.
      const attributeItems = attributes.filter(
        (a) => a && typeof a.attributeId === "string",
      );
      try {
        await setProductAttributes(id, attributeItems);
      } catch (attrError) {
        console.error("Error saving product attributes:", attrError);
      }
    }

    // ====== اتریبیوت‌های فعلی (برای searchText) ======
    // اگر همین حالا ذخیره شده‌اند، مقادیر نرمال‌شده‌ی آن‌ها خوانده
    // می‌شود؛ در غیر این صورت مقادیر قبلی محصول.
    let currentAttributes = [];
    try {
      currentAttributes = await getProductAttributes(id);
    } catch (attrError) {
      console.error("Error reading product attributes:", attrError);
      currentAttributes = [];
    }

    // ====== فیلدهایی که نوشته می‌شوند ======
    const productData = {
      name,
      category: effectiveCategory,
      subCategory: effectiveSubCategory || null,
      productType: effectiveProductType || null,
      categoryPath,
      shortDesc,
      fullDesc: fullDesc || null,
      price: parseFloat(price),
      currency,
      unit,
      moq: parseInt(moq),
      stock: stock ? parseInt(stock) : null,
      leadTime: leadTime ? parseInt(leadTime) : null,
      shippingTerms: shippingTerms || null,
      packaging: packaging || null,
      certifications: certifications || null,
      paymentTerms: paymentTerms || null,
      origin: origin || null,
      images: images || [],
    };

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        // متن یکجای جست‌وجو از مقادیر جدید + اتریبیوت‌های فعلی
        searchText: buildProductSearchText({
          product: productData,
          attributeValues: flattenAttributeValues(currentAttributes),
        }),
        status: "PENDING",
        isVisible: false,
      },
    });

    // ✅ Invalidate caches
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(
      `/products/${existingProduct.productNumber}/${existingProduct.slug}`,
    );

    return NextResponse.json(
      { message: "Product updated successfully", product: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "Failed to update product", error: error.message },
      { status: 500 },
    );
  }
}

// ===== PATCH: visibility toggle =====
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
      select: { userId: true, productNumber: true, slug: true },
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

    // ✅ Invalidate caches
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.productNumber}/${product.slug}`);

    return NextResponse.json(
      { message: "Product updated successfully", product: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating product visibility:", error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 },
    );
  }
}

// ===== DELETE =====
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
      select: { userId: true, productNumber: true, slug: true },
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

    // ✅ Invalidate caches — این خط حیاتی است
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.productNumber}/${product.slug}`);

    // اگر این محصول در homepage section از نوع manual بوده،
    // بهتر است itemIds هم پاک شود (اختیاری — بخش پایین توضیح داده شده)

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