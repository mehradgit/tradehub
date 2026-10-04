// src/lib/filters/schemas.js
// ============================================================
// اسکیمای اعلانی فیلترها
//
// تنها منبع حقیقت برای فیلترها. از همین یک فایل ساخته می‌شود:
//   • نوار فیلتر باریک  (فیلدهای primary)
//   • پنل «فیلترهای بیشتر» (همه‌ی فیلدها)
//   • شرط Prisma (buildWhere)
//
// افزودن فیلتر جدید = یک شیء اینجا. هیچ UI یا کوئری جدیدی لازم نیست.
//
// این فایل PURE است (بدون prisma) تا کلاینت هم بتواند بخواند.
// گزینه‌های وابسته به دیتابیس با optionsFrom مشخص می‌شوند و
// سمت سرور resolve می‌شوند (resolveFilterOptions).
// ============================================================

// نوع فیلدها:
//   text            → جست‌وجوی متنی روی searchableFields
//   categoryCascader→ انتخاب دسته سه‌سطحی (categoryPath)
//   multiSelect     → چند انتخابی
//   select          → تک انتخابی
//   boolean         → بله/خیر
//   numberRange     → بازه‌ی عددی (دو پارامتر)
//   number          → یک عدد با عملگر
//   date            → تاریخ (lte/gte)
//   dynamicAttributes → اتریبیوت‌های پویا (attr_<id>)
//   sort            → مرتب‌سازی

export const FILTER_SCHEMAS = {
  // ==========================================================
  // محصولات
  // ==========================================================
  products: {
    key: "products",
    label: "Products",
    path: "/products",
    searchParam: "search",
    baseWhere: { isVisible: true, status: "APPROVED" },
    searchableFields: [
      "name",
      "shortDesc",
      "fullDesc",
      "category",
      "subCategory",
      "productType",
      "origin",
      "country",
      "certifications",
      "searchText",
    ],
    defaultSort: "newest",
    sortOptions: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "price_low", label: "Price: low to high" },
      { value: "price_high", label: "Price: high to low" },
      { value: "moq_low", label: "MOQ: low to high" },
      { value: "views", label: "Most viewed" },
    ],
    fields: [
      {
        name: "search",
        type: "text",
        label: "Keyword",
        placeholder: "Search products…",
        primary: true,
      },
      {
        name: "categoryPath",
        type: "categoryCascader",
        label: "Category",
        dbField: "categoryPath",
        primary: true,
      },
      {
        name: "origin",
        type: "multiSelect",
        label: "Origin country",
        dbField: "country",
        optionsFrom: "countries",
        primary: true,
      },
      {
        name: "price",
        type: "numberRange",
        label: "Price",
        dbField: "price",
        minParam: "priceMin",
        maxParam: "priceMax",
        primary: true,
      },
      {
        name: "moq",
        type: "numberRange",
        label: "MOQ",
        dbField: "moq",
        minParam: "moqMin",
        maxParam: "moqMax",
      },
      {
        name: "leadTimeMax",
        type: "number",
        label: "Max lead time",
        dbField: "leadTime",
        op: "lte",
        unit: "days",
      },
      {
        name: "unit",
        type: "multiSelect",
        label: "Unit",
        dbField: "unit",
        optionsFrom: "units",
      },
      {
        name: "shippingTerms",
        type: "multiSelect",
        label: "Delivery terms",
        dbField: "shippingTerms",
        matchMode: "contains",
        optionsFrom: "incoterms",
      },
      {
        name: "paymentTerms",
        type: "multiSelect",
        label: "Payment terms",
        dbField: "paymentTerms",
        matchMode: "contains",
        optionsFrom: "paymentTerms",
      },
      {
        name: "packaging",
        type: "multiSelect",
        label: "Packaging",
        dbField: "packaging",
        matchMode: "contains",
        optionsFrom: "packagingTypes",
      },
      {
        name: "certifications",
        type: "multiSelect",
        label: "Certifications",
        dbField: "certifications",
        matchMode: "contains",
        optionsFrom: "certifications",
      },
      {
        name: "companyType",
        type: "multiSelect",
        label: "Supplier type",
        relation: "user",
        dbField: "businessType",
        optionsFrom: "businessTypes",
      },
      {
        name: "inStock",
        type: "boolean",
        label: "In stock only",
        dbField: "stock",
        booleanMode: "notNull",
      },
      {
        name: "attributes",
        type: "dynamicAttributes",
        label: "Specifications",
      },
      {
        name: "sort",
        type: "sort",
        label: "Sort by",
        primary: true,
        options: [],
      },
    ],
  },

  // ==========================================================
  // درخواست‌های خرید
  // ==========================================================
  requests: {
    key: "requests",
    label: "Buying Requests",
    path: "/requests",
    searchParam: "search",
    baseWhere: { isVisible: true, status: "APPROVED" },
    searchableFields: [
      "title",
      "description",
      "category",
      "subCategory",
      "productType",
      "deliveryCountry",
      "certifications",
      "searchText",
    ],
    defaultSort: "newest",
    sortOptions: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "deadline", label: "Deadline: soonest" },
      { value: "quantity_high", label: "Quantity: high to low" },
      { value: "views", label: "Most viewed" },
    ],
    fields: [
      {
        name: "search",
        type: "text",
        label: "Keyword",
        placeholder: "Search requests…",
        primary: true,
      },
      {
        name: "categoryPath",
        type: "categoryCascader",
        label: "Category",
        dbField: "categoryPath",
        primary: true,
      },
      {
        name: "deliveryCountry",
        type: "multiSelect",
        label: "Delivery country",
        dbField: "deliveryCountry",
        optionsFrom: "countries",
        primary: true,
      },
      {
        name: "isUrgent",
        type: "boolean",
        label: "Urgent only",
        dbField: "isUrgent",
        primary: true,
      },
      {
        name: "quantity",
        type: "numberRange",
        label: "Quantity",
        dbField: "quantity",
        minParam: "quantityMin",
        maxParam: "quantityMax",
      },
      {
        name: "targetPrice",
        type: "numberRange",
        label: "Target price",
        dbField: "targetPrice",
        minParam: "targetPriceMin",
        maxParam: "targetPriceMax",
      },
      {
        name: "deadline",
        type: "date",
        label: "Deadline before",
        dbField: "deadline",
        op: "lte",
      },
      {
        name: "paymentTerms",
        type: "multiSelect",
        label: "Payment terms",
        dbField: "paymentTerms",
        matchMode: "contains",
        optionsFrom: "paymentTerms",
      },
      {
        name: "shippingTerms",
        type: "multiSelect",
        label: "Delivery terms",
        dbField: "shippingTerms",
        matchMode: "contains",
        optionsFrom: "incoterms",
      },
      {
        name: "certifications",
        type: "multiSelect",
        label: "Required certifications",
        dbField: "certifications",
        matchMode: "contains",
        optionsFrom: "certifications",
      },
      {
        name: "packagingReq",
        type: "multiSelect",
        label: "Packaging",
        dbField: "packagingReq",
        matchMode: "contains",
        optionsFrom: "packagingTypes",
      },
      {
        name: "sort",
        type: "sort",
        label: "Sort by",
        primary: true,
        options: [],
      },
    ],
  },

  // ==========================================================
  // پروفایل شرکت‌ها
  // ==========================================================
  profiles: {
    key: "profiles",
    label: "Companies",
    path: "/profiles",
    searchParam: "search",
    baseWhere: { registrationComplete: true },
    searchableFields: [
      "companyName",
      "name",
      "country",
      "businessType",
      "primaryCategory",
      "bio",
    ],
    defaultSort: "newest",
    sortOptions: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "name", label: "Company name (A–Z)" },
    ],
    fields: [
      {
        name: "search",
        type: "text",
        label: "Keyword",
        placeholder: "Search companies…",
        primary: true,
      },
      {
        name: "role",
        type: "select",
        label: "Company role",
        dbField: "role",
        primary: true,
        options: [
          { value: "BUYER", label: "Buyer" },
          { value: "SUPPLIER", label: "Supplier" },
        ],
      },
      {
        name: "categoryPath",
        type: "categoryCascader",
        label: "Category",
        primary: true,
        // روی User ستونی به نام categoryPath وجود ندارد؛ شرط این فیلتر
        // به‌صورت رابطه‌ای (products / buyingRequests) در خودِ صفحه
        // اعمال می‌شود، پس موتور آن را نادیده می‌گیرد.
        manualOnly: true,
      },
      {
        name: "country",
        type: "multiSelect",
        label: "Country",
        dbField: "country",
        optionsFrom: "countries",
        primary: true,
      },
      {
        name: "businessType",
        type: "multiSelect",
        label: "Business type",
        dbField: "businessType",
        optionsFrom: "businessTypes",
      },
      {
        name: "plan",
        type: "multiSelect",
        label: "Membership plan",
        dbField: "plan",
        options: [
          { value: "FREE", label: "Free" },
          { value: "BASIC", label: "Basic" },
          { value: "BRONZE", label: "Bronze" },
          { value: "SILVER", label: "Silver" },
          { value: "GOLD", label: "Gold" },
        ],
      },
      {
        name: "hasProducts",
        type: "boolean",
        label: "Has listed products",
        relationExists: "products",
      },
      {
        name: "hasRequests",
        type: "boolean",
        label: "Has buying requests",
        relationExists: "buyingRequests",
      },
      {
        name: "sort",
        type: "sort",
        label: "Sort by",
        primary: true,
        options: [],
      },
    ],
  },
};

