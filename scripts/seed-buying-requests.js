// scripts/seed-buying-requests.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ============================================================
// تنظیمات
// ============================================================
const TOTAL_REQUESTS = 200;
const MIN_PER_COMPANY = 1;
const MAX_PER_COMPANY = 7;
const MIN_BUYERS_NEEDED = 40; // حداقل تعداد کمپانی خریدار

// ============================================================
// لیست کشورها (name + code)
// ============================================================
const COUNTRIES = [
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
  { name: "Turkey", code: "TR" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "India", code: "IN" },
  { name: "China", code: "CN" },
  { name: "Japan", code: "JP" },
  { name: "Brazil", code: "BR" },
  { name: "Mexico", code: "MX" },
  { name: "Spain", code: "ES" },
  { name: "Italy", code: "IT" },
  { name: "Netherlands", code: "NL" },
  { name: "Poland", code: "PL" },
  { name: "Kenya", code: "KE" },
  { name: "New Zealand", code: "NZ" },
  { name: "South Korea", code: "KR" },
  { name: "Singapore", code: "SG" },
  { name: "Malaysia", code: "MY" },
  { name: "Thailand", code: "TH" },
  { name: "Vietnam", code: "VN" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Oman", code: "OM" },
  { name: "Qatar", code: "QA" },
  { name: "Russia", code: "RU" },
  { name: "South Africa", code: "ZA" },
  { name: "Egypt", code: "EG" },
  { name: "Argentina", code: "AR" },
  { name: "Chile", code: "CL" },
  { name: "Sweden", code: "SE" },
  { name: "Norway", code: "NO" },
  { name: "Denmark", code: "DK" },
  { name: "Belgium", code: "BE" },
  { name: "Switzerland", code: "CH" },
  { name: "Austria", code: "AT" },
  { name: "Portugal", code: "PT" },
  { name: "Greece", code: "GR" },
];

// ============================================================
// دسته‌بندی‌ها (از فایل categories)
// ============================================================
const CATEGORIES = {
  Protein: [
    "Eggs",
    "Mushrooms",
    "Sprouts",
    "Meat",
    "Chicken",
    "Fish",
    "Shrimp",
    "Caviar",
    "Sausage",
    "Hot Dog",
    "Hamburger",
    "Nuggets",
  ],
  "Legumes, Grains, and Other Foods": [
    "Rice",
    "Legumes",
    "Pasta",
    "Lasagna",
    "Sugar",
    "Candy",
    "Dates",
    "Flour",
    "Powder",
    "Dough",
    "Various Breads",
    "Oil",
  ],
  "Dairy and Breakfast": [
    "Milk",
    "Cheese",
    "Butter",
    "Yogurt",
    "Cream",
    "Buttermilk",
    "Ice Cream",
    "Jam",
    "Honey",
    "Peanut Butter",
    "Cornflakes",
    "Halva",
  ],
  "Frozen Foods": ["Vegetables", "Desserts", "Ready-Made Meals"],
  Condiments: [
    "Salt",
    "Spices",
    "Herbs",
    "Lemon Juice",
    "Vinegar",
    "Tomato Paste",
    "Sauce",
    "Extracts",
    "Saffron",
    "Dried Limes",
    "Barberry",
    "Raisins",
  ],
  "Canned and Ready-Made Food": [
    "Mineral Water",
    "Juice",
    "Syrup",
    "Tea",
    "Herbal Tea",
    "Herbal Drinks",
    "Energy Drinks",
  ],
  "Sweets and Snacks": [
    "Salad",
    "Soup",
    "Stew",
    "Pickles",
    "Canned Vegetables",
    "Various Nuts and Dried Fruits",
    "Plums",
    "Apricots",
    "Chocolate",
    "Cocoa",
    "Chips",
    "Popcorn",
    "Jelly",
  ],
};

const UNITS = [
  "kg",
  "g",
  "L",
  "ml",
  "pieces",
  "boxes",
  "pallets",
  "containers",
  "metric_tons",
];

const BUDGET_RANGES = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000 – $50,000",
  "$50,000 – $100,000",
  "$100,000+",
];

const SHIPPING_TERMS = ["FOB", "CIF", "EXW", "DDP", "DAP", "CFR"];
const PAYMENT_TERMS = [
  "T/T",
  "L/C",
  "D/P",
  "D/A",
  "PayPal",
  "Western Union",
  "Other",
];

const PACKAGING_OPTIONS = [
  "Standard export packaging",
  "Custom packaging as per requirements",
  "Bulk bags (25kg, 50kg)",
  "Retail packaging",
  "Vacuum-sealed bags",
  "Carton boxes",
  "Steel drums",
  null,
];

const CERTIFICATIONS_LIST = [
  "ISO 22000",
  "HACCP",
  "USDA Organic",
  "EU Organic",
  "Halal",
  "Kosher",
  "FDA",
  "BRCGS",
  "FSSC 22000",
  null,
];

// ============================================================
// توابع کمکی
// ============================================================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function generateNumber() {
  return Math.floor(Math.random() * 9000000) + 1000000;
}

function generateSlug(text) {
  if (!text) return "request";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

async function getUniqueRequestNumber() {
  for (let i = 0; i < 30; i++) {
    const num = generateNumber();
    const exists = await prisma.buyingRequest.findUnique({
      where: { requestNumber: num },
    });
    if (!exists) return num;
  }
  // fallback
  return Date.now() % 9000000 + 1000000;
}

async function getUniqueSlug(baseText) {
  const baseSlug = generateSlug(baseText);
  let slug = baseSlug;
  let counter = 1;
  while (counter < 200) {
    const exists = await prisma.buyingRequest.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${baseSlug}_${counter}`;
    counter++;
  }
  return `${baseSlug}_${Date.now()}`;
}

function generateDescription(category, subCategory, quantity, unit) {
  const templates = [
    `We are looking for a reliable supplier for ${subCategory} (${category}). Need approximately ${quantity} ${unit} on a regular basis. Please provide your best FOB/CIF prices and lead times.`,
    `Our company requires ${subCategory} for our production line. Total quantity needed: ${quantity} ${unit}. Looking for long-term partnership with certified suppliers.`,
    `Seeking premium quality ${subCategory} for export. Quantity: ${quantity} ${unit}. Please share product specifications, certifications, and payment terms.`,
    `Urgent requirement for ${subCategory}. Need ${quantity} ${unit} delivered to our warehouse. Fast shipping and competitive pricing required.`,
    `We are sourcing ${subCategory} in bulk for our distribution network. Target quantity: ${quantity} ${unit} per shipment. Suppliers with export experience preferred.`,
    `Looking for certified ${subCategory} suppliers. We need ${quantity} ${unit} monthly. Long-term contract available for the right partner.`,
    `Our buyers are interested in high-quality ${subCategory}. Please quote for ${quantity} ${unit} with your best terms. Samples may be required.`,
    `We are a wholesale importer looking for ${subCategory}. Required quantity: ${quantity} ${unit}. Please include packaging and delivery details in your offer.`,
  ];
  return randomItem(templates);
}

function randomDeadline() {
  const daysAhead = randomInt(15, 120);
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

function randomSupplierCountries() {
  // 60% worldwide، 40% specific countries
  if (Math.random() < 0.6) return ["WORLDWIDE"];
  const count = randomInt(1, 4);
  const shuffled = [...COUNTRIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((c) => c.code);
}

// ============================================================
// اطمینان از وجود خریداران کافی
// ============================================================
async function ensureBuyers() {
  const existingBuyers = await prisma.user.findMany({
    where: { role: "BUYER", registrationComplete: true },
    select: { id: true, companyName: true, name: true, country: true, countryCode: true },
  });

  console.log(`   Existing buyers: ${existingBuyers.length}`);

  if (existingBuyers.length >= MIN_BUYERS_NEEDED) {
    console.log(`   ✅ Enough buyers available`);
    return existingBuyers;
  }

  const needed = MIN_BUYERS_NEEDED - existingBuyers.length;
  console.log(`   Creating ${needed} new buyer companies...`);

  const companySuffixes = [
    "Trading",
    "Imports",
    "Foods",
    "Group",
    "Enterprises",
    "Global",
    "Distribution",
    "Markets",
    "Wholesale",
    "Exports",
  ];

  const newBuyers = [];

  for (let i = 0; i < needed; i++) {
    const country = randomItem(COUNTRIES);
    const profileNumber = Math.floor(Math.random() * 9000000) + 1000000;
    const companyName = `${country.code}-${Date.now()
      .toString(36)
      .slice(-4)}${i} ${randomItem(companySuffixes)}`;
    const email = `buyer_${Date.now()}_${i}_${Math.floor(
      Math.random() * 10000
    )}@imported.foodhub.local`;
    const slug = `${companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 30)}_${Date.now().toString(36).slice(-4)}`;

    const buyer = await prisma.user.create({
      data: {
        email,
        name: `${companyName} Manager`,
        companyName,
        profileNumber,
        slug,
        role: "BUYER",
        plan: "FREE",
        country: country.name,
        countryCode: country.code,
        registrationComplete: true,
        emailVerified: new Date(),
        isAdmin: false,
      },
      select: {
        id: true,
        companyName: true,
        name: true,
        country: true,
        countryCode: true,
      },
    });
    newBuyers.push(buyer);
  }

  console.log(`   ✅ Created ${newBuyers.length} new buyers`);
  return [...existingBuyers, ...newBuyers];
}

// ============================================================
// تابع اصلی
// ============================================================
async function main() {
  console.log("🚀 Starting buying requests seed...\n");

  // ۱. پیدا کردن ادمین
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true, name: true, email: true },
  });

  if (!admin) {
    console.error("❌ No admin user found. Please create an admin first.");
    process.exit(1);
  }
  console.log(`👤 Using admin: ${admin.name || admin.email} (${admin.id})\n`);

  // ۲. اطمینان از وجود خریداران
  console.log("🏢 Checking buyers...");
  const buyers = await ensureBuyers();
  console.log();

  // ۳. توزیع درخواست‌ها بین خریداران (1 تا 7 هر کدام)
  console.log("📊 Distributing requests among buyers...");
  const assignments = []; // [{ buyer, count }]
  let assigned = 0;

  // ابتدا به همه حداقل 1 بده
  const shuffledBuyers = [...buyers].sort(() => 0.5 - Math.random());

  for (const buyer of shuffledBuyers) {
    if (assigned >= TOTAL_REQUESTS) break;
    const count = randomInt(MIN_PER_COMPANY, MAX_PER_COMPANY);
    const remaining = TOTAL_REQUESTS - assigned;
    const finalCount = Math.min(count, remaining);
    if (finalCount > 0) {
      assignments.push({ buyer, count: finalCount });
      assigned += finalCount;
    }
  }

  // اگر جا ماند، بین خریداران پخش کن
  while (assigned < TOTAL_REQUESTS) {
    const buyer = randomItem(buyers);
    const existing = assignments.find((a) => a.buyer.id === buyer.id);
    if (existing) {
      existing.count++;
    } else {
      assignments.push({ buyer, count: 1 });
    }
    assigned++;
  }

  console.log(
    `   ✅ Assigned ${assigned} requests across ${assignments.length} companies\n`
  );

  // ۴. ایجاد درخواست‌ها
  console.log("📝 Creating buying requests...\n");
  let created = 0;
  const errors = [];
  const categoryStats = {};

  for (const { buyer, count } of assignments) {
    for (let i = 0; i < count; i++) {
      try {
        // انتخاب دسته و زیردسته
        const categoryNames = Object.keys(CATEGORIES);
        const category = randomItem(categoryNames);
        const subCategory = randomItem(CATEGORIES[category]);

        // مقادیر رندوم
        const quantity = randomItem([
          100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000,
        ]);
        const unit = randomItem(UNITS);
        const budgetRange = randomItem(BUDGET_RANGES);
        const shippingTerms = randomItem(SHIPPING_TERMS);
        const paymentTerms = randomItem(PAYMENT_TERMS);
        const packagingReq = randomItem(PACKAGING_OPTIONS);
        const certifications = randomItem(CERTIFICATIONS_LIST);
        const deliveryCountry = randomItem(COUNTRIES);
        const isPriceNegotiable = Math.random() > 0.4;
        const targetPrice = isPriceNegotiable
          ? null
          : parseFloat(randomFloat(0.5, 50).toFixed(2));
        const isUrgent = Math.random() < 0.25;

        // عنوان
        const title = `${subCategory} · ${quantity} ${unit}`;

        // تعداد تلاش برای slug یکتا
        const requestNumber = await getUniqueRequestNumber();
        const slug = await getUniqueSlug(`${title}_${requestNumber}`);

        const description = generateDescription(
          category,
          subCategory,
          quantity,
          unit
        );

        // ایجاد
        await prisma.buyingRequest.create({
          data: {
            requestNumber,
            slug,
            title,
            category,
            subCategory,
            description,
            quantity,
            unit,
            budgetRange,
            currency: "USD",
            deadline: randomDeadline(),
            shippingTerms,
            deliveryCountry: deliveryCountry.name,
            packagingReq,
            certifications,
            paymentTerms,
            targetPrice,
            isPriceNegotiable,
            supplierCountries: randomSupplierCountries(),
            attachments: [],
            isUrgent,
            isVisible: true,
            buyerCountry: buyer.country || deliveryCountry.name,
            userId: buyer.id,
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: admin.id,
          },
        });

        created++;
        categoryStats[category] = (categoryStats[category] || 0) + 1;

        if (created % 25 === 0) {
          console.log(`   ✅ ${created}/${TOTAL_REQUESTS} created...`);
        }
      } catch (err) {
        errors.push({
          buyer: buyer.companyName,
          error: err.message,
        });
        console.error(
          `   ❌ Failed for ${buyer.companyName}: ${err.message}`
        );
      }
    }
  }

  // ============================================================
  // گزارش نهایی
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 SEED SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Total requests created:  ${created}`);
  console.log(`❌ Failed:                   ${errors.length}`);
  console.log(`👥 Companies involved:      ${assignments.length}`);
  console.log(`👤 Approved by admin:       ${admin.name || admin.email}`);
  console.log();

  console.log("📂 Distribution by category:");
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, cnt]) => {
      const pct = ((cnt / created) * 100).toFixed(1);
      console.log(`   ${cat.padEnd(40)} ${String(cnt).padStart(4)}  (${pct}%)`);
    });

  if (errors.length > 0) {
    console.log("\n❌ Error details (first 5):");
    errors.slice(0, 5).forEach((e) => {
      console.log(`   • ${e.buyer}: ${e.error}`);
    });
  }

  // نمایش توزیع per-company
  console.log("\n🏢 Sample company distribution (first 10):");
  assignments.slice(0, 10).forEach(({ buyer, count }) => {
    console.log(
      `   ${(buyer.companyName || buyer.name).padEnd(45)} ${count} requests`
    );
  });

  console.log("\n✨ Done!");
}

// ============================================================
// اجرا
// ============================================================
main()
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });