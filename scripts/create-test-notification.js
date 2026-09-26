// scripts/create-test-notification.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "mahdihaghighati@gmail.com" },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "admin_announcement",
      title: "Welcome to Notifications!",
      body: "This is a test notification. Click to see details.",
      link: "/dashboard",
      icon: "fa-bullhorn",
    },
  });

  console.log("✅ Test notification created");
}

main().finally(() => prisma.$disconnect());