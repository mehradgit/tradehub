// scripts/seed-attributes.js
// ============================================================
// درج اتریبیوت‌های اولیه برای کالاهای مختلف
//
//   node scripts/seed-attributes.js --dry     # فقط نمایش، بدون نوشتن
//   node scripts/seed-attributes.js           # درج/به‌روزرسانی
//
// امن برای اجرای چندباره است (find → update/create، نه create کور).
//
// ─────────────────────────────────────────────────────────────
// ⚠️ قاعده‌ی طلایی scopeId
//
//   scopeId همیشه slug «همان یک سطح» است، نه مسیر کامل:
//
//     global      → scopeId = null            (همه‌ی محصولات)
//     category    → scopeId = slug سطح ۱      مثال: "sweeteners-sugar-honey"
//     subCategory → scopeId = slug سطح ۲      مثال: "honey-bee-products"
//
//   ❌ غلط: scopeId = "sweeteners-sugar-honey/honey-bee-products"
//
//   همچنین فروشنده باید دسته را «حداقل به همان عمقی که scope گفته»
//   انتخاب کند؛ وگرنه اتریبیوت برنمی‌گردد. اتریبیوت subCategory فقط
//   وقتی دیده می‌شود که زیردسته هم انتخاب شده باشد.
//
//   این اسکریپت scopeIdها را با categories.json واقعی چک می‌کند و
//   هر مورد نامعتبر را با هشدار رد می‌کند تا دیتای خراب وارد نشود.
// ============================================================

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const categoriesData = require("../src/lib/categories.json");

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

// ============================================================
// کمکی‌ها
// ============================================================
const opts = (...list) => list.map((v) => ({ value: v, label: v }));

// پیش‌فرض‌ها
function def(a) {
  return {
    unit: null,
    options: null,
    isFilterable: true,
    isRequired: false,
    showInCard: false,
    isActive: true,
    sortOrder: 0,
    ...a,
  };
}

// ============================================================
// ۱) اتریبیوت‌های عمومی — روی همه‌ی محصولات
// ============================================================
const GLOBAL_ATTRS = [
  { key: "brand", label: "Brand", dataType: "text", sortOrder: 10, showInCard: true },
  {
    key: "storage_conditions",
    label: "Storage conditions",
    dataType: "select",
    options: opts("Ambient", "Chilled", "Frozen"),
    sortOrder: 20,
    showInCard: true,
  },
  { key: "shelf_life_months", label: "Shelf life", dataType: "number", unit: "months", sortOrder: 30 },
  { key: "private_label", label: "Private label available", dataType: "boolean", sortOrder: 40 },
  { key: "sample_available", label: "Sample available", dataType: "boolean", sortOrder: 50 },
];

