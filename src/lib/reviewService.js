import { prisma } from "@/lib/prisma";

// ============================================================
// بازمحاسبه میانگین rating و ذخیره در Product
// بعد از هر create/update/delete روی ProductReview صدا زده می‌شود
// ============================================================
export async function recomputeProductRating(productId) {
  const stats = await prisma.productReview.aggregate({
    where: { productId, isVisible: true },
    _avg: { rating: true },
    _count: true,
  });

  const ratingAverage = Number((stats._avg.rating || 0).toFixed(2));
  const ratingCount = stats._count || 0;

  await prisma.product.update({
    where: { id: productId },
    data: { ratingAverage, ratingCount },
  });

  return { ratingAverage, ratingCount };
}