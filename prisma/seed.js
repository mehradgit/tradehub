// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'Basic',
      maxProducts: 5,
      maxImagesPerProduct: 3,
      maxRequestsPerMonth: 5,
      maxImagesPerRequest: 2,
      maxProfileImages: 3,
      maxInquiriesPerMonth: 5,
      maxQuotesPerMonth: 2,
      prices: [
        { duration: 180, price: 0 },
        { duration: 360, price: 0 },
      ],
    },
    {
      name: 'Bronze',
      maxProducts: 20,
      maxImagesPerProduct: 5,
      maxRequestsPerMonth: 15,
      maxImagesPerRequest: 3,
      maxProfileImages: 5,
      maxInquiriesPerMonth: 10,
      maxQuotesPerMonth: 5,
      prices: [
        { duration: 180, price: 19 },
        { duration: 360, price: 29 },
      ],
    },
    {
      name: 'Silver',
      maxProducts: 50,
      maxImagesPerProduct: 7,
      maxRequestsPerMonth: 30,
      maxImagesPerRequest: 4,
      maxProfileImages: 8,
      maxInquiriesPerMonth: 20,
      maxQuotesPerMonth: 10,
      prices: [
        { duration: 180, price: 39 },
        { duration: 360, price: 69 },
      ],
    },
    {
      name: 'Gold',
      maxProducts: -1,
      maxImagesPerProduct: 10,
      maxRequestsPerMonth: -1,
      maxImagesPerRequest: 5,
      maxProfileImages: -1,
      maxInquiriesPerMonth: -1,
      maxQuotesPerMonth: -1,
      prices: [
        { duration: 180, price: 79 },
        { duration: 360, price: 139 },
      ],
    },
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { name: planData.name },
      update: {
        maxProducts: planData.maxProducts,
        maxImagesPerProduct: planData.maxImagesPerProduct,
        maxRequestsPerMonth: planData.maxRequestsPerMonth,
        maxImagesPerRequest: planData.maxImagesPerRequest,
        maxProfileImages: planData.maxProfileImages,
        maxInquiriesPerMonth: planData.maxInquiriesPerMonth,
        maxQuotesPerMonth: planData.maxQuotesPerMonth,
      },
      create: {
        name: planData.name,
        maxProducts: planData.maxProducts,
        maxImagesPerProduct: planData.maxImagesPerProduct,
        maxRequestsPerMonth: planData.maxRequestsPerMonth,
        maxImagesPerRequest: planData.maxImagesPerRequest,
        maxProfileImages: planData.maxProfileImages,
        maxInquiriesPerMonth: planData.maxInquiriesPerMonth,
        maxQuotesPerMonth: planData.maxQuotesPerMonth,
        prices: {
          create: planData.prices,
        },
      },
    });
  }

  console.log('✅ Plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });