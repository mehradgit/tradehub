// scripts/seed-30-suppliers-complete.js
// ============================================================
// FoodTradeLink
// Seed 30 Suppliers + Products + Images
//
// ویژگی‌های این نسخه:
// - Company Bio متفاوت برای هر شرکت
// - Product Short Description متفاوت
// - Product Full Description متفاوت
// - متن تخصصی بر اساس Category و نوع محصول
// - استفاده از اطلاعات واقعی companies.js و product-pools.js
// - متن‌ها deterministic هستند؛ هر بار اجرا بی‌دلیل تغییر نمی‌کنند
// - محصولات و شرکت‌های موجود نیز می‌توانند Description جدید بگیرند
//
// اجرا:
//
//   node scripts/seed-30-suppliers-complete.js --dry
//   node scripts/seed-30-suppliers-complete.js
//   node scripts/seed-30-suppliers-complete.js --images-only
//   node scripts/seed-30-suppliers-complete.js --no-images
//
// ============================================================

require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const http = require("http");

const { companies } = require("./companies");
const { productPools } = require("./product-pools");

const prisma = new PrismaClient();

// ============================================================
// CONFIG
// ============================================================

const CONFIG = {
  concurrency: 4,

  imageTimeout: 25000,

  maxRetries: 3,

  retryBackoff: 1500,

  galleryPerCompany: 6,

  imagesPerProduct: 6,

  productPriceJitter: 0.12,

  // اگر true باشد Description شرکت‌ها و محصولات موجود
  // نیز بازسازی می‌شوند.
  refreshDescriptions: true,

  sizes: {
    logo: {
      w: 400,
      h: 400,
    },

    cover: {
      w: 1200,
      h: 400,
    },

    gallery: {
      w: 800,
      h: 600,
    },

    product: {
      w: 800,
      h: 600,
    },
  },
};

// ============================================================
// PATHS
// ============================================================

const UPLOADS_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads"
);

const PROFILE_DIR = path.join(
  UPLOADS_ROOT,
  "profiles"
);

const PRODUCT_DIR = path.join(
  UPLOADS_ROOT,
  "products"
);

// ============================================================
// ARGUMENTS
// ============================================================

const ARGS = process.argv.slice(2);

const DRY = ARGS.includes("--dry");

const NO_IMAGES = ARGS.includes("--no-images");

const IMAGES_ONLY = ARGS.includes("--images-only");

// ============================================================
// GENERAL HELPERS
// ============================================================

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function shortHash(input) {
  return crypto
    .createHash("md5")
    .update(String(input))
    .digest("hex")
    .slice(0, 8);
}

function numericHash(input) {
  return parseInt(shortHash(input), 16);
}

