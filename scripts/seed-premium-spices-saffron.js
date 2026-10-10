
/**
 * FoodTradeLink - Premium Spices & Saffron Seed
 *
 * اجرا از ریشه پروژه:
 *   node scripts/seed-premium-spices-saffron.js --dry
 *   node scripts/seed-premium-spices-saffron.js --no-images
 *   node scripts/seed-premium-spices-saffron.js
 *
 * ایجاد ۵ شرکت و ۲۵ محصول نمونه
 * رکوردهای موجود حذف نمی‌شوند.
 */

require('dotenv').config();

const { PrismaClient, Prisma } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry');
const NO_IMAGES = args.has('--no-images');

const CATEGORY_NAME = 'Spices, Herbs & Seasonings';
const CATEGORY_SLUG = 'spices-herbs-seasonings';

const IMAGE_DIR = path.join(
  process.cwd(),
  'public',
  'uploads',
  'products'
);

const companies = [
  {
    companyName: 'Saffron Crown Exports',
    email: 'demo.saffroncrown@foodtradelink.example',
    country: 'Iran',
    countryCode: 'IR',
    city: 'Mashhad',
    businessType: 'Exporter',
    employeeCount: '11-50',
    phone: '+98 51 0000 0101',
    address: 'Mashhad, Iran',
    bio: 'A specialist supplier of Iranian saffron for international wholesale buyers.',
    products: [
      { name: 'Premium Iranian Saffron Negin', price: 1450, unit: 'kg', moq: 1 },
      { name: 'Iranian Saffron Sargol', price: 1280, unit: 'kg', moq: 1 },
      { name: 'Iranian Saffron Pushal', price: 980, unit: 'kg', moq: 1 },
      { name: 'Saffron Powder for Food Manufacturing', price: 1320, unit: 'kg', moq: 1 },
      { name: 'Saffron Gift and Retail Packs', price: 12, unit: 'box', moq: 100 },
    ],
  },
  {
    companyName: 'Persian Aroma Ingredients',
    email: 'demo.persianaroma@foodtradelink.example',
    country: 'Iran',
    countryCode: 'IR',
    city: 'Tehran',
    businessType: 'Manufacturer / Exporter',
    employeeCount: '11-50',
    phone: '+98 21 0000 0102',
    address: 'Tehran, Iran',
    bio: 'A food ingredient supplier focused on aromatic spices and practical export formats.',
    products: [
      { name: 'Ground Turmeric Powder', price: 7.5, unit: 'kg', moq: 100 },
      { name: 'Cumin Seeds', price: 8.2, unit: 'kg', moq: 100 },
      { name: 'Ground Cumin', price: 9.1, unit: 'kg', moq: 50 },
      { name: 'Dried Mint Leaves', price: 6.4, unit: 'kg', moq: 50 },
      { name: 'Sumac Powder', price: 7.8, unit: 'kg', moq: 50 },
    ],
  },
  {
    companyName: 'Anatolia Spice House',
    email: 'demo.anatoliaspice@foodtradelink.example',
    country: 'Türkiye',
    countryCode: 'TR',
    city: 'Gaziantep',
    businessType: 'Processor / Exporter',
    employeeCount: '11-50',
    phone: '+90 342 000 0103',
    address: 'Gaziantep, Türkiye',
    bio: 'A regional spice business offering Mediterranean and Middle Eastern seasonings.',
    products: [
      { name: 'Pul Biber Aleppo-Style Pepper', price: 9.8, unit: 'kg', moq: 50 },
      { name: 'Sweet Paprika Powder', price: 6.9, unit: 'kg', moq: 100 },
      { name: 'Smoked Paprika Powder', price: 8.6, unit: 'kg', moq: 50 },
      { name: 'Dried Oregano Leaves', price: 7.2, unit: 'kg', moq: 50 },
      { name: "Za'atar Seasoning Blend", price: 8.9, unit: 'kg', moq: 25 },
    ],
  },
  {
    companyName: 'Kerala Harvest Spices',
    email: 'demo.keralaharvest@foodtradelink.example',
    country: 'India',
    countryCode: 'IN',
    city: 'Kochi',
    businessType: 'Producer / Exporter',
    employeeCount: '11-50',
    phone: '+91 484 000 0104',
    address: 'Kochi, India',
    bio: 'A spice export business supplying whole spices for distributors and food producers.',
    products: [
      { name: 'Whole Black Peppercorns', price: 7.9, unit: 'kg', moq: 100 },
      { name: 'Green Cardamom Pods', price: 24.5, unit: 'kg', moq: 25 },
      { name: 'Cinnamon Quills', price: 12.8, unit: 'kg', moq: 25 },
      { name: 'Whole Cloves', price: 11.4, unit: 'kg', moq: 25 },
      { name: 'Ginger Powder', price: 6.8, unit: 'kg', moq: 50 },
    ],
  },
  {
    companyName: 'Mediterranean Herb & Spice Co.',
    email: 'demo.mediterraneanherbs@foodtradelink.example',
    country: 'Egypt',
    countryCode: 'EG',
    city: 'Cairo',
    businessType: 'Exporter',
    employeeCount: '11-50',
    phone: '+20 2 0000 0105',
    address: 'Cairo, Egypt',
    bio: 'A wholesale partner for dried culinary herbs and versatile spice ingredients.',
    products: [
      { name: 'Dried Basil Leaves', price: 5.9, unit: 'kg', moq: 50 },
      { name: 'Rosemary Leaves', price: 6.7, unit: 'kg', moq: 50 },
      { name: 'Chamomile Flowers', price: 8.5, unit: 'kg', moq: 25 },
      { name: 'Hibiscus Petals', price: 6.2, unit: 'kg', moq: 50 },
      { name: 'Mixed Italian Herb Seasoning', price: 7.4, unit: 'kg', moq: 50 },
    ],
  },
];

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function makeSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function hash(value) {
  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest('hex');
}

function stablePick(items, seed) {
  const index = parseInt(hash(seed).slice(0, 8), 16) % items.length;
  return items[index];
}

function stablePrice(base, seed) {
  const fraction = parseInt(hash(seed).slice(0, 8), 16) / 0xffffffff;
  return Math.round(base * (0.96 + fraction * 0.08) * 100) / 100;
}

function modelFields(modelName) {
  const model = Prisma.dmmf.datamodel.models.find(
    (item) => item.name === modelName
  );

  return model ? model.fields : [];
}

function hasField(modelName, fieldName) {
  return modelFields(modelName).some((field) => field.name === fieldName);
}

function fieldInfo(modelName, fieldName) {
  return modelFields(modelName).find((field) => field.name === fieldName);
}

function filterFields(modelName, data) {
  const allowed = new Set(
    modelFields(modelName).map((field) => field.name)
  );

  return Object.fromEntries(
    Object.entries(data).filter(([key]) => allowed.has(key))
  );
}

function scalarType(modelName, fieldName) {
  return fieldInfo(modelName, fieldName)?.type;
}

function makeProductNumber(number) {
  const info = fieldInfo('Product', 'productNumber');

  if (!info) return undefined;

  if (info.type === 'Int') return number;
  if (info.type === 'BigInt') return BigInt(number);
  if (info.type === 'String') return `SP-${number}`;

  return undefined;
}

function makeProfileSlug(company) {
  return makeSlug(company.companyName);
}

