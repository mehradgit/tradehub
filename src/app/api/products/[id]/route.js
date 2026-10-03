// src/app/api/products/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserActivePlan } from "@/lib/planService";
import { revalidatePath } from "next/cache"; // ✅ جدید

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

    return NextResponse.json(product);
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
      origin,
      isVisible,
      images,
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
      select: { userId: true, productNumber: true, slug: true },
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

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        subCategory: subCategory || null,
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
        origin: origin || null,
        images: images || [],
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