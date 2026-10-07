import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { recomputeProductRating } from "@/lib/reviewService";

// ============================================================
// GET: لیست نظرات + آمار (میانگین، تعداد، توزیع ستاره‌ها)
// ============================================================
export async function GET(request, { params }) {
  try {
    const { id: productId } = await params;

    const [reviews, stats] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId, isVisible: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              companyName: true,
              image: true,
              logo: true,
              country: true,
              countryCode: true,
            },
          },
        },
      }),
      prisma.productReview.groupBy({
        by: ["rating"],
        where: { productId, isVisible: true },
        _count: true,
      }),
    ]);

    const total = stats.reduce((sum, s) => sum + s._count, 0);
    const sum = stats.reduce((acc, s) => acc + s.rating * s._count, 0);
    const average = total > 0 ? sum / total : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach((s) => {
      distribution[s.rating] = s._count;
    });

    return NextResponse.json({
      reviews,
      stats: {
        average: Number(average.toFixed(2)),
        total,
        distribution,
      },
    });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: ساخت یا ویرایش نظر (upsert)
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { message: "Login required", reason: "login_required" },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { rating, title, comment } = body;

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // اطمینان از وجود محصول
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, userId: true },
    });
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // صاحب محصول نمی‌تواند به خودش امتیاز بدهد
    if (product.userId === session.user.id) {
      return NextResponse.json(
        { message: "You cannot review your own product" },
        { status: 403 }
      );
    }

    const cleanTitle = (title || "").trim().slice(0, 120) || null;
    const cleanComment = (comment || "").trim().slice(0, 2000) || null;

    const review = await prisma.productReview.upsert({
      where: {
        productId_userId: {
          productId,
          userId: session.user.id,
        },
      },
      update: {
        rating: numRating,
        title: cleanTitle,
        comment: cleanComment,
      },
      create: {
        productId,
        userId: session.user.id,
        rating: numRating,
        title: cleanTitle,
        comment: cleanComment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            image: true,
            logo: true,
            country: true,
            countryCode: true,
          },
        },
      },
    });
    await recomputeProductRating(productId);
    return NextResponse.json({ review, message: "Review saved" });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json(
      { message: "Failed to save review" },
      { status: 500 }
    );
  }
}