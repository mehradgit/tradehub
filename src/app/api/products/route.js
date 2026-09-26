// src/app/api/products/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { generateNumber, generateSlug } from "@/utils/generate";
import { canAddProduct, getUserActivePlan } from "@/lib/planService";

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

    // ✅ دریافت پلن و اشتراک فعال
    const { plan, subscription } = await getUserActivePlan(session.user.id);

    // بررسی محدودیت تعداد محصولات
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
      isVisible,
      specs,
    } = body;

    // بررسی محدودیت تعداد تصاویر برای این محصول
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

    // اعتبارسنجی اولیه
    if (!name || !category || !shortDesc || !price || !moq) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // ====== پردازش تصاویر ======
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

    // ایجاد محصول
    const product = await prisma.product.create({
      data: {
        name,
        category,
        subCategory: subCategory || null,
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
        isVisible: isVisible !== undefined ? isVisible : true,
        isVisible: false, // ✅ تا تأیید نشود، در سایت نمایش داده نمی‌شود
        status: "PENDING", // ✅ در انتظار تأیید
        userId,
        productNumber,
        slug,
      },
    });

    // ✅ برای محصولات، سهمیه ماهانه افزایش نمی‌یابد
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
