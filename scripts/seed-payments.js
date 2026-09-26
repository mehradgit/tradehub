// scripts/seed-payments.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function generateInvoiceNumber(year) {
  const last = await prisma.payment.findFirst({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  let next = 1;
  if (last) {
    next = parseInt(last.invoiceNumber.split("-")[2]) + 1;
  }
  return `INV-${year}-${String(next).padStart(5, "0")}`;
}

function generateRef() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${t}-${r}`;
}

async function main() {
  console.log("🌱 Seeding payments & coupons...");

  // ====== پیدا کردن کاربران ======
  const users = await prisma.user.findMany({
    where: { registrationComplete: true },
    take: 20,
    select: { id: true, email: true, plan: true },
  });

  if (users.length === 0) {
    console.log("❌ No users found. Create users first.");
    return;
  }

  const plans = await prisma.plan.findMany({
    include: { prices: true },
  });

  if (plans.length === 0) {
    console.log("❌ No plans found. Run seed first.");
    return;
  }

  // ====== ساخت کدهای تخفیف نمونه ======
  const coupons = [
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      maxUses: 100,
      description: "10% off for new users",
    },
    {
      code: "SAVE20",
      type: "fixed",
      value: 20,
      maxUses: 50,
      minAmount: 50,
      description: "$20 off on orders above $50",
    },
    {
      code: "NEWYEAR25",
      type: "percentage",
      value: 25,
      maxDiscount: 50,
      maxUses: null,
      description: "25% off, max $50 discount",
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        type: c.type,
        value: c.value,
        maxUses: c.maxUses,
        minAmount: c.minAmount || null,
        maxDiscount: c.maxDiscount || null,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${coupons.length} coupons seeded`);

  // ====== ساخت ۵۰ پرداخت نمونه ======
  const statuses = ["paid", "paid", "paid", "paid", "pending", "failed"];
  const year = new Date().getFullYear();
  let count = 0;

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const price = plan.prices[Math.floor(Math.random() * plan.prices.length)];

    if (!price) continue;

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Number(price.price);
    const invoiceNumber = await generateInvoiceNumber(year);
    const daysAgo = Math.floor(Math.random() * 180);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.payment.create({
      data: {
        invoiceNumber,
        referenceNumber: generateRef(),
        userId: user.id,
        planId: plan.id,
        duration: price.duration,
        originalAmount: amount,
        amount: amount,
        discountAmount: 0,
        currency: "USD",
        status,
        method: "simulated",
        description: `${plan.name} Plan · ${price.duration} days`,
        paidAt: status === "paid" ? createdAt : null,
        createdAt,
      },
    });
    count++;
  }

  console.log(`✅ ${count} sample payments created`);

  // ====== خلاصه ======
  const totalRevenue = await prisma.payment.aggregate({
    where: { status: "paid" },
    _sum: { amount: true },
  });
  console.log(`💰 Total revenue: $${totalRevenue._sum.amount || 0}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());