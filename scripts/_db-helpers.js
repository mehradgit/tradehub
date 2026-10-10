/**
 * Helper کوچک برای تعامل اسکریپت پایتون با Prisma
 *
 * استفاده:
 *   node scripts/_db-helpers.js list      → لیست محصولات بدون تصویر (JSON روی stdout)
 *   node scripts/_db-helpers.js update    → آپدیت تصاویر (JSON روی stdin)
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function isImagesEmpty(images) {
  if (images == null) return true;
  if (Array.isArray(images)) return images.length === 0;
  if (typeof images === 'string') {
    const trimmed = images.trim();
    return trimmed === '' || trimmed === '[]';
  }
  return false;
}

async function listProducts() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      productNumber: true,
      name: true,
      images: true,
    },
    orderBy: { productNumber: 'asc' },
  });

  const pending = products
    .filter((p) => isImagesEmpty(p.images))
    .map((p) => ({
      id: p.id,
      productNumber:
        p.productNumber != null ? String(p.productNumber) : null,
      name: p.name,
    }));

  process.stdout.write(JSON.stringify(pending));
}

async function updateProducts() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    process.stdout.write(JSON.stringify({ updated: 0 }));
    return;
  }

  const updates = JSON.parse(raw);
  let updated = 0;

  for (const item of updates) {
    if (!item || !item.id || !Array.isArray(item.images)) continue;
    await prisma.product.update({
      where: { id: item.id },
      data: { images: item.images },
    });
    updated++;
  }

  process.stdout.write(JSON.stringify({ updated }));
}

const command = process.argv[2];

const runners = {
  list: listProducts,
  update: updateProducts,
};

const runner = runners[command];

if (!runner) {
  console.error('Usage: node scripts/_db-helpers.js <list|update>');
  process.exit(1);
}

runner()
  .catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });