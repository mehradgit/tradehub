// src/app/api/user/saved-products/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: دریافت وضعیت ذخیره‌سازی یا لیست محصولات ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (productId) {
      const saved = await prisma.savedProduct.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: productId,
          },
        },
      });

      return NextResponse.json({ isSaved: !!saved });
    }

    const savedProducts = await prisma.savedProduct.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ savedProducts });
  } catch (error) {
    console.error("Error fetching saved products:", error);
    return NextResponse.json(
      { message: "Failed to fetch saved products" },
      { status: 500 }
    );
  }
}

// ====== POST: Toggle ذخیره/حذف محصول (بدون خطای تکراری) ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    // بررسی وجود محصول
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // بررسی وجود رکورد ذخیره‌شده
    const existing = await prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    });

    let action;
    let message;

    if (existing) {
      // ✅ اگر قبلاً ذخیره شده، حذف کن (unsave)
      await prisma.savedProduct.delete({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: productId,
          },
        },
      });
      action = "unsaved";
      message = "Product removed from saved";
    } else {
      // ✅ اگر ذخیره نشده، ایجاد کن (save)
      await prisma.savedProduct.create({
        data: {
          userId: session.user.id,
          productId: productId,
        },
      });
      action = "saved";
      message = "Product saved successfully";
    }

    return NextResponse.json(
      {
        message,
        action,
        isSaved: action === "saved",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error managing saved product:", error);
    return NextResponse.json(
      { message: "Failed to manage saved product" },
      { status: 500 }
    );
  }
}