function makeDescriptions(product, company, index) {
  const seed = `${company.email}:${product.name}:${index}`;
  const name = product.name;

  const isSaffron = /saffron/i.test(name);
  const isPowder = /powder|ground/i.test(name);
  const isHerb =
    /mint|oregano|basil|rosemary|chamomile|hibiscus|herb|za'atar|seasoning/i.test(
      name
    );
  const isWhole =
    /whole|peppercorn|pods|quills|cloves|seeds/i.test(name);

  const introductions = [
    `${name} is offered to wholesale buyers looking for a versatile ingredient for food production, distribution and retail.`,
    `${company.companyName} presents ${name} for importers, distributors and professional food businesses.`,
    `Discover ${name}, a useful addition to spice catalogues serving food manufacturers, foodservice teams and retailers.`,
    `${name} is available for B2B enquiries from buyers looking for practical wholesale supply options.`,
  ];

  let applicationDetails;

  if (isSaffron) {
    applicationDetails = [
      'Saffron is valued for its distinctive aroma and colour in rice dishes, sauces, confectionery and premium food preparations.',
      'This saffron product may suit specialist spice retailers, hospitality buyers and manufacturers of desserts and prepared foods.',
      'Buyers can discuss grade expectations, packaging formats and order quantities directly with the supplier.',
    ];
  } else if (isPowder) {
    applicationDetails = [
      'The ground format is convenient for recipes and production lines where consistent distribution and straightforward dosing are important.',
      'Powdered spices can be used in seasoning blends, marinades, sauces, prepared foods and professional kitchens.',
      'This format can simplify batching for businesses producing spice mixes and packaged culinary ingredients.',
    ];
  } else if (isHerb) {
    applicationDetails = [
      'Dried herbs are useful in seasoning blends, sauces, marinades, soups and foodservice recipes.',
      'The product may suit herb packers, seasoning brands, restaurants and food manufacturers.',
      'Buyers can confirm preferred cut, packing size and product specifications when requesting a quotation.',
    ];
  } else if (isWhole) {
    applicationDetails = [
      'Whole spices give processors flexibility to grind, blend or use the ingredient as supplied.',
      'The whole format can suit spice grinders, blending facilities, foodservice operations and repacking businesses.',
      'Importers can discuss appearance, packing size and required specifications with the supplier.',
    ];
  } else {
    applicationDetails = [
      'The product can be considered for seasoning blends, sauces, marinades, restaurant kitchens and packaged food applications.',
      'It may suit buyers building a spice catalogue across retail, catering and ingredient supply channels.',
      'Intended application and preferred specification can be confirmed before a purchase order is placed.',
    ];
  }

  const commercialDetails = [
    'Before ordering, buyers should confirm product specifications, packaging, labelling and destination-market documentation.',
    'Commercial details such as pack sizes, lot requirements and shipping arrangements can be discussed directly with the supplier.',
    'When requesting a quote, include the destination country, estimated quantity and preferred packaging.',
    'The supplier can review requirements for product presentation and shipment planning as part of the quotation process.',
  ];

  const shortDescriptions = [
    `${name} for wholesale buyers. Ask about specifications, packaging and export terms.`,
    `${name} supplied by ${company.companyName} for distributors and food ingredient buyers.`,
    `Wholesale ${name}. Confirm current availability and shipment details with the supplier.`,
    `${name} from ${company.country}, with commercial details available on request.`,
  ];

  return {
    shortDesc: stablePick(shortDescriptions, `${seed}:short`),
    fullDesc: [
      stablePick(introductions, `${seed}:intro`),
      stablePick(applicationDetails, `${seed}:application`),
      stablePick(commercialDetails, `${seed}:commercial`),
      `Supplier: ${company.companyName}, ${company.city}, ${company.country}. Indicative minimum order quantity: ${product.moq} ${product.unit}. Request a quotation to confirm current price, availability, packaging and shipping details.`,
    ].join('\n\n'),
  };
}

/* -------------------------------------------------------
   Optional image download
------------------------------------------------------- */