function pickDeterministic(items, seed) {
  if (!items || items.length === 0) {
    return null;
  }

  return items[
    numericHash(seed) % items.length
  ];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlParagraphs(paragraphs) {
  return paragraphs
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join("");
}

// ============================================================
// UNIQUE NUMBERS
// ============================================================

function generateProfileNumber(existing) {
  let n;

  do {
    n =
      Math.floor(
        Math.random() * 9000000
      ) + 1000000;
  } while (existing.has(n));

  existing.add(n);

  return n;
}

function generateProductNumber(existing) {
  let n;

  do {
    n =
      Math.floor(
        Math.random() * 9000000
      ) + 1000000;
  } while (existing.has(n));

  existing.add(n);

  return n;
}

// ============================================================
// FILE HELPERS
// ============================================================

async function ensureDir(dir) {
  await fs.mkdir(dir, {
    recursive: true,
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// COMPANY DESCRIPTION ENGINE
// ============================================================

function getCompanyMeta(company) {
  const social =
    company.socialLinks || {};

  return {
    city: company.city || "",

    country: company.country || "",

    businessType:
      company.businessType ||
      "Food Supplier",

    employeeCount:
      company.employeeCount || "",

    category:
      company.primaryCategory || "",

    subCategory:
      company.primarySubCategory || "",

    certifications:
      social.certifications || "",

    marketsCovered:
      social.marketsCovered || "",

    domesticMarkets:
      social.domesticMarkets || "",

    establishedYear:
      social.establishedYear || "",

    contactPerson:
      social.contactPerson ||
      company.name ||
      "",
  };
}

function categoryLabel(category) {
  const labels = {
    "nuts-seeds-dried-fruits":
      "dates, dried fruits, nuts and seeds",

    "oils-fats-shortenings":
      "olive oils and specialty oil products",

    "fruits-vegetables":
      "fresh and frozen fruits and vegetables",
  };

  return (
    labels[category] ||
    "food products"
  );
}

function companyRoleSentence(company) {
  const meta =
    getCompanyMeta(company);

  const type =
    meta.businessType.toLowerCase();

  if (
    type.includes("manufacturer")
  ) {
    return `
      <strong>${escapeHtml(
        company.companyName
      )}</strong> operates as a
      manufacturer-oriented food business,
      with its portfolio focused on
      ${escapeHtml(
        categoryLabel(meta.category)
      )}.
    `;
  }

  if (
    type.includes("producer") ||
    type.includes("farm")
  ) {
    return `
      <strong>${escapeHtml(
        company.companyName
      )}</strong> is a producer-focused
      food business based in
      ${escapeHtml(meta.city)},
      ${escapeHtml(meta.country)},
      specializing in
      ${escapeHtml(
        categoryLabel(meta.category)
      )}.
    `;
  }

  if (
    type.includes("distributor")
  ) {
    return `
      <strong>${escapeHtml(
        company.companyName
      )}</strong> serves the market as
      a distributor, connecting
      commercial buyers with
      ${escapeHtml(
        categoryLabel(meta.category)
      )}.
    `;
  }

  if (
    type.includes("trading")
  ) {
    return `
      <strong>${escapeHtml(
        company.companyName
      )}</strong> is a trading business
      focused on sourcing and supplying
      ${escapeHtml(
        categoryLabel(meta.category)
      )} for B2B buyers.
    `;
  }

  return `
    <strong>${escapeHtml(
      company.companyName
    )}</strong> is a B2B food supplier
    based in
    ${escapeHtml(meta.city)},
    ${escapeHtml(meta.country)},
    with a focus on
    ${escapeHtml(
      categoryLabel(meta.category)
    )}.
  `;
}

// ============================================================
// COMPANY BIO
// ============================================================

function buildCompanyBio(company) {
  const meta =
    getCompanyMeta(company);

  const seed =
    company.email ||
    company.companyName;

  const markets =
    meta.marketsCovered
      ? `
        Its stated market coverage includes
        ${escapeHtml(
          meta.marketsCovered
        )}.
      `
      : `
        The company is positioned to work
        with international B2B buyers.
      `;

  const certifications =
    meta.certifications
      ? `
        The supplier lists
        <strong>${escapeHtml(
          meta.certifications
        )}</strong>
        among its certifications or
        compliance credentials.
      `
      : `
        Certification and documentation
        requirements can be discussed with
        buyers according to the destination
        market.
      `;

  const established =
    meta.establishedYear
      ? `
        Established in
        ${escapeHtml(
          meta.establishedYear
        )},
      `
      : "";

  const styles = [
    "export",
    "specialist",
    "buyer",
    "origin",
    "commercial",
    "quality",
    "privateLabel",
    "regional",
  ];

  const style =
    pickDeterministic(
      styles,
      seed
    );

  const opening =
    companyRoleSentence(company);

  switch (style) {
    // --------------------------------------------------------
    case "export":

      return htmlParagraphs([
        `
          ${opening}
          ${established}
          the company presents its portfolio
          with an export-oriented approach,
          making it relevant to importers,
          wholesalers, distributors and
          professional food buyers.
        `,

        `
          ${markets}
          Its profile combines product
          specialization with a commercial
          focus on repeat B2B supply,
          allowing buyers to evaluate
          products, quantities and
          destination-market requirements.
        `,

        `
          ${certifications}
          ${
            meta.employeeCount
              ? `The company reports an
                 employee range of
                 ${escapeHtml(
                   meta.employeeCount
                 )}.`
              : ""
          }
        `,

        `
          For international buyers, the
          main value of working with
          <strong>${escapeHtml(
            company.companyName
          )}</strong>
          is the ability to communicate
          directly with the supplier about
          product specifications, packaging,
          documentation and shipping.
        `,
      ]);

    // --------------------------------------------------------
    case "specialist":

      return htmlParagraphs([
        `
          ${opening}
          Rather than presenting a broad
          general-food catalogue, its
          profile is built around a defined
          product segment within
          ${escapeHtml(
            categoryLabel(meta.category)
          )}.
        `,

        `
          Operating from
          ${escapeHtml(meta.city)},
          ${escapeHtml(meta.country)},
          the supplier can be evaluated by
          buyers looking for a focused
          sourcing partner.
        `,

        `
          The supplier profile highlights
          ${escapeHtml(
            meta.subCategory ||
              categoryLabel(
                meta.category
              )
          )}
          as its primary area of activity.
          ${markets}
        `,

        `
          ${certifications}
          Buyers can compare the available
          products and continue the
          conversation around quantities,
          packaging and export requirements.
        `,
      ]);

    // --------------------------------------------------------
    case "buyer":

      return htmlParagraphs([
        `
          ${opening}
          Its profile is structured around
          the needs of professional buyers
          who may be comparing several
          sources before placing an order.
        `,

        `
          For an importer or distributor,
          the combination of
          ${escapeHtml(
            meta.subCategory ||
              categoryLabel(
                meta.category
              )
          )},
          stated market coverage and
          supplier information provides a
          practical starting point for
          supplier qualification.
        `,

        `
          ${markets}
          ${
            meta.domesticMarkets
              ? `Its listed domestic markets
                 include
                 ${escapeHtml(
                   meta.domesticMarkets
                 )}.`
              : ""
          }
        `,

        `
          Buyers can contact the company
          to clarify product specifications,
          commercial quantities, packaging,
          documentation and shipment terms.
        `,
      ]);

    // --------------------------------------------------------
    case "origin":

      return htmlParagraphs([
        `
          ${opening}
          The company's location is an
          important part of its supplier
          profile, placing its products
          within the commercial context of
          ${escapeHtml(
            meta.city
          )},
          ${escapeHtml(
            meta.country
          )}.
        `,

        `
          Its catalogue is focused on
          ${escapeHtml(
            categoryLabel(
              meta.category
            )
          )},
          giving buyers a direct route to
          products associated with the
          supplier's stated region.
        `,

        `
          ${markets}
          ${certifications}
        `,

        `
          This makes the profile particularly
          useful for importers who want to
          compare origin, supplier type,
          product range and commercial
          requirements.
        `,
      ]);

    // --------------------------------------------------------
    case "commercial":

      return htmlParagraphs([
        `
          ${opening}
          Its presentation is aimed at
          practical B2B sourcing rather than
          consumer-facing retail, with
          emphasis on commercial product
          availability and supplier-to-buyer
          communication.
        `,

        `
          The company can be relevant to
          wholesalers, distributors,
          foodservice operators, retailers
          and other businesses looking for
          ${escapeHtml(
            categoryLabel(
              meta.category
            )
          )}.
        `,

        `
          ${markets}
          ${
            meta.employeeCount
              ? `The supplier reports
                 ${escapeHtml(
                   meta.employeeCount
                 )} employees.`
              : ""
          }
        `,

        `
          Commercial discussions may cover
          order volume, product specifications,
          packaging, private-label requirements
          where applicable, documentation and
          shipping arrangements.
        `,
      ]);

    // --------------------------------------------------------
    case "quality":

      return htmlParagraphs([
        `
          ${opening}
          Quality and supplier transparency
          are important considerations for
          B2B buyers evaluating a food source,
          so the profile highlights the
          company's product category,
          operating location and available
          credentials.
        `,

        `
          ${certifications}
          ${markets}
        `,

        `
          The supplier's product range gives
          buyers an opportunity to compare
          individual items rather than relying
          only on a general company
          introduction.
        `,

        `
          For repeat procurement, buyers can
          discuss specifications, packaging,
          documentation and shipment
          requirements directly with the
          company.
        `,
      ]);

    // --------------------------------------------------------
    case "privateLabel":

      return htmlParagraphs([
        `
          ${opening}
          The profile is particularly relevant
          to businesses that need a supplier
          capable of supporting a defined
          commercial product program.
        `,

        `
          Depending on the individual product
          and commercial arrangement, buyers
          may discuss bulk supply, packaging
          configurations, labeling requirements
          and private-label opportunities
          directly with the supplier.
        `,

        `
          ${markets}
          ${certifications}
        `,

        `
          This makes
          <strong>${escapeHtml(
            company.companyName
          )}</strong>
          a useful option for importers and
          distributors building or expanding
          a food-product portfolio.
        `,
      ]);

    // --------------------------------------------------------
    case "regional":

    default:

      return htmlParagraphs([
        `
          ${opening}
          The supplier's location, business
          type and product specialization
          together provide context for buyers
          assessing potential sourcing partners.
        `,

        `
          Based in
          ${escapeHtml(meta.city)},
          ${escapeHtml(meta.country)},
          the company focuses on
          ${escapeHtml(
            meta.subCategory ||
              categoryLabel(
                meta.category
              )
          )}.
        `,

        `
          ${markets}
          ${
            meta.domesticMarkets
              ? `Its domestic market information
                 lists
                 ${escapeHtml(
                   meta.domesticMarkets
                 )}.`
              : ""
          }
        `,

        `
          ${certifications}
          Buyers can use the profile as a
          starting point for direct discussions
          about products, order volumes,
          packaging, documentation and
          delivery terms.
        `,
      ]);
  }
}

// ============================================================
// PRODUCT TRAITS
// ============================================================

function getProductTraits(
  product,
  company
) {
  const name =
    cleanText(
      product.name
    ).toLowerCase();

  const keywords =
    cleanText(
      product.keywords
    ).toLowerCase();

  const text =
    `${name} ${keywords}`;

  return {
    category:
      company.primaryCategory,

    unit:
      product.unit,

    moq:
      product.moq,

    price:
      product.price,

    isDate:
      /date|dates|ajwa|medjool|sukkary|deglet|siwa|barhi|khalas/.test(
        text
      ),

    isNut:
      /almond|pistachio|walnut|cashew|hazelnut|pine nut|mixed nuts/.test(
        text
      ),

    isSeed:
      /sesame|sunflower|seed/.test(
        text
      ),

    isDriedFruit:
      /raisin|prune|mango|cranberr|mulberr|papaya|banana|tomato|dried/.test(
        text
      ),

    isEvoo:
      /evoo|extra virgin|early harvest|high polyphenol|single origin|pdo/.test(
        text
      ),

    isOliveOil:
      /olive oil|pomace|virgin olive|refined olive/.test(
        text
      ),

    isOlive:
      /olives|olive tapenade/.test(
        text
      ),

    isArgan:
      /argan/.test(
        text
      ),

    isPrivateLabel:
      /private label/.test(
        text
      ),

    isBulk:
      /bulk|ibc/.test(
        text
      ),

    isCitrus:
      /orange|mandarin|clementine|lemon|grapefruit/.test(
        text
      ),

    isBerry:
      /strawberr/.test(
        text
      ),

    isRoot:
      /potato|onion/.test(
        text
      ),

    isTomato:
      /tomato/.test(
        text
      ),

    isVegetable:
      /bean|zucchini|cucumber|pepper|eggplant|herbs/.test(
        text
      ),

    isStoneFruit:
      /peach|nectarine|plum|fig/.test(
        text
      ),

    isMelon:
      /watermelon|melon/.test(
        text
      ),

    isGrape:
      /grape/.test(
        text
      ),

    isPomegranate:
      /pomegranate/.test(
        text
      ),

    isTropical:
      /avocado|mango/.test(
        text
      ),

    isFrozen:
      /iqf|frozen/.test(
        text
      ),

    isFresh:
      company.primaryCategory ===
        "fruits-vegetables" &&
      !/dried/.test(text),
  };
}

// ============================================================
// PRODUCT AUDIENCE
// ============================================================

function productAudience(traits) {
  if (traits.isPrivateLabel) {
    return `
      importers and distributors developing
      their own branded food range
    `;
  }

  if (traits.isBulk) {
    return `
      industrial buyers, large distributors
      and high-volume import programs
    `;
  }

  if (traits.isFresh) {
    return `
      fresh-produce importers, wholesalers,
      supermarket suppliers and foodservice
      distributors
    `;
  }

  if (
    traits.isDate ||
    traits.isNut ||
    traits.isDriedFruit ||
    traits.isSeed
  ) {
    return `
      wholesalers, specialty food
      distributors, retailers and food
      manufacturers
    `;
  }

  if (
    traits.isOliveOil ||
    traits.isArgan
  ) {
    return `
      importers, retail brands,
      foodservice distributors and
      specialty-food businesses
    `;
  }

  return `
    professional food importers,
    distributors and commercial buyers
  `;
}

// ============================================================
// PRODUCT OPENING
// ============================================================

function productOpening(
  product,
  company,
  traits
) {
  const p =
    escapeHtml(
      product.name
    );

  const c =
    escapeHtml(
      company.companyName
    );

  const country =
    escapeHtml(
      company.country
    );

  if (traits.isDate) {
    return `
      <strong>${p}</strong> is presented
      by ${c} in ${country} as a
      commercially positioned date product
      for ${productAudience(traits)}.
    `;
  }

  if (traits.isNut) {
    return `
      <strong>${p}</strong> is a nut
      product offered by ${c}, suitable
      for buyers sourcing ingredients or
      finished nut products for
      ${productAudience(traits)}.
    `;
  }

  if (traits.isSeed) {
    return `
      <strong>${p}</strong> is supplied
      through ${c}'s ${country}-based
      food portfolio, with a format suited
      to bulk ingredient and distribution
      buyers.
    `;
  }

  if (traits.isDriedFruit) {
    return `
      <strong>${p}</strong> is part of
      ${c}'s dried-food offering, giving
      ${productAudience(traits)}
      an option for commercial sourcing
      from ${country}.
    `;
  }

  if (traits.isEvoo) {
    return `
      <strong>${p}</strong> is positioned
      as a specialty olive-oil product
      from ${c}, aimed at buyers looking
      for a defined EVOO proposition.
    `;
  }

  if (traits.isOliveOil) {
    return `
      <strong>${p}</strong> is included
      in ${c}'s olive-oil range for
      professional buyers seeking a
      practical source from ${country}.
    `;
  }

  if (traits.isOlive) {
    return `
      <strong>${p}</strong> is a prepared
      olive-based product offered for
      commercial food distribution and
      specialty-food channels.
    `;
  }

  if (traits.isArgan) {
    return `
      <strong>${p}</strong> is an
      argan-oil product in ${c}'s
      portfolio, intended for professional
      buyers evaluating the listed product
      grade and application.
    `;
  }

  if (traits.isCitrus) {
    return `
      <strong>${p}</strong> is a fresh
      citrus item offered by ${c} for
      international produce sourcing
      programs.
    `;
  }

  if (traits.isBerry) {
    return `
      <strong>${p}</strong> is a strawberry
      product designed for buyers sourcing
      fresh or frozen formats according to
      the listed specification.
    `;
  }

  if (traits.isFrozen) {
    return `
      <strong>${p}</strong> is a frozen
      produce option supplied through
      ${c}'s food portfolio, suitable for
      commercial frozen-food programs.
    `;
  }

  if (traits.isRoot) {
    return `
      <strong>${p}</strong> is a commercial
      fresh-produce item offered for
      wholesale and distribution channels.
    `;
  }

  if (
    traits.isVegetable ||
    traits.isTomato
  ) {
    return `
      <strong>${p}</strong> is part of
      ${c}'s fresh-produce selection,
      aimed at commercial buyers looking
      for consistent supply.
    `;
  }

  if (
    traits.isStoneFruit ||
    traits.isMelon ||
    traits.isGrape ||
    traits.isPomegranate ||
    traits.isTropical
  ) {
    return `
      <strong>${p}</strong> is offered as
      part of ${c}'s international
      fresh-produce portfolio, with a
      commercial focus on wholesale and
      distribution buyers.
    `;
  }

  return `
    <strong>${p}</strong> is supplied by
    ${c} in ${country} for professional
    food buyers seeking commercial
    quantities and direct supplier
    communication.
  `;
}

// ============================================================
// PRODUCT CHARACTERISTICS
// ============================================================

function productCharacteristics(
  product,
  traits
) {
  const p =
    escapeHtml(
      product.name
    );

  if (traits.isDate) {
    if (
      /jumbo|large/i.test(
        product.name
      )
    ) {
      return `
        Its larger-format positioning
        makes it a natural fit for premium
        retail, gifting and specialty-food
        programs.
      `;
    }

    if (
      /organic/i.test(
        product.name
      )
    ) {
      return `
        The organic positioning gives buyers
        a differentiated proposition for
        natural and organic food channels.
      `;
    }

    if (
      /paste|syrup/i.test(
        product.name
      )
    ) {
      return `
        This is a processed date ingredient
        rather than a whole-date format,
        making it relevant to food
        manufacturers, bakeries,
        confectionery businesses and
        ingredient distributors.
      `;
    }

    return `
      ${p} gives buyers a defined date
      variety or format to evaluate within
      the supplier's wider dried-fruit
      portfolio.
    `;
  }

  if (traits.isNut) {
    if (
      /roasted|salted/i.test(
        product.name
      )
    ) {
      return `
        The roasted and/or salted format
        makes it relevant to snack brands,
        retail packs, hospitality and
        ready-to-sell nut programs.
      `;
    }

    if (
      /raw/i.test(
        product.name
      )
    ) {
      return `
        The raw format is particularly
        relevant where buyers need nuts as
        a direct ingredient for further
        processing, roasting or repacking.
      `;
    }

    return `
      ${p} can be considered both as a
      finished nut product and as a
      commercial ingredient, depending on
      packaging and processing requirements.
    `;
  }

  if (traits.isSeed) {
    return `
      ${p} is positioned as a bulk-friendly
      seed ingredient for food manufacturing,
      bakery, snack production, retail
      packing and wholesale distribution.
    `;
  }

  if (traits.isDriedFruit) {
    if (
      /freeze/i.test(
        product.name
      )
    ) {
      return `
        The freeze-dried format provides
        a lightweight dried-fruit option
        for specialty foods, toppings,
        snacks and ingredient applications.
      `;
    }

    if (
      /powder/i.test(
        product.name
      )
    ) {
      return `
        The powder format is suited to
        ingredient applications where a
        concentrated dried-fruit form is
        more practical than whole or sliced
        fruit.
      `;
    }

    return `
      The dried format is suitable for
      retail snack, ingredient, bakery and
      foodservice applications where a
      shelf-stable fruit format is preferred.
    `;
  }

  if (traits.isEvoo) {
    if (
      /organic/i.test(
        product.name
      )
    ) {
      return `
        The organic positioning makes it
        relevant to buyers building premium
        or organic olive-oil selections.
      `;
    }

    if (
      /early harvest/i.test(
        product.name
      )
    ) {
      return `
        The early-harvest positioning gives
        the product a premium proposition for
        specialty retail and gourmet channels.
      `;
    }

    if (
      /polyphenol/i.test(
        product.name
      )
    ) {
      return `
        Its high-polyphenol positioning
        provides a differentiated specification
        for premium and specialty olive-oil
        buyers.
      `;
    }

    if (
      /pdo/i.test(
        product.name
      )
    ) {
      return `
        The PDO positioning can be valuable
        to buyers seeking a geographically
        defined olive-oil proposition.
      `;
    }

    return `
      The EVOO format is suitable for
      premium retail, foodservice and
      specialty-food distribution.
    `;
  }

  if (traits.isOliveOil) {
    return `
      ${p} provides a practical olive-oil
      option for foodservice, retail and
      ingredient-oriented purchasing programs.
    `;
  }

  if (traits.isOlive) {
    return `
      The prepared olive format is suitable
      for specialty retail, foodservice,
      Mediterranean-food distributors and
      ingredient-oriented buyers.
    `;
  }

  if (traits.isArgan) {
    if (
      /cosmetic/i.test(
        product.name
      )
    ) {
      return `
        The cosmetic-grade positioning makes
        this product relevant to personal-care
        brands, cosmetic manufacturers and
        specialty distributors.
      `;
    }

    return `
      The food-grade positioning makes it
      relevant to gourmet food businesses
      and specialty ingredient buyers.
    `;
  }

  if (
    traits.category ===
    "fruits-vegetables"
  ) {
    if (traits.isFresh) {
      if (traits.isCitrus) {
        return `
          As a fresh citrus item, it is
          suited to wholesale produce programs,
          retail supply and foodservice
          distribution where harvest timing
          and destination requirements matter.
        `;
      }

      if (traits.isFrozen) {
        return `
          The frozen format provides buyers
          with a commercial option for
          foodservice, processing and
          distribution programs.
        `;
      }

      return `
        The fresh format is suited to
        wholesale distribution, supermarket
        supply, foodservice and other
        commercial produce channels.
      `;
    }
  }

  return `
    ${p} is presented as a commercial
    food item with specifications that can
    be reviewed directly with the supplier
    before order confirmation.
  `;
}

// ============================================================
// PRODUCT COMMERCIAL USE
// ============================================================

function productCommercialUse(
  product,
  company,
  traits
) {
  const audience =
    productAudience(traits);

  const moq =
    escapeHtml(
      product.moq
    );

  const unit =
    escapeHtml(
      product.unit
    );

  const variants = [
    `
      ${audience} can evaluate this product
      for recurring procurement, wholesale
      distribution and destination-market
      programs. The listed minimum order
      quantity is ${moq} ${unit}.
    `,

    `
      From a commercial perspective,
      the product is best suited to
      ${audience}. The current catalogue
      lists an MOQ of ${moq} ${unit}.
    `,

    `
      The product can fit several B2B
      channels, including ${audience}.
      Buyers should use the listed MOQ of
      ${moq} ${unit} as the initial
      reference for an enquiry.
    `,
  ];

  return pickDeterministic(
    variants,
    `${company.email}:${product.name}:commercial`
  );
}

// ============================================================
// PACKAGING
// ============================================================

function packagingParagraph(
  product,
  company,
  traits
) {
  const seed =
    `${company.email}:${product.name}:packaging`;

  if (traits.isPrivateLabel) {
    return `
      Because the product is positioned
      around private-label supply, buyers
      can discuss brand presentation,
      labeling, pack size and shipment
      configuration directly with
      ${escapeHtml(
        company.companyName
      )}.
    `;
  }

  if (traits.isFresh) {
    return pickDeterministic(
      [
        `
          For fresh-produce orders, buyers
          can confirm carton, crate, pallet,
          sizing and destination-market
          requirements directly with the
          supplier before shipment.
        `,

        `
          Packaging and produce-handling
          specifications should be agreed
          with the supplier according to
          destination, product size, season
          and distribution channel.
        `,

        `
          Fresh-produce buyers can discuss
          packing format, grading, pallet
          configuration and destination
          requirements as part of the
          commercial enquiry.
        `,
      ],
      seed
    );
  }

  if (traits.isBulk) {
    return `
      The bulk format is intended for
      higher-volume procurement. Buyers
      can confirm container configuration,
      packaging, labeling and shipment
      documentation directly with the
      supplier.
    `;
  }

  return pickDeterministic(
    [
      `
        Packaging, labeling and private-label
        options can be discussed directly with
        the supplier according to the
        destination market and order volume.
      `,

      `
        Buyers can request available pack
        sizes, labeling formats and export
        documentation when opening a
        commercial enquiry.
      `,

      `
        The final packaging configuration
        can be aligned with the buyer's market,
        sales channel and required order
        volume.
      `,

      `
        For repeat B2B orders, buyers can
        discuss retail packs, bulk formats
        or customized presentation directly
        with the supplier.
      `,
    ],
    seed
  );
}

// ============================================================
// SHIPPING
// ============================================================

function shippingParagraph(
  company
) {
  const meta =
    getCompanyMeta(company);

  const markets =
    meta.marketsCovered
      ? `
        The supplier lists market coverage
        across
        ${escapeHtml(
          meta.marketsCovered
        )}.
      `
      : `
        International market coverage
        should be confirmed directly with
        the supplier.
      `;

  const variants = [
    `
      ${markets}
      Shipping terms are listed as FOB
      in the product record, while other
      arrangements such as CIF or CFR can
      be discussed where commercially
      available.
    `,

    `
      The catalogue uses FOB as the
      default shipping term. Buyers can
      confirm destination port, documentation
      and any alternative freight arrangement
      directly with the supplier.
    `,

    `
      For export enquiries, buyers should
      confirm the destination, preferred
      Incoterm, documentation package and
      shipment schedule with the supplier
      before placing an order.
    `,
  ];

  return pickDeterministic(
    variants,
    `${company.email}:shipping`
  );
}

// ============================================================
// CERTIFICATIONS
// ============================================================

function certificationParagraph(
  company
) {
  const meta =
    getCompanyMeta(company);

  if (meta.certifications) {
    return `
      The supplier profile lists
      <strong>${escapeHtml(
        meta.certifications
      )}</strong>.
      Buyers should verify which
      certifications apply specifically
      to the selected product and
      destination market.
    `;
  }

  return `
    Product-specific certifications and
    documentation should be confirmed
    directly with the supplier according
    to the buyer's destination-market
    requirements.
  `;
}

// ============================================================
// PRODUCT SHORT DESCRIPTION
// ============================================================

function buildProductShortDescription(
  product,
  company
) {
  const traits =
    getProductTraits(
      product,
      company
    );

  const p =
    escapeHtml(
      product.name
    );

  const c =
    escapeHtml(
      company.companyName
    );

  let options = [];

  if (traits.isDate) {
    options = [
      `${p} for wholesale, retail and specialty-date distribution.`,

      `Commercial ${p} supplied for international B2B buyers.`,

      `${p} positioned for distributors and premium food channels.`,
    ];
  }

  else if (traits.isNut) {
    options = [
      `${p} for wholesale, snack, ingredient and retail programs.`,

      `Commercial ${p} for food distributors and manufacturers.`,

      `${p} supplied by ${c} for professional buyers.`,
    ];
  }

  else if (traits.isSeed) {
    options = [
      `${p} for bulk ingredient and food manufacturing applications.`,

      `Commercial seed supply for wholesale and food-processing buyers.`,

      `${p} suited to distributors, bakeries and food manufacturers.`,
    ];
  }

  else if (traits.isEvoo) {
    options = [
      `${p} for premium retail, foodservice and specialty-food channels.`,

      `Specialty EVOO supply for international B2B buyers.`,

      `${p} positioned for premium olive-oil programs.`,
    ];
  }

  else if (
    traits.isOliveOil ||
    traits.isArgan
  ) {
    options = [
      `${p} for commercial food, retail or specialty-oil programs.`,

      `Professional oil supply for importers and distributors.`,

      `${p} available for international B2B sourcing.`,
    ];
  }

  else if (traits.isFresh) {
    options = [
      `${p} for fresh-produce importers, wholesalers and retail supply.`,

      `Commercial fresh produce for international distribution.`,

      `${p} positioned for wholesale and foodservice channels.`,
    ];
  }

  else {
    options = [
      `${p} for professional food importers and distributors.`,

      `Commercial ${p} supplied for international B2B sourcing.`,

      `${p} available for wholesale and distribution programs.`,
    ];
  }

  return pickDeterministic(
    options,
    `${company.email}:${product.name}:short`
  );
}

// ============================================================
// FULL PRODUCT DESCRIPTION
// ============================================================

function buildProductDescription(
  product,
  company
) {
  const traits =
    getProductTraits(
      product,
      company
    );

  const opening =
    productOpening(
      product,
      company,
      traits
    );

  const characteristics =
    productCharacteristics(
      product,
      traits
    );

  const commercial =
    productCommercialUse(
      product,
      company,
      traits
    );

  const packaging =
    packagingParagraph(
      product,
      company,
      traits
    );

  const certification =
    certificationParagraph(
      company
    );

  const shipping =
    shippingParagraph(
      company
    );

  const layouts = [
    [
      opening,
      characteristics,
      commercial,
      packaging,
      certification,
      shipping,
    ],

    [
      opening,
      characteristics,
      packaging,
      commercial,
      shipping,
    ],

    [
      opening,
      commercial,
      characteristics,
      certification,
      packaging,
      shipping,
    ],

    [
      opening,
      characteristics,
      shipping,
      commercial,
      packaging,
    ],

    [
      opening,
      packaging,
      characteristics,
      commercial,
      certification,
    ],

    [
      opening,
      characteristics,
      commercial,
      packaging,
    ],
  ];

  const layout =
    pickDeterministic(
      layouts,
      `${company.email}:${product.name}:layout`
    );

  return htmlParagraphs(
    layout
  );
}

// ============================================================
// IMAGE URLS
// ============================================================

function loremFlickrUrl(
  keyword,
  w,
  h,
  seed
) {
  const kw =
    String(keyword)
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(",")
      .toLowerCase();

  return `
    https://loremflickr.com/
    ${w}/${h}/
    ${encodeURIComponent(kw)}
    ?random=${seed}
  `.replace(/\s+/g, "");
}

function picsumUrl(
  w,
  h,
  seed
) {
  return `
    https://picsum.photos/
    seed/${seed}/${w}/${h}.jpg
  `.replace(/\s+/g, "");
}

// ============================================================
// DOWNLOAD FILE
// ============================================================

function downloadFile(
  url,
  dest
) {
  return new Promise(
    (resolve, reject) => {
      const client =
        url.startsWith("https")
          ? https
          : http;

      const request =
        client.get(
          url,
          {
            timeout:
              CONFIG.imageTimeout,

            headers: {
              "User-Agent":
                "Mozilla/5.0 FoodTradeLink-Seeder/2.0",
            },
          },
          (response) => {
            if (
              response.statusCode >=
                300 &&
              response.statusCode < 400 &&
              response.headers.location
            ) {
              return downloadFile(
                response.headers.location,
                dest
              )
                .then(resolve)
                .catch(reject);
            }

            if (
              response.statusCode !==
              200
            ) {
              return reject(
                new Error(
                  `HTTP ${response.statusCode}`
                )
              );
            }

            const stream =
              fsSync.createWriteStream(
                dest
              );

            response.pipe(
              stream
            );

            stream.on(
              "finish",
              () => {
                stream.close(
                  () =>
                    resolve(dest)
                );
              }
            );

            stream.on(
              "error",
              (err) => {
                fsSync.unlink(
                  dest,
                  () => {}
                );

                reject(err);
              }
            );
          }
        );

      request.on(
        "error",
        reject
      );

      request.on(
        "timeout",
        () => {
          request.destroy();

          reject(
            new Error(
              "Timeout"
            )
          );
        }
      );
    }
  );
}

// ============================================================
// RETRY
// ============================================================

async function downloadWithRetry(
  url,
  dest
) {
  for (
    let i = 0;
    i < CONFIG.maxRetries;
    i++
  ) {
    try {
      await downloadFile(
        url,
        dest
      );

      const stat =
        await fs.stat(
          dest
        );

      if (
        stat.size < 100
      ) {
        throw new Error(
          "Empty file"
        );
      }

      return true;
    }

    catch (err) {
      if (
        i ===
        CONFIG.maxRetries - 1
      ) {
        throw err;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            CONFIG.retryBackoff *
              (i + 1)
          )
      );
    }
  }

  return false;
}

// ============================================================
// FETCH IMAGE
// ============================================================

async function fetchImage({
  keyword,
  width,
  height,
  destDir,
  filenameSeed,
  existingFiles,
}) {
  const filename =
    `${filenameSeed}.jpg`;

  const dest =
    path.join(
      destDir,
      filename
    );

  if (
    existingFiles.has(
      filename
    ) ||
    (await fileExists(dest))
  ) {
    existingFiles.add(
      filename
    );

    return `
      /uploads/
      ${path.basename(destDir)}
      /${filename}
    `.replace(/\s+/g, "");
  }

  if (
    DRY ||
    NO_IMAGES
  ) {
    return `
      /uploads/
      ${path.basename(destDir)}
      /${filename}
    `.replace(/\s+/g, "");
  }

  const seed =
    shortHash(
      filenameSeed
    );

  // ----------------------------------------------------------
  // LoremFlickr
  // ----------------------------------------------------------

  const primaryUrl =
    loremFlickrUrl(
      keyword,
      width,
      height,
      seed
    );

  try {
    await downloadWithRetry(
      primaryUrl,
      dest
    );

    existingFiles.add(
      filename
    );

    return `
      /uploads/
      ${path.basename(destDir)}
      /${filename}
    `.replace(/\s+/g, "");
  }

  catch {
    // fallback
  }

  // ----------------------------------------------------------
  // Picsum
  // ----------------------------------------------------------

  const fallbackUrl =
    picsumUrl(
      width,
      height,
      seed
    );

  try {
    await downloadWithRetry(
      fallbackUrl,
      dest
    );

    existingFiles.add(
      filename
    );

    return `
      /uploads/
      ${path.basename(destDir)}
      /${filename}
    `.replace(/\s+/g, "");
  }

  catch (err) {
    console.warn(
      `   ⚠️ Failed image ${filename}: ${err.message}`
    );

    return null;
  }
}

// ============================================================
// DOWNLOAD BATCH
// ============================================================

async function downloadBatch(
  tasks,
  existingFiles
) {
  const results = [];

  const queue = [
    ...tasks,
  ];

  async function worker() {
    while (
      queue.length > 0
    ) {
      const task =
        queue.shift();

      if (!task) {
        break;
      }

      const result =
        await fetchImage({
          ...task,
          existingFiles,
        });

      results.push({
        ...task,
        path: result,
      });
    }
  }

  const workers =
    Array.from(
      {
        length:
          CONFIG.concurrency,
      },
      () => worker()
    );

  await Promise.all(
    workers
  );

  return results;
}

// ============================================================
// PICK PRODUCTS
// ============================================================

function pickProductsForCompany(
  company,
  count = 10
) {
  const pool =
    productPools[
      company.primaryCategory
    ] || [];

  if (
    pool.length === 0
  ) {
    return [];
  }

  const shuffled =
    [...pool].sort(
      (a, b) => {
        const ha =
          numericHash(
            company.email +
              ":" +
              a.name
          );

        const hb =
          numericHash(
            company.email +
              ":" +
              b.name
          );

        return ha - hb;
      }
    );

  return shuffled.slice(
    0,
    Math.min(
      count,
      shuffled.length
    )
  );
}

// ============================================================
// PRICE JITTER
// ============================================================

function jitterPrice(
  basePrice,
  seed
) {
  const h =
    parseInt(
      shortHash(seed).slice(
        0,
        6
      ),
      16
    ) / 0xffffff;

  const factor =
    1 +
    (h - 0.5) *
      2 *
      CONFIG.productPriceJitter;

  return (
    Math.round(
      basePrice *
        factor *
        100
    ) / 100
  );
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const startTime =
    Date.now();

  console.log(
    `\n${
      DRY
        ? "🔍 DRY RUN"
        : "🚀"
    } FoodTradeLink Seed`
  );

  console.log(
    `   Suppliers: ${companies.length}`
  );

  console.log(
    `   Images: ${
      NO_IMAGES
        ? "DISABLED"
        : IMAGES_ONLY
        ? "ONLY"
        : "ENABLED"
    }`
  );

  console.log(
    `   Description refresh: ${
      CONFIG.refreshDescriptions
        ? "ENABLED"
        : "DISABLED"
    }`
  );

  console.log(
    `   Concurrency: ${CONFIG.concurrency}\n`
  );

  // ==========================================================
  // DIRECTORIES
  // ==========================================================

  if (
    !DRY &&
    !NO_IMAGES
  ) {
    await ensureDir(
      PROFILE_DIR
    );

    await ensureDir(
      PRODUCT_DIR
    );

    console.log(
      `📁 Profiles: ${PROFILE_DIR}`
    );

    console.log(
      `📁 Products: ${PRODUCT_DIR}\n`
    );
  }

  // ==========================================================
  // EXISTING FILES
  // ==========================================================

  let existingProfileFiles =
    new Set();

  let existingProductFiles =
    new Set();

  if (
    fsSync.existsSync(
      PROFILE_DIR
    )
  ) {
    existingProfileFiles =
      new Set(
        await fs.readdir(
          PROFILE_DIR
        )
      );
  }

  if (
    fsSync.existsSync(
      PRODUCT_DIR
    )
  ) {
    existingProductFiles =
      new Set(
        await fs.readdir(
          PRODUCT_DIR
        )
      );
  }

  // ==========================================================
  // EXISTING NUMBERS
  // ==========================================================

  const existingProfileNumbers =
    new Set(
      (
        await prisma.user.findMany(
          {
            select: {
              profileNumber:
                true,
            },
          }
        )
      ).map(
        (u) =>
          u.profileNumber
      )
    );

  const existingProductNumbers =
    new Set(
      (
        await prisma.product.findMany(
          {
            select: {
              productNumber:
                true,
            },
          }
        )
      ).map(
        (p) =>
          p.productNumber
      )
    );

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = {
    usersCreated: 0,

    usersUpdated: 0,

    usersSkipped: 0,

    productsCreated: 0,

    productsUpdated: 0,

    productsSkipped: 0,

    imagesDownloaded: 0,

    errors: [],
  };

  // ==========================================================
  // COMPANIES LOOP
  // ==========================================================

  for (
    let i = 0;
    i < companies.length;
    i++
  ) {
    const c =
      companies[i];

    const progress =
      `[${i + 1}/${companies.length}]`;

    const companySlug =
      slugify(
        c.companyName
      );

    console.log(
      `\n${progress} 🏢 ${c.companyName} (${c.country})`
    );

    try {
      // ======================================================
      // COMPANY IMAGES
      // ======================================================

      let logoPath = null;

      let coverPath = null;

      let galleryPaths = [];

      if (!NO_IMAGES) {
        console.log(
          `   📸 logo, cover, ${CONFIG.galleryPerCompany} gallery...`
        );

        const logoTask = {
          keyword:
            c.logoKeyword ||
            "food,company",

          width:
            CONFIG.sizes.logo.w,

          height:
            CONFIG.sizes.logo.h,

          destDir:
            PROFILE_DIR,

          filenameSeed:
            `logo-${companySlug}-${shortHash(
              c.email
            )}`,
        };

        const coverTask = {
          keyword:
            c.coverKeyword ||
            "food,export",

          width:
            CONFIG.sizes.cover.w,

          height:
            CONFIG.sizes.cover.h,

          destDir:
            PROFILE_DIR,

          filenameSeed:
            `cover-${companySlug}-${shortHash(
              c.email
            )}`,
        };

        const galleryTasks =
          Array.from(
            {
              length:
                CONFIG.galleryPerCompany,
            },
            (_, gi) => ({
              keyword:
                (
                  c.galleryKeywords &&
                  c.galleryKeywords[
                    gi
                  ]
                ) ||
                "food",

              width:
                CONFIG.sizes.gallery.w,

              height:
                CONFIG.sizes.gallery.h,

              destDir:
                PROFILE_DIR,

              filenameSeed:
                `gallery-${companySlug}-${gi + 1}-${shortHash(
                  c.email
                )}`,
            })
          );

        const allTasks = [
          logoTask,
          coverTask,
          ...galleryTasks,
        ];

        const results =
          await downloadBatch(
            allTasks,
            existingProfileFiles
          );

        logoPath =
          results[0]?.path ||
          null;

        coverPath =
          results[1]?.path ||
          null;

        galleryPaths =
          results
            .slice(2)
            .map(
              (r) =>
                r.path
            )
            .filter(Boolean);

        stats.imagesDownloaded +=
          results.filter(
            (r) => r.path
          ).length;

        console.log(
          `   ✅ Images: ${
            results.filter(
              (r) => r.path
            ).length
          }/${allTasks.length}`
        );
      }

      // ======================================================
      // COMPANY BIO
      // ======================================================

      const generatedBio =
        buildCompanyBio(c);

      // ======================================================
      // FIND USER
      // ======================================================

      let user =
        await prisma.user.findUnique(
          {
            where: {
              email: c.email,
            },
          }
        );

      // ======================================================
      // EXISTING USER
      // ======================================================

      if (user) {
        if (!IMAGES_ONLY) {
          const updateData = {};

          if (
            CONFIG.refreshDescriptions
          ) {
            updateData.bio =
              generatedBio;
          }

          if (logoPath) {
            updateData.logo =
              logoPath;
          }

          if (coverPath) {
            updateData.coverImage =
              coverPath;
          }

          if (
            galleryPaths.length > 0
          ) {
            updateData.galleryImages =
              galleryPaths;
          }

          if (
            Object.keys(
              updateData
            ).length > 0
          ) {
            if (!DRY) {
              await prisma.user.update(
                {
                  where: {
                    id: user.id,
                  },

                  data:
                    updateData,
                }
              );
            }

            stats.usersUpdated++;

            console.log(
              `   ♻️ Updated supplier profile`
            );
          }
        } else {
          stats.usersSkipped++;

          console.log(
            `   ♻️ Skip (images-only)`
          );
        }
      }

      // ======================================================
      // CREATE USER
      // ======================================================

      else if (!IMAGES_ONLY) {
        const profileNumber =
          generateProfileNumber(
            existingProfileNumbers
          );

        if (!DRY) {
          user =
            await prisma.user.create(
              {
                data: {
                  profileNumber,

                  slug:
                    companySlug,

                  name:
                    c.name,

                  email:
                    c.email,

                  emailVerified:
                    new Date(),

                  role:
                    "SUPPLIER",

                  plan:
                    c.plan,

                  companyName:
                    c.companyName,

                  country:
                    c.country,

                  city:
                    c.city,

                  countryCode:
                    c.countryCode,

                  postalCode:
                    c.postalCode,

                  businessType:
                    c.businessType,

                  phone:
                    c.phone,

                  bio:
                    generatedBio,

                  address:
                    c.address,

                  website:
                    c.website ||
                    null,

                  companyEmail:
                    c.companyEmail,

                  employeeCount:
                    c.employeeCount,

                  socialLinks:
                    c.socialLinks,

                  galleryImages:
                    galleryPaths,

                  logo:
                    logoPath,

                  coverImage:
                    coverPath,

                  primaryCategory:
                    c.primaryCategory,

                  primarySubCategory:
                    c.primarySubCategory,

                  registrationComplete:
                    true,
                },
              }
            );
        }

        stats.usersCreated++;

        console.log(
          `   ✅ User created: #${profileNumber}`
        );
      }

      // ======================================================
      // DRY RUN USER OBJECT
      // ======================================================

      if (
        DRY &&
        !user &&
        !IMAGES_ONLY
      ) {
        user = {
          id:
            `dry-${shortHash(
              c.email
            )}`,
        };
      }

      if (!user) {
        continue;
      }

      // ======================================================
      // PRODUCTS
      // ======================================================

      if (IMAGES_ONLY) {
        continue;
      }

      const productPicks =
        pickProductsForCompany(
          c,
          10
        );

      console.log(
        `   📦 Processing ${productPicks.length} products...`
      );

      for (
        let pi = 0;
        pi <
        productPicks.length;
        pi++
      ) {
        const pool =
          productPicks[pi];

        // ====================================================
        // EXISTING PRODUCT
        // ====================================================

        let existingProduct =
          null;

        if (!DRY) {
          existingProduct =
            await prisma.product.findFirst(
              {
                where: {
                  userId:
                    user.id,

                  name:
                    pool.name,
                },

                select: {
                  id: true,

                  slug: true,
                },
              }
            );
        }

        // ====================================================
        // PRODUCT IMAGES
        // ====================================================

        let productImages =
          [];

        if (!NO_IMAGES) {
          const productSlug =
            slugify(
              pool.name
            );

          const imageTasks =
            Array.from(
              {
                length:
                  CONFIG.imagesPerProduct,
              },
              (_, ii) => ({
                keyword:
                  pool.keywords,

                width:
                  CONFIG.sizes.product.w,

                height:
                  CONFIG.sizes.product.h,

                destDir:
                  PRODUCT_DIR,

                filenameSeed:
                  `prod-${companySlug}-${productSlug}-${ii + 1}-${shortHash(
                    c.email +
                      pool.name +
                      ii
                  )}`,
              })
            );

          const imageResults =
            await downloadBatch(
              imageTasks,
              existingProductFiles
            );

          productImages =
            imageResults
              .map(
                (r) =>
                  r.path
              )
              .filter(Boolean);

          stats.imagesDownloaded +=
            productImages.length;
        }

        if (
          productImages.length ===
          0
        ) {
          productImages = [
            "/uploads/products/placeholder.jpg",
          ];
        }

        // ====================================================
        // CREATIVE DESCRIPTIONS
        // ====================================================

        const shortDesc =
          buildProductShortDescription(
            pool,
            c
          );

        const fullDesc =
          buildProductDescription(
            pool,
            c
          );

        // ====================================================
        // PRICE
        // ====================================================

        const price =
          jitterPrice(
            pool.price,
            c.email +
              pool.name
          );

        // ====================================================
        // UPDATE EXISTING PRODUCT
        // ====================================================

        if (existingProduct) {
          if (
            CONFIG.refreshDescriptions
          ) {
            if (!DRY) {
              const data = {
                shortDesc,

                fullDesc,
              };

              if (
                !NO_IMAGES &&
                productImages.length >
                  0
              ) {
                data.images =
                  productImages;
              }

              await prisma.product.update(
                {
                  where: {
                    id:
                      existingProduct.id,
                  },

                  data,
                }
              );
            }

            stats.productsUpdated++;
          } else {
            stats.productsSkipped++;
          }

          continue;
        }

        // ====================================================
        // CREATE PRODUCT
        // ====================================================

        const productNumber =
          generateProductNumber(
            existingProductNumbers
          );

        const productSlug =
          slugify(
            pool.name
          );

        if (!DRY) {
          await prisma.product.create(
            {
              data: {
                productNumber,

                slug:
                  productSlug,

                name:
                  pool.name,

                category:
                  c.primaryCategory,

                subCategory:
                  c.primarySubCategory,

                productType:
                  null,

                shortDesc,

                fullDesc,

                price,

                currency:
                  "USD",

                unit:
                  pool.unit,

                moq:
                  pool.moq,

                stock:
                  null,

                leadTime:
                  null,

                images:
                  productImages,

                country:
                  c.country,

                countryCode:
                  c.countryCode,

                origin:
                  c.country,

                certifications:
                  c.socialLinks
                    ?.certifications ||
                  null,

                shippingTerms:
                  "FOB",

                isVisible:
                  true,

                status:
                  "APPROVED",

                approvedAt:
                  new Date(),

                userId:
                  user.id,
              },
            }
          );
        }

        stats.productsCreated++;

        if (
          (pi + 1) % 5 ===
          0
        ) {
          console.log(
            `      … ${pi + 1}/${productPicks.length} products`
          );
        }
      }

      console.log(
        `   ✅ Products done: ${productPicks.length}`
      );
    }

    catch (err) {
      console.error(
        `   ❌ Error: ${err.message}`
      );

      stats.errors.push({
        company:
          c.companyName,

        error:
          err.message,
      });
    }
  }

  // ==========================================================
  // FINAL REPORT
  // ==========================================================

  const duration =
    (
      (Date.now() -
        startTime) /
      1000 /
      60
    ).toFixed(1);

  console.log(
    "\n" +
      "=".repeat(64)
  );

  console.log(
    "📊 FOODTRADELINK SEED SUMMARY"
  );

  console.log(
    "=".repeat(64)
  );

  console.log(
    `👥 Users created:        ${stats.usersCreated}`
  );

  console.log(
    `♻️ Users updated:        ${stats.usersUpdated}`
  );

  console.log(
    `⏭️ Users skipped:        ${stats.usersSkipped}`
  );

  console.log(
    `📦 Products created:     ${stats.productsCreated}`
  );

  console.log(
    `♻️ Products updated:     ${stats.productsUpdated}`
  );

  console.log(
    `⏭️ Products skipped:     ${stats.productsSkipped}`
  );

  console.log(
    `📸 Images downloaded:    ${stats.imagesDownloaded}`
  );

  console.log(
    `❌ Errors:               ${stats.errors.length}`
  );

  console.log(
    `⏱️ Duration:             ${duration} min`
  );

  // ==========================================================
  // ERRORS
  // ==========================================================

  if (
    stats.errors.length
  ) {
    console.log(
      "\n❌ Error details (first 10):"
    );

    stats.errors
      .slice(0, 10)
      .forEach(
        (e) =>
          console.log(
            `   • ${e.company}: ${e.error}`
          )
      );
  }

  // ==========================================================
  // DATABASE STATS
  // ==========================================================

  if (!DRY) {
    const [
      totalSuppliers,
      totalProducts,
    ] =
      await Promise.all([
        prisma.user.count({
          where: {
            role:
              "SUPPLIER",
          },
        }),

        prisma.product.count(),
      ]);

    console.log(
      `\n📍 Total suppliers in DB: ${totalSuppliers}`
    );

    console.log(
      `📍 Total products in DB:  ${totalProducts}`
    );
  }

  console.log(
    "\n✨ Done!"
  );
}

// ============================================================
// START
// ============================================================

main()
  .catch((err) => {
    console.error(
      "\n❌ Fatal:",
      err
    );

    process.exit(1);
  })
  .finally(() =>
    prisma.$disconnect()
  );