// ============================================================
// مرتب‌سازی → orderBy پریزما
// ============================================================
export function getOrderBy(schemaKey, sortValue) {
  const map = {
    products: {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      price_low: { price: "asc" },
      price_high: { price: "desc" },
      moq_low: { moq: "asc" },
      views: { views: "desc" },
    },
    requests: {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      deadline: { deadline: "asc" },
      quantity_high: { quantity: "desc" },
      views: { views: "desc" },
    },
    profiles: {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      name: { companyName: "asc" },
    },
  };

  const schema = FILTER_SCHEMAS[schemaKey];
  const fallback = schema?.defaultSort || "newest";
  const table = map[schemaKey] || {};

  return table[sortValue] || table[fallback] || { createdAt: "desc" };
}

// ==========================================================
// فیلدهای یک نوع
// ==========================================================
export function getPrimaryFields(schemaKey) {
  return (FILTER_SCHEMAS[schemaKey]?.fields || []).filter((f) => f.primary);
}

export function getSecondaryFields(schemaKey) {
  return (FILTER_SCHEMAS[schemaKey]?.fields || []).filter((f) => !f.primary);
}

// ==========================================================
// نگاشت مسیر صفحه → کلید اسکیما
// ==========================================================
export function schemaKeyFromPathname(pathname = "") {
  if (pathname.startsWith("/products")) return "products";
  if (pathname.startsWith("/requests")) return "requests";
  if (pathname.startsWith("/profiles")) return "profiles";
  return null;
}