// ============================================================
// ۲) اتریبیوت‌های سطح دسته (scope: category)
//    کلید = slug سطح ۱
// ============================================================
const CATEGORY_ATTRS = {
  "grains-cereals": [
    { key: "moisture", label: "Moisture", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "broken_grains", label: "Broken grains", dataType: "number", unit: "%", sortOrder: 20 },
    { key: "foreign_matter", label: "Foreign matter", dataType: "number", unit: "%", sortOrder: 30 },
    { key: "crop_year", label: "Crop year", dataType: "number", sortOrder: 40 },
  ],
  "pulses-legumes": [
    { key: "moisture", label: "Moisture", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "admixture", label: "Admixture", dataType: "number", unit: "%", sortOrder: 20 },
    { key: "size_mm", label: "Size", dataType: "number", unit: "mm", sortOrder: 30, showInCard: true },
    { key: "crop_year", label: "Crop year", dataType: "number", sortOrder: 40 },
  ],
  "nuts-seeds-dried-fruits": [
    { key: "moisture", label: "Moisture", dataType: "number", unit: "%", sortOrder: 10 },
    { key: "crop_year", label: "Crop year", dataType: "number", sortOrder: 20 },
    {
      key: "grade",
      label: "Grade",
      dataType: "select",
      options: opts("Premium", "Grade A", "Grade B", "Standard"),
      sortOrder: 30,
      showInCard: true,
    },
    {
      key: "shell_type",
      label: "Presentation",
      dataType: "select",
      options: opts("In shell", "Shelled", "Kernels", "Slices", "Powder"),
      sortOrder: 40,
    },
  ],
  "fruits-vegetables": [
    { key: "variety", label: "Variety", dataType: "text", sortOrder: 10, showInCard: true },
    { key: "size_mm", label: "Calibre", dataType: "number", unit: "mm", sortOrder: 20 },
    { key: "brix", label: "Brix (sugar content)", dataType: "number", unit: "°Bx", sortOrder: 30 },
    { key: "storage_temp", label: "Storage temperature", dataType: "number", unit: "°C", sortOrder: 40 },
    { key: "organic_certified", label: "Organic certified", dataType: "boolean", sortOrder: 50 },
  ],
  "spices-herbs-seasonings": [
    { key: "moisture", label: "Moisture", dataType: "number", unit: "%", sortOrder: 10 },
    {
      key: "form",
      label: "Form",
      dataType: "select",
      options: opts("Whole", "Cracked", "Ground", "Powder", "Extract"),
      sortOrder: 20,
      showInCard: true,
    },
    { key: "purity", label: "Purity", dataType: "number", unit: "%", sortOrder: 30 },
    { key: "volatile_oil", label: "Volatile oil", dataType: "number", unit: "%", sortOrder: 40 },
  ],
  "oils-fats-shortenings": [
    {
      key: "oil_grade",
      label: "Grade",
      dataType: "select",
      options: opts("Extra Virgin", "Virgin", "Refined", "Pomace", "Crude"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "acidity", label: "Free fatty acid (acidity)", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    {
      key: "extraction",
      label: "Extraction method",
      dataType: "select",
      options: opts("Cold Pressed", "Hot Pressed", "Solvent Extracted"),
      sortOrder: 30,
    },
  ],
  "sweeteners-sugar-honey": [
    { key: "moisture", label: "Moisture", dataType: "number", unit: "%", sortOrder: 10 },
    { key: "brix", label: "Brix", dataType: "number", unit: "°Bx", sortOrder: 20 },
    {
      key: "form",
      label: "Form",
      dataType: "select",
      options: opts("Liquid", "Solid", "Crystallized", "Powder", "Granulated"),
      sortOrder: 30,
      showInCard: true,
    },
  ],
  "coffee-tea-cocoa": [
    { key: "crop_year", label: "Crop year", dataType: "number", sortOrder: 10 },
    {
      key: "processing",
      label: "Processing",
      dataType: "select",
      options: opts("Washed", "Natural", "Honey Processed", "Wet Hulled", "Fermented", "Sun Dried"),
      sortOrder: 20,
      showInCard: true,
    },
    {
      key: "grade",
      label: "Grade",
      dataType: "select",
      options: opts("Specialty", "Premium", "Grade 1", "Grade 2", "Commodity"),
      sortOrder: 30,
    },
  ],
  "dairy-eggs": [
    { key: "fat_content", label: "Fat content", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "storage_temp", label: "Storage temperature", dataType: "number", unit: "°C", sortOrder: 20 },
    { key: "pasteurized", label: "Pasteurized", dataType: "boolean", sortOrder: 30 },
    {
      key: "milk_source",
      label: "Milk source",
      dataType: "select",
      options: opts("Cow", "Sheep", "Goat", "Buffalo", "Camel", "Mixed"),
      sortOrder: 40,
      showInCard: true,
    },
  ],
  "meat-poultry-game": [
    {
      key: "cut_type",
      label: "Cut type",
      dataType: "select",
      options: opts("Whole carcass", "Half carcass", "Bone-in", "Boneless", "Cubes", "Mince", "Offal"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "storage_temp", label: "Storage temperature", dataType: "number", unit: "°C", sortOrder: 20 },
    { key: "frozen", label: "Frozen", dataType: "boolean", sortOrder: 30, showInCard: true },
    { key: "halal_slaughter", label: "Halal slaughter", dataType: "boolean", sortOrder: 40 },
  ],
  "seafood-aquaculture": [
    {
      key: "cut_type",
      label: "Presentation",
      dataType: "select",
      options: opts("Whole", "Gutted", "Fillet", "HGT", "Loins", "Steaks", "Live"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "storage_temp", label: "Storage temperature", dataType: "number", unit: "°C", sortOrder: 20 },
    { key: "frozen", label: "Frozen", dataType: "boolean", sortOrder: 30, showInCard: true },
    {
      key: "source",
      label: "Source",
      dataType: "select",
      options: opts("Wild caught", "Farmed", "Aquaculture"),
      sortOrder: 40,
    },
  ],
  "bakery-confectionery-snacks": [
    { key: "flavor", label: "Flavour", dataType: "text", sortOrder: 10, showInCard: true },
    { key: "sugar_free", label: "Sugar free", dataType: "boolean", sortOrder: 20 },
    { key: "gluten_free", label: "Gluten free", dataType: "boolean", sortOrder: 30 },
    { key: "cocoa_content", label: "Cocoa content", dataType: "number", unit: "%", sortOrder: 40 },
  ],
  "processed-convenience-foods": [
    {
      key: "preservation",
      label: "Preservation",
      dataType: "select",
      options: opts("Canned", "Frozen", "Dried", "Vacuum packed", "Retort pouch", "Fresh"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "ready_to_eat", label: "Ready to eat", dataType: "boolean", sortOrder: 20 },
    { key: "storage_temp", label: "Storage temperature", dataType: "number", unit: "°C", sortOrder: 30 },
  ],
  "food-ingredients-additives": [
    { key: "purity", label: "Purity", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    {
      key: "grade",
      label: "Grade",
      dataType: "select",
      options: opts("Food grade", "Pharma grade", "Technical grade", "Feed grade"),
      sortOrder: 20,
      showInCard: true,
    },
    { key: "cas_number", label: "CAS number", dataType: "text", sortOrder: 30 },
    { key: "origin_type", label: "Origin", dataType: "select", options: opts("Natural", "Synthetic", "Fermentation"), sortOrder: 40 },
  ],
  "plant-based-alternative-foods": [
    {
      key: "protein_source",
      label: "Protein source",
      dataType: "select",
      options: opts("Soy", "Pea", "Wheat gluten", "Rice", "Oat", "Chickpea", "Fava", "Hemp"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "vegan", label: "Vegan", dataType: "boolean", sortOrder: 30 },
    { key: "non_gmo", label: "Non-GMO", dataType: "boolean", sortOrder: 40 },
  ],
  "organic-specialty-foods": [
    { key: "organic_certified", label: "Organic certified", dataType: "boolean", sortOrder: 10, showInCard: true },
    { key: "superfood_type", label: "Type", dataType: "text", sortOrder: 20 },
    { key: "harvest_method", label: "Harvest method", dataType: "select", options: opts("Wild harvested", "Cultivated", "Manual", "Mechanical"), sortOrder: 30 },
  ],
  beverages: [
    { key: "brix", label: "Brix", dataType: "number", unit: "°Bx", sortOrder: 10, showInCard: true },
    { key: "carbonated", label: "Carbonated", dataType: "boolean", sortOrder: 20 },
    {
      key: "sugar_content",
      label: "Sugar content",
      dataType: "select",
      options: opts("Regular", "Low sugar", "Sugar free", "No added sugar"),
      sortOrder: 30,
      showInCard: true,
    },
    { key: "concentrate", label: "Concentrate", dataType: "boolean", sortOrder: 40 },
  ],
  "pet-food": [
    {
      key: "form",
      label: "Form",
      dataType: "select",
      options: opts("Dry / Kibble", "Wet / Canned", "Semi-moist", "Freeze dried", "Raw"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "life_stage", label: "Life stage", dataType: "select", options: opts("Puppy / Kitten", "Adult", "Senior", "All life stages"), sortOrder: 20, showInCard: true },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 30 },
  ],
  "animal-feed": [
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    {
      key: "form",
      label: "Form",
      dataType: "select",
      options: opts("Pellet", "Mash", "Crumble", "Meal", "Block"),
      sortOrder: 20,
      showInCard: true,
    },
    {
      key: "target_animal",
      label: "Target animal",
      dataType: "multiSelect",
      options: opts("Poultry", "Cattle", "Sheep", "Goat", "Fish", "Swine", "Camel"),
      sortOrder: 30,
    },
  ],
  "food-packaging-equipment": [
    {
      key: "material",
      label: "Material",
      dataType: "multiSelect",
      options: opts("PET", "HDPE", "PP", "Glass", "Aluminium", "Tinplate", "Kraft paper", "Corrugated", "Laminated"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "capacity", label: "Capacity", dataType: "text", sortOrder: 20 },
    { key: "food_grade", label: "Food grade", dataType: "boolean", sortOrder: 30 },
    { key: "recyclable", label: "Recyclable", dataType: "boolean", sortOrder: 40 },
  ],
};

// ============================================================
// ۳) اتریبیوت‌های سطح زیردسته (scope: subCategory)
//    کلید = slug سطح ۲
// ============================================================
const SUBCATEGORY_ATTRS = {
  // ---------- عسل و محصولات زنبور ----------
  "honey-bee-products": [
    {
      key: "floral_source",
      label: "Floral source",
      dataType: "multiSelect",
      options: opts("Acacia", "Clover", "Wildflower", "Manuka", "Sunflower", "Orange Blossom", "Eucalyptus", "Lavender", "Thyme", "Multifloral"),
      sortOrder: 10,
      showInCard: true,
    },
    {
      key: "honey_color",
      label: "Colour",
      dataType: "select",
      options: opts("Water White", "Extra White", "White", "Extra Light Amber", "Light Amber", "Amber", "Dark Amber"),
      sortOrder: 20,
      showInCard: true,
    },
    {
      key: "honey_form",
      label: "Form",
      dataType: "select",
      options: opts("Raw", "Filtered", "Creamed", "Comb", "Chunk", "Powdered"),
      sortOrder: 30,
    },
    { key: "mgo", label: "MGO", dataType: "number", unit: "mg/kg", sortOrder: 40, showInCard: true },
    { key: "diastase", label: "Diastase number", dataType: "number", unit: "DN", sortOrder: 50 },
    { key: "hmf", label: "HMF", dataType: "number", unit: "mg/kg", sortOrder: 60 },
    { key: "raw_unfiltered", label: "Raw & unfiltered", dataType: "boolean", sortOrder: 70 },
  ],
  // ---------- شکر ----------
  sugar: [
    { key: "icumsa", label: "ICUMSA", dataType: "number", unit: "IU", sortOrder: 10, showInCard: true },
    { key: "polarization", label: "Polarization", dataType: "number", unit: "%", sortOrder: 20 },
    {
      key: "sugar_type",
      label: "Sugar type",
      dataType: "select",
      options: opts("White Refined", "Raw", "Brown", "Icing", "Liquid", "Demerara"),
      sortOrder: 30,
      showInCard: true,
    },
  ],
  // ---------- شیرین‌کننده‌های طبیعی ----------
  "natural-sweeteners": [
    { key: "glycemic_index", label: "Glycemic index", dataType: "number", sortOrder: 10 },
    { key: "calorie_free", label: "Calorie free", dataType: "boolean", sortOrder: 20, showInCard: true },
    { key: "plant_source", label: "Plant source", dataType: "text", sortOrder: 30, showInCard: true },
  ],
  // ---------- برنج ----------
  rice: [
    { key: "grain_length_mm", label: "Grain length", dataType: "number", unit: "mm", sortOrder: 10, showInCard: true },
    { key: "broken_ratio", label: "Broken ratio", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "aroma", label: "Aromatic", dataType: "boolean", sortOrder: 30 },
    {
      key: "polish",
      label: "Milling degree",
      dataType: "select",
      options: opts("White", "Parboiled", "Brown", "Semi-milled", "Paddy"),
      sortOrder: 40,
      showInCard: true,
    },
  ],
  // ---------- گندم ----------
  wheat: [
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "test_weight", label: "Test weight", dataType: "number", unit: "kg/hl", sortOrder: 20 },
    {
      key: "wheat_class",
      label: "Class",
      dataType: "select",
      options: opts("Hard Red", "Hard White", "Soft Red", "Soft White", "Durum"),
      sortOrder: 30,
      showInCard: true,
    },
    { key: "falling_number", label: "Falling number", dataType: "number", unit: "s", sortOrder: 40 },
  ],
  // ---------- آرد ----------
  "flours-milling-products": [
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 10 },
    { key: "ash_content", label: "Ash content", dataType: "number", unit: "%", sortOrder: 20 },
    { key: "extraction_rate", label: "Extraction rate", dataType: "number", unit: "%", sortOrder: 30 },
    { key: "gluten_free", label: "Gluten free", dataType: "boolean", sortOrder: 40 },
  ],
  // ---------- قهوه ----------
  coffee: [
    {
      key: "species",
      label: "Species",
      dataType: "select",
      options: opts("Arabica", "Robusta", "Liberica", "Excelsa", "Blend"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "screen_size", label: "Screen size", dataType: "number", unit: "mesh", sortOrder: 20, showInCard: true },
    { key: "defects", label: "Defects", dataType: "number", unit: "per 300g", sortOrder: 30 },
    {
      key: "roast",
      label: "Roast level",
      dataType: "select",
      options: opts("Green / Unroasted", "Light", "Medium", "Dark", "Instant / Soluble"),
      sortOrder: 40,
      showInCard: true,
    },
    { key: "altitude", label: "Growing altitude", dataType: "number", unit: "m", sortOrder: 50 },
  ],
  // ---------- چای ----------
  tea: [
    {
      key: "tea_type",
      label: "Tea type",
      dataType: "select",
      options: opts("Black", "Green", "White", "Oolong", "Pu-erh", "Herbal"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "leaf_grade", label: "Leaf grade", dataType: "text", sortOrder: 20, showInCard: true },
    { key: "altitude", label: "Growing altitude", dataType: "number", unit: "m", sortOrder: 30 },
    { key: "organic_certified", label: "Organic certified", dataType: "boolean", sortOrder: 40 },
  ],
  // ---------- کاکائو ----------
  cocoa: [
    { key: "cocoa_content", label: "Cocoa content", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "fat_content", label: "Fat content", dataType: "number", unit: "%", sortOrder: 20 },
    { key: "alkalized", label: "Alkalized", dataType: "boolean", sortOrder: 30 },
    { key: "bean_origin", label: "Bean origin", dataType: "text", sortOrder: 40 },
  ],
  // ---------- روغن زیتون و روغن‌های خاص ----------
  "specialty-oils": [
    {
      key: "olive_oil_grade",
      label: "Olive oil grade",
      dataType: "select",
      options: opts("Extra Virgin", "Virgin", "Lampante", "Refined", "Pomace", "Not applicable"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "peroxide_value", label: "Peroxide value", dataType: "number", unit: "meq O₂/kg", sortOrder: 20 },
    { key: "smoke_point", label: "Smoke point", dataType: "number", unit: "°C", sortOrder: 30 },
    { key: "single_origin", label: "Single origin", dataType: "boolean", sortOrder: 40 },
  ],
  "vegetable-oils": [
    { key: "refined", label: "Refined", dataType: "boolean", sortOrder: 10 },
    { key: "free_fatty_acid", label: "Free fatty acid", dataType: "number", unit: "%", sortOrder: 20 },
    { key: "color_lovibond", label: "Colour (Lovibond)", dataType: "text", sortOrder: 30 },
  ],
  // ---------- مغزها ----------
  "tree-nuts": [
    {
      key: "nut_type",
      label: "Nut type",
      dataType: "select",
      options: opts("Almond", "Walnut", "Pistachio", "Cashew", "Hazelnut", "Pecan", "Macadamia", "Brazil nut", "Pine nut"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "kernel_size", label: "Kernel size", dataType: "text", sortOrder: 20, showInCard: true },
    { key: "aflatoxin_tested", label: "Aflatoxin tested", dataType: "boolean", sortOrder: 30 },
    { key: "roasted", label: "Roasted", dataType: "boolean", sortOrder: 40 },
    { key: "salted", label: "Salted", dataType: "boolean", sortOrder: 50 },
  ],
  seeds: [
    { key: "seed_type", label: "Seed type", dataType: "text", sortOrder: 10, showInCard: true },
    { key: "oil_content", label: "Oil content", dataType: "number", unit: "%", sortOrder: 20 },
    { key: "hulled", label: "Hulled", dataType: "boolean", sortOrder: 30 },
  ],
  "dried-fruits": [
    { key: "fruit_type", label: "Fruit type", dataType: "text", sortOrder: 10, showInCard: true },
    { key: "sulphured", label: "Sulphured", dataType: "boolean", sortOrder: 20 },
    { key: "sugar_added", label: "Sugar added", dataType: "boolean", sortOrder: 30 },
    { key: "pitted", label: "Pitted / deseeded", dataType: "boolean", sortOrder: 40 },
  ],
  // ---------- ادویه ----------
  "whole-spices": [
    {
      key: "spice_type",
      label: "Spice",
      dataType: "select",
      options: opts("Black Pepper", "White Pepper", "Cinnamon", "Cumin", "Turmeric", "Cardamom", "Saffron", "Clove", "Nutmeg", "Ginger", "Coriander", "Paprika"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "asta_color", label: "ASTA colour", dataType: "number", sortOrder: 20, showInCard: true },
    { key: "piperine", label: "Piperine content", dataType: "number", unit: "%", sortOrder: 30 },
    { key: "stemless", label: "Stemless", dataType: "boolean", sortOrder: 40 },
  ],
  "ground-spices": [
    { key: "mesh_size", label: "Mesh size", dataType: "number", sortOrder: 10, showInCard: true },
    { key: "asta_color", label: "ASTA colour", dataType: "number", sortOrder: 20 },
    { key: "sterilized", label: "Sterilized", dataType: "boolean", sortOrder: 30 },
    { key: "irradiated", label: "Irradiated", dataType: "boolean", sortOrder: 40 },
  ],
  // ---------- لبنیات ----------
  cheese: [
    {
      key: "cheese_type",
      label: "Cheese type",
      dataType: "select",
      options: opts("Hard", "Semi-Hard", "Soft", "Blue", "Fresh", "Processed", "Stretched-curd"),
      sortOrder: 10,
      showInCard: true,
    },
    { key: "aged_months", label: "Aged", dataType: "number", unit: "months", sortOrder: 20, showInCard: true },
    { key: "fat_in_dry_matter", label: "Fat in dry matter", dataType: "number", unit: "%", sortOrder: 30 },
    { key: "rind_type", label: "Rind", dataType: "select", options: opts("Wax", "Natural", "Vacuum packed", "Rindless"), sortOrder: 40 },
  ],
  milk: [
    { key: "milk_type", label: "Milk type", dataType: "select", options: opts("Whole", "Semi-skimmed", "Skimmed", "Evaporated", "Condensed", "Powder"), sortOrder: 10, showInCard: true },
    { key: "fat_content", label: "Fat content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "uht", label: "UHT treated", dataType: "boolean", sortOrder: 30 },
  ],
  eggs: [
    { key: "egg_size", label: "Size", dataType: "select", options: opts("S", "M", "L", "XL"), sortOrder: 10, showInCard: true },
    { key: "free_range", label: "Free range", dataType: "boolean", sortOrder: 20 },
    { key: "hatching", label: "Hatching eggs", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- گوشت ----------
  beef: [
    { key: "breed", label: "Breed", dataType: "text", sortOrder: 10, showInCard: true },
    { key: "marbling", label: "Marbling", dataType: "select", options: opts("Low", "Medium", "High", "Prime"), sortOrder: 20, showInCard: true },
    { key: "grass_fed", label: "Grass fed", dataType: "boolean", sortOrder: 30 },
    { key: "aged_days", label: "Aged", dataType: "number", unit: "days", sortOrder: 40 },
  ],
  poultry: [
    { key: "poultry_type", label: "Type", dataType: "select", options: opts("Chicken", "Turkey", "Duck", "Goose", "Quail"), sortOrder: 10, showInCard: true },
    { key: "halal_slaughter", label: "Halal slaughter", dataType: "boolean", sortOrder: 20, showInCard: true },
    { key: "boneless", label: "Boneless", dataType: "boolean", sortOrder: 30 },
    { key: "weight_range", label: "Weight range", dataType: "text", sortOrder: 40 },
  ],
  // ---------- آبزیان ----------
  fish: [
    { key: "species", label: "Species", dataType: "text", sortOrder: 10, showInCard: true },
    {
      key: "fishing_area",
      label: "Fishing area",
      dataType: "select",
      options: opts("Atlantic", "Pacific", "Indian Ocean", "Mediterranean", "Persian Gulf", "Farmed", "Freshwater"),
      sortOrder: 20,
      showInCard: true,
    },
    { key: "glazing", label: "Glazing", dataType: "number", unit: "%", sortOrder: 30 },
    { key: "iqf", label: "IQF (individually quick frozen)", dataType: "boolean", sortOrder: 40 },
  ],
  shellfish: [
    { key: "shellfish_type", label: "Type", dataType: "select", options: opts("Shrimp", "Prawn", "Crab", "Lobster", "Mussel", "Oyster", "Clam", "Scallop"), sortOrder: 10, showInCard: true },
    { key: "count_per_kg", label: "Count per kg", dataType: "number", sortOrder: 20, showInCard: true },
    { key: "cooked", label: "Cooked", dataType: "boolean", sortOrder: 30 },
    { key: "peeled", label: "Peeled & deveined", dataType: "boolean", sortOrder: 40 },
  ],
  // ---------- میوه و سبزی ----------
  "fresh-fruits": [
    { key: "caliber_mm", label: "Calibre", dataType: "number", unit: "mm", sortOrder: 10, showInCard: true },
    { key: "ripeness", label: "Ripeness", dataType: "select", options: opts("Unripe", "Semi-Ripe", "Ripe", "Over-ripe"), sortOrder: 20 },
    { key: "seedless", label: "Seedless", dataType: "boolean", sortOrder: 30 },
    { key: "cold_treated", label: "Cold treated", dataType: "boolean", sortOrder: 40 },
  ],
  "fresh-vegetables": [
    { key: "caliber_mm", label: "Calibre", dataType: "number", unit: "mm", sortOrder: 10 },
    { key: "greenhouse", label: "Greenhouse grown", dataType: "boolean", sortOrder: 20 },
    { key: "topped", label: "Topped & tailed", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- نوشیدنی ----------
  "juices-nectars": [
    { key: "juice_content", label: "Juice content", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "from_concentrate", label: "From concentrate", dataType: "boolean", sortOrder: 20, showInCard: true },
    { key: "fruit_type", label: "Fruit", dataType: "text", sortOrder: 30 },
    { key: "no_added_sugar", label: "No added sugar", dataType: "boolean", sortOrder: 40 },
  ],
  water: [
    { key: "water_type", label: "Water type", dataType: "select", options: opts("Still", "Sparkling", "Mineral", "Spring", "Purified"), sortOrder: 10, showInCard: true },
    { key: "tds", label: "TDS", dataType: "number", unit: "mg/L", sortOrder: 20 },
    { key: "ph", label: "pH", dataType: "number", sortOrder: 30 },
  ],
  // ---------- حبوبات ----------
  beans: [
    { key: "bean_type", label: "Bean type", dataType: "text", sortOrder: 10, showInCard: true },
    { key: "caliber_mm", label: "Calibre", dataType: "number", unit: "mm", sortOrder: 20, showInCard: true },
    { key: "crop_year", label: "Crop year", dataType: "number", sortOrder: 30 },
  ],
  lentils: [
    { key: "lentil_type", label: "Type", dataType: "select", options: opts("Red", "Green", "Brown", "Black / Beluga", "Puy"), sortOrder: 10, showInCard: true },
    { key: "caliber_mm", label: "Calibre", dataType: "number", unit: "mm", sortOrder: 20 },
    { key: "split", label: "Split", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- نشاسته و پروتئین ----------
  starches: [
    { key: "starch_source", label: "Source", dataType: "select", options: opts("Corn", "Potato", "Wheat", "Rice", "Tapioca", "Pea"), sortOrder: 10, showInCard: true },
    { key: "viscosity", label: "Viscosity", dataType: "number", unit: "cP", sortOrder: 20 },
    { key: "modified", label: "Modified", dataType: "boolean", sortOrder: 30 },
  ],
  "protein-isolates-concentrates": [
    { key: "protein_source", label: "Source", dataType: "select", options: opts("Soy", "Pea", "Whey", "Casein", "Rice", "Wheat gluten", "Egg", "Fish"), sortOrder: 10, showInCard: true },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "form", label: "Form", dataType: "select", options: opts("Isolate", "Concentrate", "Hydrolysate", "Flour"), sortOrder: 30, showInCard: true },
  ],
  // ---------- غذای حیوانات ----------
  "poultry-feed": [
    { key: "feed_type", label: "Feed type", dataType: "select", options: opts("Starter", "Grower", "Finisher", "Layer", "Breeder"), sortOrder: 10, showInCard: true },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "medicated", label: "Medicated", dataType: "boolean", sortOrder: 30 },
  ],
  "aquaculture-feed": [
    { key: "feed_type", label: "Feed type", dataType: "select", options: opts("Starter", "Grower", "Finisher", "Broodstock"), sortOrder: 10, showInCard: true },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "sinking", label: "Sinking pellet", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- غذای حیوان خانگی ----------
  "dog-food": [
    { key: "breed_size", label: "Breed size", dataType: "select", options: opts("Small", "Medium", "Large", "All sizes"), sortOrder: 10, showInCard: true },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "grain_free", label: "Grain free", dataType: "boolean", sortOrder: 30 },
    { key: "main_ingredient", label: "Main ingredient", dataType: "text", sortOrder: 40 },
  ],
  "cat-food": [
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 10, showInCard: true },
    { key: "grain_free", label: "Grain free", dataType: "boolean", sortOrder: 20 },
    { key: "main_ingredient", label: "Main ingredient", dataType: "text", sortOrder: 30, showInCard: true },
    { key: "hairball_control", label: "Hairball control", dataType: "boolean", sortOrder: 40 },
  ],
  // ---------- پروتئین جایگزین ----------
  "plant-based-meat": [
    { key: "product_style", label: "Product style", dataType: "select", options: opts("Burger", "Sausage", "Nugget", "Mince", "Strips", "Meatball"), sortOrder: 10, showInCard: true },
    { key: "protein_content", label: "Protein content", dataType: "number", unit: "%", sortOrder: 20, showInCard: true },
    { key: "soy_free", label: "Soy free", dataType: "boolean", sortOrder: 30 },
    { key: "gluten_free", label: "Gluten free", dataType: "boolean", sortOrder: 40 },
  ],
  "plant-based-dairy": [
    { key: "base_ingredient", label: "Base", dataType: "select", options: opts("Oat", "Soy", "Almond", "Rice", "Coconut", "Cashew", "Pea"), sortOrder: 10, showInCard: true },
    { key: "sweetened", label: "Sweetened", dataType: "boolean", sortOrder: 20 },
    { key: "calcium_added", label: "Calcium added", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- غذاهای ویژه ----------
  superfoods: [
    { key: "superfood_type", label: "Type", dataType: "select", options: opts("Chia", "Quinoa", "Spirulina", "Moringa", "Acai", "Goji", "Matcha", "Hemp", "Baobab"), sortOrder: 10, showInCard: true },
    { key: "organic_certified", label: "Organic certified", dataType: "boolean", sortOrder: 20, showInCard: true },
    { key: "powder_form", label: "Powder form", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- پاستا ----------
  "pasta-noodles": [
    { key: "pasta_type", label: "Type", dataType: "select", options: opts("Durum wheat", "Egg", "Rice", "Buckwheat", "Instant noodles", "Glass noodles"), sortOrder: 10, showInCard: true },
    { key: "shape", label: "Shape", dataType: "text", sortOrder: 20, showInCard: true },
    { key: "cooking_time", label: "Cooking time", dataType: "number", unit: "min", sortOrder: 30 },
  ],
  // ---------- بسته‌بندی ----------
  "food-packaging": [
    { key: "packaging_role", label: "Role", dataType: "select", options: opts("Primary", "Secondary", "Tertiary / Transport"), sortOrder: 10, showInCard: true },
    { key: "barrier_level", label: "Barrier level", dataType: "select", options: opts("Low", "Medium", "High"), sortOrder: 20 },
    { key: "printing", label: "Printing available", dataType: "boolean", sortOrder: 30 },
  ],
  // ---------- کنسرو ----------
  "canned-preserved-foods": [
    { key: "can_type", label: "Can type", dataType: "select", options: opts("Tinplate", "Aluminium", "Glass jar", "Retort pouch", "PET"), sortOrder: 10, showInCard: true },
    { key: "brine_oil", label: "Packing medium", dataType: "select", options: opts("Water", "Brine", "Oil", "Syrup", "Tomato sauce", "Vinegar", "Natural juice"), sortOrder: 20, showInCard: true },
    { key: "drained_weight", label: "Drained weight", dataType: "number", unit: "g", sortOrder: 30 },
  ],
};

// ============================================================
// اعتبارسنجی scopeIdها با categories.json واقعی
// ============================================================
function buildValidSlugs() {
  const cat = new Set();
  const sub = new Set();
  const subDuplicates = new Set();

  for (const c of categoriesData.categories || []) {
    cat.add(c.slug || c.id);
    for (const s of c.subcategories || []) {
      const slug = s.slug || s.id;
      if (sub.has(slug)) subDuplicates.add(slug);
      sub.add(slug);
    }
  }

  return { cat, sub, subDuplicates };
}

// ============================================================
// درج/به‌روزرسانی یک اتریبیوت
//
// نکته‌ی مهم MySQL: مقدار NULL در ایندکس یکتا «متمایز» شمرده
// می‌شود، پس upsert روی scopeId=null ممکن است ردیف تکراری بسازد.
// به همین دلیل دستی find → update/create می‌کنیم.
// ============================================================
async function upsertAttr(a, scope, scopeId) {
  const data = {
    key: a.key,
    label: a.label,
    dataType: a.dataType,
    unit: a.unit,
    options: a.options,
    scope,
    scopeId,
    isFilterable: a.isFilterable,
    isRequired: a.isRequired,
    showInCard: a.showInCard,
    sortOrder: a.sortOrder,
    isActive: a.isActive,
  };

  const existing = await prisma.attributeDefinition.findFirst({
    where: { key: a.key, scope, scopeId: scopeId ?? null },
    select: { id: true },
  });

  if (DRY) return existing ? "updated" : "created";

  if (existing) {
    await prisma.attributeDefinition.update({ where: { id: existing.id }, data });
    return "updated";
  }

  await prisma.attributeDefinition.create({ data });
  return "created";
}

// ============================================================
async function main() {
  const { cat, sub, subDuplicates } = buildValidSlugs();

  console.log(
    `\n${DRY ? "🔍 DRY RUN — چیزی نوشته نمی‌شود" : "✍️  درج/به‌روزرسانی اتریبیوت‌ها"}\n`
  );

  const stat = { created: 0, updated: 0, skipped: 0 };
  const warnings = [];

  async function run(list, scope, scopeId) {
    for (const raw of list) {
      const a = def(raw);
      const r = await upsertAttr(a, scope, scopeId);
      stat[r] += 1;
      const where = scopeId ? `${scope}:${scopeId}` : scope;
      console.log(`  ${r === "created" ? "+" : "~"} ${where} → ${a.key} (${a.dataType})`);
    }
  }

  // ---------- عمومی ----------
  console.log("── Global ──");
  await run(GLOBAL_ATTRS, "global", null);

  // ---------- سطح دسته ----------
  console.log("\n── Category ──");
  for (const [scopeId, list] of Object.entries(CATEGORY_ATTRS)) {
    if (!cat.has(scopeId)) {
      warnings.push(`دسته «${scopeId}» در categories.json نیست — ${list.length} اتریبیوت رد شد`);
      stat.skipped += list.length;
      continue;
    }
    console.log(` [${scopeId}]`);
    await run(list, "category", scopeId);
  }

  // ---------- سطح زیردسته ----------
  console.log("\n── SubCategory ──");
  for (const [scopeId, list] of Object.entries(SUBCATEGORY_ATTRS)) {
    if (!sub.has(scopeId)) {
      warnings.push(`زیردسته «${scopeId}» در categories.json نیست — ${list.length} اتریبیوت رد شد`);
      stat.skipped += list.length;
      continue;
    }
    if (subDuplicates.has(scopeId)) {
      warnings.push(
        `زیردسته «${scopeId}» در چند دسته تکرار شده. تطبیق scopeId فقط با slug است (نه مسیر کامل)، پس این اتریبیوت در هر دو دسته دیده می‌شود.`
      );
    }
    console.log(` [${scopeId}]`);
    await run(list, "subCategory", scopeId);
  }

  // ---------- جمع‌بندی ----------
  console.log("\n" + "─".repeat(56));
  console.log(`  ایجاد: ${stat.created}   به‌روزرسانی: ${stat.updated}   رد: ${stat.skipped}`);
  console.log("─".repeat(56));

  if (warnings.length) {
    console.log("\n⚠️  هشدارها:");
    for (const w of warnings) console.log("   • " + w);
  }

  const total = await prisma.attributeDefinition.count();
  console.log(`\nمجموع اتریبیوت‌های موجود: ${total}`);

  console.log(`
گام‌های بعدی:
  1) /admin/attributes  → باید فهرست بالا را ببینی (scope و scopeId هرکدام)
  2) /admin/maintenance → Rebuild search indexes (تا searchText بسازد)
  3) /products/new      → دسته را تا عمق scope انتخاب کن؛ فیلدها ظاهر می‌شوند
       • اتریبیوت global     → با هر دسته‌ای دیده می‌شود
       • اتریبیوت category   → با انتخاب سطح ۱
       • اتریبیوت subCategory→ باید زیردسته هم انتخاب شود  ← بیشترین اشتباه
`);
}

main()
  .catch((e) => {
    console.error("\n❌ خطا:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
