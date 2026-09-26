// scripts/create-admin.js (اختیاری)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@foodhub.com';
  const password = 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        companyName: 'FoodHub Admin',
        role: 'SUPPLIER',
        isAdmin: true,
        registrationComplete: true,
        emailVerified: new Date(),
        profileNumber: Math.floor(Math.random() * 9000000) + 1000000,
        slug: 'admin',
      },
    });
    console.log('✅ Admin user created.');
  } else {
    console.log('⚠️ Admin user already exists.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());