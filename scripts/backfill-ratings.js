require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true },
  });

  console.log(`Backfilling ${products.length} products…`);
  let updated = 0;

  for (const { id } of products) {
    const stats = await prisma.productReview.aggregate({
      where: { productId: id, isVisible: true },
      _avg: { rating: true },
      _count: true,
    });

    const ratingAverage = Number((stats._avg.rating || 0).toFixed(2));
    const ratingCount = stats._count || 0;

    await prisma.product.update({
      where: { id },
      data: { ratingAverage, ratingCount },
    });

    updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${products.length}`);
  }

  console.log(`✅ Done. Updated ${updated} products.`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());