function downloadBuffer(url, timeout = 20000, redirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'FoodTradeLink-DemoSeed/1.0',
        },
      },
      (res) => {
        if (
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          res.resume();

          if (redirects <= 0) {
            reject(new Error('Too many image redirects'));
            return;
          }

          const nextUrl = new URL(res.headers.location, url).toString();

          downloadBuffer(nextUrl, timeout, redirects - 1)
            .then(resolve)
            .catch(reject);

          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Image request returned HTTP ${res.statusCode}`));
          return;
        }

        const chunks = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );

    req.setTimeout(timeout, () => {
      req.destroy(new Error('Image download timed out'));
    });

    req.on('error', reject);
  });
}

async function getProductImages(product, company) {
  if (NO_IMAGES) return [];

  const filename =
    `${makeSlug(company.companyName)}-${makeSlug(product.name)}.jpg`;

  const outputPath = path.join(IMAGE_DIR, filename);

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    return [`/uploads/products/${filename}`];
  }

  // Demo placeholder image. Replace with a product-specific image URL
  // if you have licensed images for each product.
  const imageUrl =
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=82';

  try {
    const buffer = await downloadBuffer(imageUrl);

    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    return [`/uploads/products/${filename}`];
  } catch (error) {
    console.warn(`  Image skipped: ${error.message}`);
    return [];
  }
}

/* -------------------------------------------------------
   User creation/update
------------------------------------------------------- */

async function getNextProfileNumber() {
  if (!hasField('User', 'profileNumber')) return undefined;

  const aggregate = await prisma.user.aggregate({
    _max: { profileNumber: true },
  });

  const maximum = aggregate._max.profileNumber;

  return Math.max(1000, Number(maximum || 999) + 1);
}

async function makeUserData(company, profileNumber) {
  const data = {
    name: company.companyName,
    companyName: company.companyName,
    email: company.email,
    country: company.country,
    countryCode: company.countryCode,
    city: company.city,
    businessType: company.businessType,
    employeeCount: company.employeeCount,
    phone: company.phone,
    address: company.address,
    bio: company.bio,
    role: 'SUPPLIER',
    plan: 'BASIC',
    isVerified: false,
    slug: makeProfileSlug(company),
    profileNumber,
  };

  if (hasField('User', 'password')) {
    data.password = crypto.randomBytes(24).toString('hex');
  }

  if (hasField('User', 'passwordHash')) {
    data.passwordHash = crypto.randomBytes(32).toString('hex');
  }

  // Add defaults for required scalar fields that have no Prisma default.
  // @updatedAt فیلدهای را Prisma خودش پر می‌کند — رد می‌شوند
  for (const field of modelFields('User')) {
    if (
      field.isRequired &&
      !field.isList &&
      !field.isId &&
      !field.isUpdatedAt &&
      !field.hasDefaultValue &&
      field.kind === 'scalar' &&
      data[field.name] === undefined
    ) {
      if (field.name === 'profileNumber') {
        data[field.name] = profileNumber;
      } else if (field.name === 'slug') {
        data[field.name] = makeProfileSlug(company);
      } else if (field.name === 'name') {
        data[field.name] = company.companyName;
      } else if (field.name === 'email') {
        data[field.name] = company.email;
      } else if (field.name === 'role') {
        data[field.name] = 'SUPPLIER';
      } else if (field.name === 'plan') {
        data[field.name] = 'BASIC';
      } else if (field.name === 'password') {
        data[field.name] = crypto.randomBytes(24).toString('hex');
      } else if (field.name === 'passwordHash') {
        data[field.name] = crypto.randomBytes(32).toString('hex');
      } else {
        throw new Error(
          `Required User field "${field.name}" has no value. ` +
          'Add a valid value for this field in makeUserData().'
        );
      }
    }
  }

  return filterFields('User', data);
}

/* -------------------------------------------------------
   Category and product creation
------------------------------------------------------- */

async function resolveCategory() {
  if (!prisma.productCategory) return CATEGORY_NAME;

  const category = await prisma.productCategory
    .findFirst({
      where: { slug: CATEGORY_SLUG },
    })
    .catch(() => null);

  if (category) {
    return category.name || CATEGORY_NAME;
  }

  console.warn(
    `Category "${CATEGORY_SLUG}" not found. Using "${CATEGORY_NAME}" as category text.`
  );

  return CATEGORY_NAME;
}

async function getNextProductNumber() {
  if (!hasField('Product', 'productNumber')) return undefined;

  const aggregate = await prisma.product.aggregate({
    _max: { productNumber: true },
  });

  const maximum = aggregate._max.productNumber;

  return Math.max(1000, Number(maximum || 999) + 1);
}

async function createProductData({
  product,
  company,
  userId,
  categoryValue,
  productNumber,
  images,
  index,
}) {
  const descriptions = makeDescriptions(product, company, index);

  const data = {
    productNumber: makeProductNumber(productNumber),
    slug: `${makeSlug(product.name)}-${makeSlug(company.companyName)}`,
    name: product.name,
    category: categoryValue,
    subCategory: categoryValue,
    shortDesc: descriptions.shortDesc,
    fullDesc: descriptions.fullDesc,
    price: stablePrice(product.price, `${company.email}:${product.name}`),
    currency: 'USD',
    unit: product.unit,
    moq: product.moq,
    leadTime: 10,
    images,
    country: company.country,
    countryCode: company.countryCode,
    origin: company.country,
    shippingTerms: 'FOB',
    isVisible: true,
    status: 'APPROVED',
    approvedAt: new Date(),
    userId,
  };

  // Avoid sending null values into required enum fields.
  if (hasField('Product', 'productType')) {
    const info = fieldInfo('Product', 'productType');
    if (info && !info.isRequired) data.productType = null;
  }

  if (hasField('Product', 'certifications')) {
    const info = fieldInfo('Product', 'certifications');
    if (info && !info.isRequired) data.certifications = null;
  }

  if (hasField('Product', 'stock')) {
    const info = fieldInfo('Product', 'stock');
    if (info && !info.isRequired) data.stock = null;
  }

  const filtered = filterFields('Product', data);

  // Ensure every required scalar field is accounted for rather than
  // allowing Prisma to fail later with a confusing missing-field error.
  // @updatedAt فیلدهای را Prisma خودش پر می‌کند — رد می‌شوند
  for (const field of modelFields('Product')) {
    if (
      field.isRequired &&
      !field.isList &&
      !field.isId &&
      !field.isUpdatedAt &&
      !field.hasDefaultValue &&
      field.kind === 'scalar' &&
      filtered[field.name] === undefined
    ) {
      throw new Error(
        `Required Product field "${field.name}" has no value. ` +
        'Add an appropriate value in createProductData().'
      );
    }
  }

  return filtered;
}

/* -------------------------------------------------------
   Main
------------------------------------------------------- */

async function main() {
  console.log('\nFoodTradeLink | Premium Spices & Saffron');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE MODE'}`);
  console.log(`Images: ${NO_IMAGES ? 'disabled' : 'enabled'}`);
  console.log(`Companies: ${companies.length}`);
  console.log(
    `Products: ${companies.reduce((total, company) => total + company.products.length, 0)}`
  );

  if (!prisma.user || !prisma.product) {
    throw new Error('Prisma User and Product models are required.');
  }

  const categoryValue = await resolveCategory();

  let nextProfileNumber = await getNextProfileNumber();
  let nextProductNumber = await getNextProductNumber();

  let companiesCreated = 0;
  let companiesUpdated = 0;
  let productsCreated = 0;
  let productsUpdated = 0;
  let failures = 0;

  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex];

    console.log(
      `\n[${companyIndex + 1}/${companies.length}] ${company.companyName}`
    );

    try {
      let user = await prisma.user.findUnique({
        where: { email: company.email },
      });

      if (user) {
        console.log('  Supplier account already exists.');

        if (!DRY_RUN) {
          const userData = await makeUserData(
            company,
            user.profileNumber ?? nextProfileNumber
          );

          user = await prisma.user.update({
            where: { id: user.id },
            data: userData,
          });

          companiesUpdated++;
        }
      } else if (DRY_RUN) {
        console.log('  Would create supplier account.');
        user = {
          id: `dry-user-${companyIndex}`,
          email: company.email,
        };

        if (nextProfileNumber !== undefined) nextProfileNumber++;
      } else {
        const userData = await makeUserData(company, nextProfileNumber);

        user = await prisma.user.create({
          data: userData,
        });

        companiesCreated++;

        if (nextProfileNumber !== undefined) nextProfileNumber++;

        console.log(`  Supplier account created: ${company.email}`);
      }

      for (let productIndex = 0; productIndex < company.products.length; productIndex++) {
        const product = company.products[productIndex];

        try {
          const existing = await prisma.product.findFirst({
            where: {
              userId: user.id,
              name: product.name,
            },
            select: { id: true },
          }).catch(() => null);

          const images = await getProductImages(product, company);

          if (existing) {
            if (!DRY_RUN) {
              const description = makeDescriptions(
                product,
                company,
                productIndex
              );

              const updateData = {
                shortDesc: description.shortDesc,
                fullDesc: description.fullDesc,
              };

              if (!NO_IMAGES && images.length > 0) {
                updateData.images = images;
              }

              await prisma.product.update({
                where: { id: existing.id },
                data: filterFields('Product', updateData),
              });
            }

            productsUpdated++;
            console.log(`  Refreshed: ${product.name}`);
            continue;
          }

          if (DRY_RUN) {
            productsCreated++;
            console.log(`  Would create: ${product.name}`);

            if (nextProductNumber !== undefined) nextProductNumber++;
            continue;
          }

          const data = await createProductData({
            product,
            company,
            userId: user.id,
            categoryValue,
            productNumber: nextProductNumber,
            images,
            index: productIndex,
          });

          await prisma.product.create({ data });

          productsCreated++;

          if (nextProductNumber !== undefined) nextProductNumber++;

          console.log(`  Created: ${product.name}`);
        } catch (error) {
          failures++;
          console.error(
            `  PRODUCT FAILED: ${product.name}\n  ${error.message}`
          );
        }
      }
    } catch (error) {
      failures++;
      console.error(
        `  COMPANY FAILED: ${company.companyName}\n  ${error.message}`
      );
    }
  }

  console.log('\n========== SUMMARY ==========');
  console.log(`Companies created: ${companiesCreated}`);
  console.log(`Companies updated: ${companiesUpdated}`);
  console.log(`Products created/planned: ${productsCreated}`);
  console.log(`Products refreshed: ${productsUpdated}`);
  console.log(`Failures: ${failures}`);
  console.log('=============================');

  if (failures > 0) {
    console.warn(
      'Some records failed. Read the error above; your Prisma schema may require additional fields or enum values.'
    );
  }

  console.log(
    '\nNote: these are demo suppliers. Their .example email addresses are not real contacts.'
  );
}

main()
  .catch((error) => {
    console.error('\nSEED FAILED:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });