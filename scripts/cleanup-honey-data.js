// scripts/cleanup-honey-data.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// ============================================================
// تنظیمات
// ============================================================
const INPUT_FILE = path.join(
  __dirname,
  "Go4WorldBusiness_Honey_50_Products_With_Suppliers.xlsx"
);
const OUTPUT_FILE = path.join(__dirname, "honey-cleaned.json");

// ============================================================
// نقشه‌ی کشورها (name + code)
// ============================================================
const COUNTRY_MAP = {
  "Djibouti": { name: "Djibouti", code: "DJ" },
  "Viet Nam": { name: "Vietnam", code: "VN" },
  "Vietnam": { name: "Vietnam", code: "VN" },
  "India": { name: "India", code: "IN" },
  "Uzbekistan": { name: "Uzbekistan", code: "UZ" },
  "Malaysia": { name: "Malaysia", code: "MY" },
  "France": { name: "France", code: "FR" },
  "United Arab Emirates": { name: "United Arab Emirates", code: "AE" },
  "Canada": { name: "Canada", code: "CA" },
  "Hungary": { name: "Hungary", code: "HU" },
  "New Zealand": { name: "New Zealand", code: "NZ" },
  "Thailand": { name: "Thailand", code: "TH" },
  "South Africa": { name: "South Africa", code: "ZA" },
  "United States": { name: "United States", code: "US" },
};

// ============================================================
// نقشه‌ی واحدها به فرمت اپ
// ============================================================
const UNIT_MAP = {
  "kilogram": "kg",
  "kilograms": "kg",
  "kilogram(s)": "kg",
  "kg": "kg",
  "gram": "g",
  "grams": "g",
  "g": "g",
  "liter": "L",
  "liters": "L",
  "litre": "L",
  "litres": "L",
  "l": "L",
  "ml": "ml",
  "ton": "metric_tons",
  "tons": "metric_tons",
  "tonne": "metric_tons",
  "tonnes": "metric_tons",
  "metric ton": "metric_tons",
  "metric tons": "metric_tons",
  "metric tonnes": "metric_tons",
  "piece": "pieces",
  "pieces": "pieces",
  "box": "boxes",
  "boxes": "boxes",
  "carton": "boxes",
  "cartons": "boxes",
  "can": "boxes",
  "cans": "boxes",
  "pallet": "pallets",
  "pallets": "pallets",
  "container": "containers",
  "containers": "containers",
};

// ============================================================
// نقشه‌ی دسته‌بندی محصولات
// ============================================================
function getCategoryMapping(productName) {
  const name = (productName || "").toLowerCase();

  // محصولات جانبی
  if (name.includes("cake")) {
    return { category: "Sweets and Snacks", subCategory: "Chocolate" };
  }
  if (name.includes("water") || name.includes("drink")) {
    return {
      category: "Canned and Ready-Made Food",
      subCategory: "Energy Drinks",
    };
  }
  if (name.includes("powder")) {
    return { category: "Dairy and Breakfast", subCategory: "Honey" };
  }

  // همه‌ی انواع عسل
  return { category: "Dairy and Breakfast", subCategory: "Honey" };
}

// ============================================================
// استخراج قیمت از رشته
// ============================================================
function parsePrice(priceStr) {
  if (!priceStr) return { min: null, max: null };

  const str = String(priceStr).trim();

  // فرمت‌های معتبر: "$3 - $6 / Kilogram" یا "$5" یا "$1.5 - $3.5 / Box"
  const rangeMatch = str.match(/\$([\d.]+)\s*-\s*\$([\d.]+)/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
    };
  }

  const singleMatch = str.match(/\$([\d.]+)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    return { min: val, max: val };
  }

  return { min: null, max: null };
}

// ============================================================
// استخراج واحد از رشته (مثلاً "/ Kilogram")
// ============================================================
function parseUnit(priceStr, moqStr) {
  const sources = [priceStr, moqStr].filter(Boolean).join(" ").toLowerCase();

  for (const [key, value] of Object.entries(UNIT_MAP)) {
    if (sources.includes(key)) {
      return value;
    }
  }

  return "kg"; // پیش‌فرض
}

// ============================================================
// استخراج MOQ (عدد)
// ============================================================
function parseMOQ(moqStr) {
  if (!moqStr) return null;

  const str = String(moqStr).trim();

  // فرمت‌های خاص: "MOQ: 25000 Kilograms" یا "10 Tons (US)"
  const cleanStr = str.replace(/MOQ:\s*/i, "");
  const match = cleanStr.match(/^([\d,]+)/);

  if (match) {
    return parseInt(match[1].replace(/,/g, ""), 10);
  }

  return null;
}

// ============================================================
// استخراج Incoterm از Shipping
// ============================================================
function parseShippingTerms(shippingStr) {
  if (!shippingStr) return null;

  const str = String(shippingStr).toUpperCase();

  // جستجوی Incoterm های شناخته‌شده
  const terms = ["FOB", "CIF", "EXW", "DDP", "DAP", "CFR", "CPT", "CIP"];
  for (const term of terms) {
    // مطمئن شو کلمه‌ی کامل هست
    if (new RegExp(`\\b${term}\\b`).test(str)) {
      return term;
    }
  }

  return null;
}

// ============================================================
// استخراج زمان تحویل (روز)
// ============================================================
function parseLeadTime(leadStr) {
  if (!leadStr) return null;

  const str = String(leadStr);

  // فرمت: "10-15 Days" یا "30-45 days" یا "15 to 25 days"
  const match = str.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*days?/i);
  if (match) {
    // میانگین رو می‌گیریم
    return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
  }

  const singleMatch = str.match(/(\d+)\s*days?/i);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }

  return null;
}

// ============================================================
// استخراج certifications (به آرایه)
// ============================================================
function parseCertifications(certStr) {
  if (!certStr) return [];

  const str = String(certStr).trim();
  if (!str) return [];

  // جدا کردن با کاما، اسلش، خط تیره
  return str
    .split(/[,|/]/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c.length < 60)
    .slice(0, 10); // حداکثر ۱۰ مورد
}

// ============================================================
// تمیز کردن توضیحات
// ============================================================
function cleanDescription(desc, productName, supplierName) {
  if (!desc) return "";

  let str = String(desc).trim();

  // حذف عبارت تکراری "Buy high quality X by Y. Supplier from Z. Product Id NNNNN."
  const patterns = [
    /Buy high quality .*?\. Supplier from .*?\. Product Id \d+\.?/gi,
    /Product Id \d+\.?/gi,
  ];

  for (const pattern of patterns) {
    str = str.replace(pattern, "");
  }

  // حذف فاصله‌های اضافی
  str = str.replace(/\s+/g, " ").trim();

  // اگه خالی شد، یه توضیح استاندارد بساز
  if (!str || str.length < 10) {
    return `${productName} supplied by ${supplierName}. High quality product available for export.`;
  }

  return str;
}

// ============================================================
// بررسی اینکه محصول مرتبط با عسل خوراکی هست
// ============================================================
function isEdibleHoney(productName) {
  const name = (productName || "").toLowerCase();

  // حذف موارد غیرمرتبط (ضایعات برنجی)
  const blacklist = ["brass", "scrap", "metal"];
  if (blacklist.some((term) => name.includes(term))) {
    return false;
  }

  return true;
}

// ============================================================
// نرمال‌سازی نام (حذف کاراکترهای اضافی)
// ============================================================
function normalizeString(str) {
  if (!str) return "";
  return String(str).replace(/\s+/g, " ").trim();
}

// ============================================================
// تابع اصلی
// ============================================================
async function main() {
  console.log("📂 Reading Excel file...");
  console.log(`   Input: ${INPUT_FILE}`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ File not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(INPUT_FILE);

  // شیت اول = Honey - 50 Products
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`✅ Found ${rows.length} rows in sheet "${sheetName}"`);

  const cleaned = [];
  let skipped = 0;
  const skippedReasons = {};

  for (const row of rows) {
    const productName = normalizeString(row["Product Name"]);
    const supplierName = normalizeString(row["Supplier Name (from Product)"]);

    // ==== اعتبارسنجی‌های اولیه ====
    if (!productName || !supplierName) {
      skipped++;
      skippedReasons["missing name/supplier"] =
        (skippedReasons["missing name/supplier"] || 0) + 1;
      continue;
    }

    // حذف محصولات غیرمرتبط
    if (!isEdibleHoney(productName)) {
      skipped++;
      skippedReasons[`non-edible: ${productName}`] =
        (skippedReasons[`non-edible: ${productName}`] || 0) + 1;
      continue;
    }

    // ==== استخراج قیمت ====
    const priceInfo = parsePrice(row["Price"]);
    if (priceInfo.min === null) {
      // اگه قیمت نداریم، یه قیمت پیش‌فرض می‌ذاریم
      priceInfo.min = 0.01;
      priceInfo.max = 0.01;
    }

    // ==== استخراج واحد ====
    const unit = parseUnit(row["Price"], row["Minimum Order Quantity"]);

    // ==== استخراج MOQ ====
    const moq = parseMOQ(row["Minimum Order Quantity"]) || 1;

    // ==== استخراج Shipping Terms ====
    const shippingTerms = parseShippingTerms(row["Shipping/Incoterm"]);

    // ==== استخراج Lead Time ====
    const leadTime = parseLeadTime(row["Lead/Delivery Time"]);

    // ==== استخراج Certifications ====
    const certifications = parseCertifications(row["Supplier Certifications"]);

    // ==== نقشه‌ی کشور ====
    const countryStr = normalizeString(row["Supplier Country/Location (from Product)"]);
    const countryInfo = COUNTRY_MAP[countryStr] || {
      name: countryStr || "Unknown",
      code: null,
    };

    const originStr = normalizeString(row["Country of Origin"]);
    const originInfo = COUNTRY_MAP[originStr];

    // ==== دسته‌بندی ====
    const mapping = getCategoryMapping(productName);

    // ==== توضیحات ====
    const shortDesc =
      normalizeString(row["Product Description"]).slice(0, 200) ||
      `${productName} supplied by ${supplierName}`;

    const fullDesc = cleanDescription(
      row["Product Description"],
      productName,
      supplierName
    );

    // ==== ساخت آبجکت نهایی ====
    const item = {
      // ===== محصول =====
      product: {
        name: productName,
        category: mapping.category,
        subCategory: mapping.subCategory,
        shortDesc: shortDesc.slice(0, 250),
        fullDesc: fullDesc,
        price: priceInfo.min,
        maxPrice: priceInfo.max,
        currency: "USD",
        unit: unit,
        moq: moq,
        leadTime: leadTime,
        images: row["Product Image URL"] ? [row["Product Image URL"]] : [],
        country: originInfo?.name || countryInfo.name,
        countryCode: originInfo?.code || countryInfo.code,
        origin: originInfo?.name || countryInfo.name,
        certifications:
          certifications.length > 0 ? certifications.join(", ") : null,
        packaging: normalizeString(row["Packaging"]) || null,
        shippingTerms: shippingTerms,
        isVisible: true,
        status: "APPROVED", // مستقیم تأییدشده وارد کن
      },

      // ===== تأمین‌کننده =====
      supplier: {
        name: supplierName,
        companyName: supplierName,
        legalEntity: normalizeString(row["Supplier Legal Entity"]) || supplierName,
        email: null, // بعداً تولید می‌شه
        country: countryInfo.name,
        countryCode: countryInfo.code,
        role: "SUPPLIER",
        businessType: normalizeString(row["Supplier Business Type"]) || null,
        phone: normalizeString(row["Supplier Phone"]) || null,
        website: normalizeString(row["Supplier Website"]) || null,
        address: normalizeString(row["Supplier Location"]) || null,
        bio: normalizeString(row["Supplier Business Activity/Overview"]) || null,
        contactPerson: normalizeString(row["Supplier Contact Person"]) || null,
        contactDesignation:
          normalizeString(row["Supplier Contact Designation"]) || null,
        establishedYear: row["Supplier Established Year"] || null,
        memberSince: normalizeString(row["Supplier Member Since"]) || null,
        membershipStatus:
          normalizeString(row["Supplier Membership Status"]) || "FREE",
        marketsCovered: normalizeString(row["Supplier Markets Covered"]) || null,
        domesticMarkets:
          normalizeString(row["Supplier Domestic Markets"]) || null,
        certifications:
          certifications.length > 0 ? certifications.join(", ") : null,
      },

      // ===== لینک‌های منبع =====
      source: {
        productUrl: row["Product Listing URL"] || null,
        supplierUrl: row["Supplier Profile URL"] || null,
        platform: "Go4WorldBusiness",
        verified:
          normalizeString(row["Verification Note"]) ||
          "Actual public listing/profile",
      },
    };

    cleaned.push(item);
  }

  // ===== آمار =====
  console.log("\n📊 Cleanup Summary:");
  console.log(`   ✅ Valid items: ${cleaned.length}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log("\n⏭️  Skipped reasons:");
  for (const [reason, count] of Object.entries(skippedReasons)) {
    console.log(`   • ${reason}: ${count}`);
  }

  // ===== آمار تأمین‌کنندگان یکتا =====
  const uniqueSuppliers = new Set(cleaned.map((c) => c.supplier.name));
  console.log(`\n🏢 Unique suppliers: ${uniqueSuppliers.size}`);

  // ===== توزیع کشورها =====
  const countryDist = {};
  for (const item of cleaned) {
    const c = item.supplier.country || "Unknown";
    countryDist[c] = (countryDist[c] || 0) + 1;
  }
  console.log("\n🌍 By country:");
  Object.entries(countryDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`   ${country}: ${count}`);
    });

  // ===== ذخیره =====
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleaned, null, 2), "utf-8");
  console.log(`\n💾 Saved cleaned data to: ${OUTPUT_FILE}`);
  console.log(`\n✨ Done! Ready to import.`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});