// scripts/import-products.js
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ====== لیست کشورها با کد ======
const COUNTRIES = [
  { name: 'United States', code: 'us' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'Germany', code: 'de' },
  { name: 'France', code: 'fr' },
  { name: 'Canada', code: 'ca' },
  { name: 'Australia', code: 'au' },
  { name: 'Iran', code: 'ir' },
  { name: 'Turkey', code: 'tr' },
  { name: 'UAE', code: 'ae' },
  { name: 'India', code: 'in' },
  { name: 'China', code: 'cn' },
  { name: 'Japan', code: 'jp' },
  { name: 'Brazil', code: 'br' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Spain', code: 'es' },
  { name: 'Italy', code: 'it' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'Poland', code: 'pl' },
  { name: 'Kenya', code: 'ke' },
  { name: 'New Zealand', code: 'nz' },
];

// ====== تابع انتخاب رندوم ======
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ====== تابع استخراج عدد از رشته ======
function extractNumber(str) {
  if (!str) return 0;
  const matches = String(str).match(/\d+(\.\d+)?/g);
  if (matches) {
    const nums = matches.map(Number);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  return 0;
}

// ====== تابع استخراج MOQ ======
function extractMOQ(str) {
  if (!str) return 1;
  const match = String(str).match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

// ====== تابع اصلی ======
async function importProducts() {
  console.log('📂 Reading Excel file...');

  const workbook = XLSX.readFile('product.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`✅ Found ${rows.length} product rows`);

  // گروه‌بندی بر اساس supplier_codes
  const supplierMap = new Map();
  for (const row of rows) {
    const code = row.supplier_codes;
    if (!supplierMap.has(code)) {
      supplierMap.set(code, []);
    }
    supplierMap.get(code).push(row);
  }

  console.log(`👥 Found ${supplierMap.size} unique suppliers`);

  // اطمینان از وجود پوشه تصاویر
  const imageFolder = path.join(__dirname, '../product_images');
  const targetFolder = path.join(__dirname, '../public/uploads/products');
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
    console.log('📁 Created target folder for images');
  }

  // پردازش هر تامین‌کننده
  let supplierIndex = 0;
  for (const [supplierCode, products] of supplierMap) {
    supplierIndex++;

    // ✅ انتخاب یک کشور رندوم برای این تامین‌کننده
    const country = randomItem(COUNTRIES);
    console.log(`\n🏢 Processing supplier ${supplierCode} → ${country.name} (${country.code})`);

    // ایجاد یا پیدا کردن کاربر (تامین‌کننده)
    const email = `supplier_${supplierCode}@example.com`;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: `Supplier ${supplierCode}`,
          companyName: `Company ${supplierCode}`,
          role: 'SUPPLIER',
          plan: 'FREE',
          registrationComplete: true,
          country: country.name,
          countryCode: country.code,
        },
      });
      console.log(`✅ Created user: ${user.email} (${country.name})`);
    } else {
      console.log(`✅ Using existing user: ${user.email}`);
    }

    // پردازش محصولات این تامین‌کننده
    let productCount = 0;
    for (const row of products) {
      const productCode = row.product_codes;
      const title = row.titles || 'Untitled';
      const description = row.descriptions || '';
      const priceStr = String(row.prices || '0');
      const moqStr = String(row.moqs || '0');

      const price = extractNumber(priceStr);
      const moq = extractMOQ(moqStr);

      // کپی کردن تصاویر
      const imageFiles = fs
        .readdirSync(imageFolder)
        .filter((f) => f.startsWith(`${productCode}-`) && /\.(jpg|jpeg|png|webp)$/i.test(f));

      const imagePaths = [];
      for (const file of imageFiles) {
        const src = path.join(imageFolder, file);
        const dest = path.join(targetFolder, file);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
        }
        imagePaths.push(`/uploads/products/${file}`);
      }

      if (imagePaths.length === 0) {
        imagePaths.push('/uploads/products/placeholder.jpg');
      }

      // ✅ استفاده از کشور انتخاب‌شده برای محصول
      const productData = {
        name: title.slice(0, 255),
        category: 'Food Products',
        subCategory: 'General',
        shortDesc: description.slice(0, 200) || title.slice(0, 200),
        fullDesc: description || title,
        price: price || 0.01,
        currency: 'USD',
        unit: 'kg',
        moq: moq || 1,
        stock: null,
        leadTime: null,
        images: imagePaths,
        badge: null,
        country: country.name,
        countryCode: country.code,
        origin: country.name,
        certifications: null,
        packaging: null,
        shippingTerms: null,
        isVisible: true,
        userId: user.id,
      };

      await prisma.product.create({ data: productData });
      productCount++;
    }

    console.log(`✅ Added ${productCount} products for supplier ${supplierCode}`);
  }

  console.log('\n🎉 All data imported successfully!');
}

importProducts()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());