// scripts/import-buying-requests.js
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ====== لیست کاربران خریدار (از دیتابیس) ======
async function getBuyers() {
  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' },
    select: { id: true, country: true },
  });

  if (buyers.length === 0) {
    console.log('⚠️ No buyers found. Creating sample buyers...');
    const sampleBuyers = [];
    for (let i = 1; i <= 20; i++) {
      const buyer = await prisma.user.create({
        data: {
          email: `buyer${i}@example.com`,
          name: `Buyer ${i}`,
          companyName: `Buyer Company ${i}`,
          role: 'BUYER',
          plan: 'FREE',
          registrationComplete: true,
          country: 'United States',
          countryCode: 'us',
        },
      });
      sampleBuyers.push(buyer);
    }
    return sampleBuyers;
  }

  return buyers;
}

// ====== تابع اصلی ======
async function importBuyingRequests() {
  console.log('📂 Reading Excel file...');

  // ۱. خواندن فایل Excel
  const workbook = XLSX.readFile('buying_requests.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`✅ Found ${rows.length} buying request rows`);

  // ۲. دریافت خریداران
  const buyers = await getBuyers();
  console.log(`👥 Found/Created ${buyers.length} buyers`);

  let importedCount = 0;
  let skippedCount = 0;

  // ۳. پردازش هر ردیف
  for (const row of rows) {
    try {
      // انتخاب یک خریدار رندوم
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];

      // پردازش attachments
      let attachments = [];
      if (row.attachments && row.attachments !== '') {
        attachments = row.attachments.split(',').map(s => s.trim());
      }

      // پردازش deadline
      let deadline = null;
      if (row.deadline && row.deadline !== '') {
        deadline = new Date(row.deadline);
        if (isNaN(deadline.getTime())) {
          deadline = null;
        }
      }

      const data = {
        title: row.title || 'Untitled Request',
        category: row.category || 'Food Products',
        subCategory: row.subCategory || 'General',
        description: row.description || '',
        quantity: parseInt(row.quantity) || 0,
        unit: row.unit || 'kg',
        budgetRange: row.budgetRange || null,
        currency: row.currency || 'USD',
        deadline: deadline,
        shippingTerms: row.shippingTerms || null,
        deliveryCountry: row.deliveryCountry || 'Unknown',
        packagingReq: row.packagingReq || null,
        certifications: row.certifications || null,
        attachments: attachments,
        isUrgent: row.isUrgent === true || row.isUrgent === 'true' || row.isUrgent === 1,
        isVisible: row.isVisible !== false && row.isVisible !== 'false' && row.isVisible !== 0,
        buyerCountry: row.buyerCountry || buyer.country || 'Unknown',
        userId: buyer.id,
      };

      // اعتبارسنجی ساده
      if (data.quantity <= 0) {
        console.log(`⚠️ Skipping "${data.title}" - invalid quantity`);
        skippedCount++;
        continue;
      }

      await prisma.buyingRequest.create({ data });
      importedCount++;
      if (importedCount % 50 === 0) {
        console.log(`✅ Imported ${importedCount} requests...`);
      }
    } catch (error) {
      console.error(`❌ Error importing row:`, error.message);
      skippedCount++;
    }
  }

  console.log(`\n🎉 Import completed!`);
  console.log(`✅ Imported: ${importedCount} buying requests`);
  console.log(`⏭️ Skipped: ${skippedCount} rows`);
}

importBuyingRequests()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());