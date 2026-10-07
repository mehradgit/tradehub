import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { recomputeProductRating } from "@/lib/reviewService";

// DELETE: حذف نظر خود کاربر
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await params;

    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      select: { userId: true, productId: true },   
    });
    await recomputeProductRating(review.productId);
    if (!review) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (review.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.productReview.delete({ where: { id: reviewId } });

    return NextResponse.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Review DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to delete review" },
      { status: 500 }
    );
  }
}