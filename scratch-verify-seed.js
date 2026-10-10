// scratch: verify seeded data
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  try {
    const users = await p.user.findMany({
      where: { email: { endsWith: "foodtradelink.example" } },
      select: {
        profileNumber: true,
        companyName: true,
        country: true,
        city: true,
        role: true,
      },
      orderBy: { profileNumber: "asc" },
    });
    console.log("=== SUPPLIERS ===");
    for (const u of users) {
      console.log(
        `#${u.profileNumber} | ${u.companyName} | ${u.city}, ${u.country} | ${u.role}`
      );
    }

    const products = await p.product.findMany({
      where: {
        user: { email: { endsWith: "foodtradelink.example" } },
      },
      select: {
        productNumber: true,
        name: true,
        price: true,
        unit: true,
        moq: true,
        countryCode: true,
        status: true,
        isVisible: true,
        user: { select: { companyName: true } },
      },
      orderBy: { productNumber: "asc" },
    });
    console.log("\n=== PRODUCTS ===");
    for (const pr of products) {
      console.log(
        `#${pr.productNumber} | ${pr.name} | $${pr.price}/${pr.unit} | MOQ ${pr.moq} | ${pr.countryCode} | ${pr.status} | ${pr.user.companyName}`
      );
    }
    console.log(`\nTotal: ${users.length} suppliers, ${products.length} products`);
  } finally {
    await p.$disconnect();
  }
}

main();
