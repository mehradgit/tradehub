const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // ====== 1. ایجاد کاربران نمونه ======
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        password: hashedPassword,
        name: 'John Anderson',
        role: 'SUPPLIER',
        plan: 'GOLD',
        companyName: 'Anderson Foods LLC',
        country: 'United States',
        countryCode: 'us',    
        businessType: 'Manufacturer',
        phone: '+1 234 567 890',
        image: 'https://ui-avatars.com/api/?name=John+Anderson&background=e85d3a&color=fff&size=100',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        password: hashedPassword,
        name: 'Sarah Mitchell',
        role: 'BUYER',
        plan: 'SILVER',
        companyName: 'HealthyFoods Chain',
        country: 'Canada',
        ountryCode: 'ca',
        businessType: 'Distributor',
        phone: '+1 987 654 321',
        image: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=2b7a62&color=fff&size=100',
      },
    }),
    prisma.user.upsert({
      where: { email: 'robert@example.com' },
      update: {},
      create: {
        email: 'robert@example.com',
        password: hashedPassword,
        name: 'Robert King',
        role: 'SUPPLIER',
        plan: 'SILVER',
        companyName: 'EuroGrains Ltd',
        country: 'Germany',
        countryCode: 'de',
        businessType: 'Exporter',
        phone: '+49 123 456 789',
        image: 'https://ui-avatars.com/api/?name=Robert+King&background=f4b942&color=fff&size=100',
      },
    }),
    prisma.user.upsert({
      where: { email: 'emily@example.com' },
      update: {},
      create: {
        email: 'emily@example.com',
        password: hashedPassword,
        name: 'Emily Davis',
        role: 'BUYER',
        plan: 'FREE',
        companyName: 'BioRestaurant Group',
        country: 'France',
        countryCode: 'fa',
        businessType: 'Retailer',
        phone: '+33 123 456 789',
        image: 'https://ui-avatars.com/api/?name=Emily+Davis&background=8e44ad&color=fff&size=100',
      },
    }),
    prisma.user.upsert({
      where: { email: 'michael@example.com' },
      update: {},
      create: {
        email: 'michael@example.com',
        password: hashedPassword,
        name: 'Michael Chen',
        role: 'SUPPLIER',
        plan: 'BRONZE',
        companyName: 'Organic Village',
        country: 'United States',
        countryCode: 'us',
        businessType: 'Wholesaler',
        phone: '+1 456 789 123',
        image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=3498db&color=fff&size=100',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lisa@example.com' },
      update: {},
      create: {
        email: 'lisa@example.com',
        password: hashedPassword,
        name: 'Lisa Wong',
        role: 'BUYER',
        plan: 'GOLD',
        companyName: 'OrganicMarket Ltd',
        country: 'United Kingdom',
        countryCode: 'gb',
        businessType: 'Importer',
        phone: '+44 123 456 789',
        image: 'https://ui-avatars.com/api/?name=Lisa+Wong&background=e74c3c&color=fff&size=100',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ====== 2. ایجاد محصولات نمونه ======
  const productsData = [
    {
      name: 'Organic Fuji Apples',
      category: 'Fruits & Vegetables',
      subCategory: 'Fruits',
      shortDesc: 'Fresh organic Fuji apples from USA. Crisp and sweet.',
      fullDesc: 'Our organic Fuji apples are grown in Washington state. They are crisp, sweet, and perfect for fresh consumption or processing.',
      price: 2.85,
      currency: 'USD',
      unit: 'kg',
      moq: 100,
      stock: 5000,
      leadTime: 7,
      images: ['https://images.unsplash.com/photo-1579113800032-c38bd7635818?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      badge: 'Organic',
      country: 'USA',
      countryCode: 'us',
      origin: 'United States',
      certifications: 'USDA Organic',
      packaging: '10kg boxes',
      shippingTerms: 'FOB',
      userId: users[0].id,
    },
    {
      name: 'Organic White Quinoa',
      category: 'Grains & Cereals',
      subCategory: 'Grains',
      shortDesc: 'Premium organic white quinoa from Peru.',
      fullDesc: 'High-quality organic white quinoa from the Andes mountains. Rich in protein and perfect for healthy diets.',
      price: 6.50,
      currency: 'USD',
      unit: 'kg',
      moq: 500,
      stock: 10000,
      leadTime: 10,
      images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      badge: 'Best Seller',
      country: 'Peru',
      countryCode: 'pe',
      origin: 'Peru',
      certifications: 'USDA Organic, Fair Trade',
      packaging: '25kg bags',
      shippingTerms: 'CIF',
      userId: users[2].id,
    },
    {
      name: 'Organic Arabica Coffee Beans',
      category: 'Coffee & Beverages',
      subCategory: 'Green Coffee Beans',
      shortDesc: 'Specialty grade organic Arabica coffee from Colombia.',
      fullDesc: 'Sourced from high-altitude farms in Colombia. Notes of chocolate and caramel. Perfect for specialty roasters.',
      price: 12.50,
      currency: 'USD',
      unit: 'kg',
      moq: 100,
      stock: 2000,
      leadTime: 14,
      images: ['https://images.unsplash.com/photo-1499638673689-79a0b5115d87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      badge: 'Special',
      country: 'Colombia',
      countryCode: 'co',
      origin: 'Colombia',
      certifications: 'USDA Organic, Fair Trade',
      packaging: '20kg GrainPro bags',
      shippingTerms: 'FOB',
      userId: users[0].id,
    },
    {
      name: 'Organic California Almonds',
      category: 'Nuts & Seeds',
      subCategory: 'Nuts',
      shortDesc: 'Premium organic almonds from California.',
      fullDesc: 'High-quality organic almonds grown in California\'s Central Valley. Perfect for snacking and food processing.',
      price: 14.25,
      currency: 'USD',
      unit: 'kg',
      moq: 200,
      stock: 3000,
      leadTime: 8,
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      badge: 'New',
      country: 'USA',
      countryCode: 'us',
      origin: 'United States',
      certifications: 'USDA Organic',
      packaging: '15kg boxes',
      shippingTerms: 'FOB',
      userId: users[4].id,
    },
    {
      name: 'Extra Virgin Olive Oil',
      category: 'Oils & Vinegars',
      subCategory: 'Oils',
      shortDesc: 'Premium extra virgin olive oil from Greece.',
      fullDesc: 'Cold-pressed extra virgin olive oil from Greek olive groves. Rich in antioxidants and perfect for cooking.',
      price: 18.75,
      currency: 'USD',
      unit: 'L',
      moq: 100,
      stock: 1500,
      leadTime: 12,
      images: ['https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      badge: 'Offer',
      country: 'Greece',
      countryCode: 'gr',
      origin: 'Greece',
      certifications: 'Organic, PDO',
      packaging: '5L canisters, 1L bottles',
      shippingTerms: 'CIF',
      userId: users[2].id,
    },
    {
      name: 'Organic Carrots (Bulk)',
      category: 'Fruits & Vegetables',
      subCategory: 'Vegetables',
      shortDesc: 'Fresh organic carrots for bulk orders.',
      fullDesc: 'High-quality organic carrots grown in the Netherlands. Perfect for food processing and wholesale.',
      price: 1.45,
      currency: 'USD',
      unit: 'kg',
      moq: 500,
      stock: 20000,
      leadTime: 5,
      images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      badge: 'Organic',
      country: 'Netherlands',
      countryCode: 'nl',
      origin: 'Netherlands',
      certifications: 'EU Organic',
      packaging: '10kg crates',
      shippingTerms: 'FOB',
      userId: users[0].id,
    },
  ];

  for (const productData of productsData) {
    await prisma.product.create({ data: productData });
  }
  console.log(`✅ Created ${productsData.length} products`);

  // ====== 3. ایجاد درخواست‌های خرید نمونه ======
  const requestsData = [
    {
      title: 'Organic Arabica Coffee Beans',
      category: 'Coffee & Beverages',
      subCategory: 'Green Coffee Beans',
      description: 'Looking for supplier of organic Arabica coffee beans. Minimum order 500kg, shipping to Germany.',
      quantity: 500,
      unit: 'kg',
      budgetRange: '$5,000 – $10,000',
      currency: 'USD',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      shippingTerms: 'CIF',
      deliveryCountry: 'Germany',
      packagingReq: '20kg GrainPro bags',
      certifications: 'USDA Organic',
      attachments: ['specs.pdf', 'coffee_grade_cert.pdf'],  // ✅ اضافه شده
      isUrgent: false,
      buyerCountry: 'Germany',
      userId: users[1].id,
    },
    {
      title: 'WANTED: Organic Raw Honey',
      category: 'Honey & Sweeteners',
      subCategory: 'Raw Honey',
      description: 'Please quote for organic raw honey. 100% pure, glass jars preferred. Quantity: 2000 jars monthly.',
      quantity: 2000,
      unit: 'jars',
      budgetRange: '$8,000 – $10,000',
      currency: 'USD',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      shippingTerms: 'FOB',
      deliveryCountry: 'United Kingdom',
      packagingReq: '250g glass jars, tamper-evident seals',
      certifications: 'USDA Organic, EU Organic',
      attachments: ['honey_sample_requirements.pdf'],   // ✅ اضافه شده
      isUrgent: true,
      buyerCountry: 'United Kingdom',
      userId: users[5].id,
    },
    {
      title: 'Organic California Almonds',
      category: 'Nuts & Seeds',
      subCategory: 'Nuts',
      description: 'Seeking reliable supplier of organic California almonds. Minimum 1 ton per shipment required.',
      quantity: 1000,
      unit: 'kg',
      budgetRange: '$10,000 – $15,000',
      currency: 'USD',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      shippingTerms: 'FOB',
      deliveryCountry: 'United States',
      packagingReq: '15kg boxes',
      certifications: 'USDA Organic',
      attachments: [],   // ✅ خالی (اختیاری)
      isUrgent: false,
      buyerCountry: 'United States',
      userId: users[3].id,
    },
    {
      title: 'Premium Export Saffron',
      category: 'Spices & Herbs',
      subCategory: 'Spices',
      description: 'Looking for premium saffron for export to Europe. Monthly requirement: 10kg of highest quality.',
      quantity: 10,
      unit: 'kg',
      budgetRange: '$25,000 – $35,000',
      currency: 'USD',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      shippingTerms: 'CIF',
      deliveryCountry: 'UAE',
      packagingReq: 'Vacuum-sealed containers',
      certifications: 'ISO 22000',
      attachments: ['saffron_quality_specs.pdf'],   // ✅ اضافه شده
      isUrgent: false,
      buyerCountry: 'UAE',
      userId: users[1].id,
    },
  ];

  for (const requestData of requestsData) {
    await prisma.buyingRequest.create({ data: requestData });
  }
  console.log(`✅ Created ${requestsData.length} buying requests`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });