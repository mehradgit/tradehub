// src/app/(public)/page.js
import { prisma } from "@/lib/prisma";
import { getActiveHomepageSections } from "@/lib/homepageService";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import HomepageSection from "@/components/home/HomepageSection";
import FeatureGroup from "@/components/home/FeatureGroup";
import MarketplaceSection from "@/components/home/MarketplaceSection";
import CtaSection from "@/components/home/CtaSection";
import CompanyAdsSection from "@/components/home/CompanyAdsSection";
import WhyFoodTradeLink from "@/components/home/WhyFoodTradeLink";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// Metadata
// ============================================================
export const metadata = {
  title: "B2B Food Marketplace — Buy & Sell Wholesale Food Globally",

  description:
    "FoodTradeLink  is a global B2B food marketplace connecting verified suppliers, manufacturers, and buyers. Source wholesale food products from 120+ countries with confidence.",

  keywords: [
    "B2B food marketplace",
    "wholesale food",
    "buy food in bulk",
    "sell food online",
    "global food trade",
    "food suppliers directory",
    "food import export",
    "verified food suppliers",
    "B2B food platform",
    "organic food wholesale",
    "food trading platform",
    "bulk food suppliers",
  ],

  alternates: {
    canonical: `${BASE_URL}/`,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${BASE_URL}/`,
    siteName: "FoodTradeLink",
    title: "B2B Food Marketplace — Buy & Sell Wholesale Food Globally",
    description:
      "Connect with verified food suppliers and buyers across 120+ countries. Trade wholesale food products without borders.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "FoodTradeLink — Global B2B Food Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "B2B Food Marketplace — FoodTradeLink",
    description:
      "Connect with verified food suppliers and buyers across 120+ countries.",
    images: [`${BASE_URL}/og-image.png`],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// ============================================================
// Fetch items per section
// ============================================================
async function fetchSectionData(section) {
  const limit = section.limit || 6;

  // ============================================================
  // Manual mode: fetch by IDs (preserve order)
  // ============================================================
  if (section.mode === "manual") {
    const ids = Array.isArray(section.itemIds) ? section.itemIds : [];
    if (ids.length === 0) {
      return { section, items: [] };
    }

    if (section.type === "products") {
      const products = await prisma.product
        .findMany({
          where: {
            id: { in: ids },
            isVisible: true,
            status: "APPROVED",
          },
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
            images: true,
            badge: true,
            country: true,
            countryCode: true,
            origin: true,
            slug: true,
            productNumber: true,
            ratingAverage: true,
            ratingCount: true,
            user: { select: { companyName: true } },
          },
        })
        .catch(() => []);

      // Preserve the original order according to itemIds
      const map = new Map(products.map((p) => [p.id, p]));
      const ordered = ids.map((id) => map.get(id)).filter(Boolean);
      return { section, items: ordered };
    }

    const requests = await prisma.buyingRequest
      .findMany({
        where: {
          id: { in: ids },
          isVisible: true,
          status: "APPROVED",
        },
        select: {
          id: true,
          title: true,
          description: true,
          isUrgent: true,
          buyerCountry: true,
          deliveryCountry: true,
          createdAt: true,
          slug: true,
          requestNumber: true,
        },
      })
      .catch(() => []);

    const map = new Map(requests.map((r) => [r.id, r]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean);
    return { section, items: ordered };
  }

  // ============================================================
  // Category or Latest mode
  // ============================================================
  const where = { isVisible: true, status: "APPROVED" };

  if (section.mode === "category" && section.category) {
    where.category = section.category;
    if (section.subCategory) {
      where.subCategory = section.subCategory;
    }
  }

  if (section.type === "products") {
    const products = await prisma.product
      .findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          images: true,
          badge: true,
          country: true,
          countryCode: true,
          origin: true,
          slug: true,
          productNumber: true,
          user: { select: { companyName: true } },
        },
      })
      .catch(() => []);

    return { section, items: products };
  }

  const requests = await prisma.buyingRequest
    .findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        isUrgent: true,
        buyerCountry: true,
        deliveryCountry: true,
        createdAt: true,
        slug: true,
        requestNumber: true,
      },
    })
    .catch(() => []);

  return { section, items: requests };
}
const [topSuppliers, topBuyers] = await Promise.all([
  prisma.user.findMany({
    where: { role: "SUPPLIER", registrationComplete: true },
    orderBy: { products: { _count: "desc" } },
    take: 3,
    select: {
      id: true, companyName: true, name: true, country: true,
      profileNumber: true, slug: true,
      _count: { select: { products: true } },
    },
  }),
  prisma.user.findMany({
    where: { role: "BUYER", registrationComplete: true },
    orderBy: { buyingRequests: { _count: "desc" } },
    take: 3,
    select: {
      id: true, companyName: true, name: true, country: true,
      profileNumber: true, slug: true,
      _count: { select: { buyingRequests: true } },
    },
  }),
]);
// ============================================================
// Fetch stats
// ============================================================
async function fetchStats() {
  try {
    const [supplierCount, buyerCount, productCount] = await prisma.$transaction(
      [
        prisma.user.count({ where: { role: "SUPPLIER" } }),
        prisma.user.count({ where: { role: "BUYER" } }),
        prisma.product.count({ where: { isVisible: true } }),
      ]
    );

    return {
      suppliers: supplierCount || 18500,
      buyers: buyerCount || 4500,
      products: productCount || 72000,
      countries: 120,
    };
  } catch {
    return {
      suppliers: 18500,
      buyers: 4500,
      products: 72000,
      countries: 120,
    };
  }
}

// ============================================================
// HomePage
// ============================================================
export default async function HomePage() {
  // 1. Fetch active sections
  const sections = await getActiveHomepageSections();

  // 2. Split by position
  const topSections = sections.filter(
    (s) => (s.position || "top") === "top"
  );
  const afterCompaniesSections = sections.filter(
    (s) => s.position === "after-companies"
  );
  const beforeCtaSections = sections.filter(
    (s) => s.position === "before-cta"
  );

  // 3. Fetch data for all sections + stats
  const allSections = [
    ...topSections,
    ...afterCompaniesSections,
    ...beforeCtaSections,
  ];

  const [sectionDataList, stats] = await Promise.all([
    Promise.all(allSections.map(fetchSectionData)),
    fetchStats(),
  ]);

  const dataMap = Object.fromEntries(
    sectionDataList.map((d) => [d.section.id, d])
  );

  // ============================================================
  // JSON-LD
  // ============================================================
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/#webpage`,
    url: `${BASE_URL}/`,
    name: "FoodTradeLink — Global B2B Food Marketplace",
    description:
      "Global B2B food marketplace connecting verified suppliers, manufacturers, and buyers across 120+ countries.",
    inLanguage: "en-US",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    about: { "@id": `${BASE_URL}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${BASE_URL}/og-image.png`,
      width: 1200,
      height: 630,
    },
    datePublished: "2024-01-01T00:00:00+00:00",
    dateModified: new Date().toISOString(),
  };

  // ItemList for Products sections
  const productsItemLists = topSections
    .concat(afterCompaniesSections, beforeCtaSections)
    .filter((s) => s.type === "products" && dataMap[s.id]?.items?.length > 0)
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: s.title,
      numberOfItems: dataMap[s.id].items.length,
      itemListElement: dataMap[s.id].items.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${BASE_URL}/products/${p.productNumber}/${p.slug}`,
        name: p.name,
      })),
    }));

  // ItemList for Requests sections
  const requestsItemLists = topSections
    .concat(afterCompaniesSections, beforeCtaSections)
    .filter((s) => s.type === "requests" && dataMap[s.id]?.items?.length > 0)
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: s.title,
      numberOfItems: dataMap[s.id].items.length,
      itemListElement: dataMap[s.id].items.map((r, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${BASE_URL}/requests/${r.requestNumber}/${r.slug}`,
        name: r.title,
      })),
    }));

  return (
    <>
      {/* ============================================================
         Structured Data
         ============================================================ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      {productsItemLists.map((jsonLd, idx) => (
        <script
          key={`products-jsonld-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      {requestsItemLists.map((jsonLd, idx) => (
        <script
          key={`requests-jsonld-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      {/* ============================================================
         1. Hero Section
         ============================================================ */}
      <HeroSection stats={stats} />
      <WhyFoodTradeLink />
      {/* ============================================================
         2. Trust Bar
         ============================================================ */}
      <section className="trust">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <strong>98%</strong>
              <span>Buyer Satisfaction</span>
            </div>
            <div className="trust-item">
              <strong>24/7</strong>
              <span>Global Support</span>
            </div>
            <div className="trust-item">
              <strong>15K+</strong>
              <span>Trade Opportunities</span>
            </div>
            <div className="trust-item">
              <strong>Secure</strong>
              <span>Business Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
         3. Sections with position=top
         ============================================================ */}
      {topSections.map((section, idx) => (
        <section key={section.id} className="container py-4">
          <HomepageSection
            section={section}
            items={dataMap[section.id]?.items || []}
          />

          {/* Categories + Feature Group after the first section */}
          {idx === 0 && (
            <>
              <div style={{ marginTop: 32 }}>
                <CategoriesSection />
              </div>
              <div style={{ marginTop: 32 }}>
                <FeatureGroup />
              </div>
            </>
          )}
        </section>
      ))}

      {/* ============================================================
         4. Trusted Partners (CompanyAdsSection)
         ============================================================ */}
      <section className="container">
        <CompanyAdsSection />
      </section>

      {/* ============================================================
         5. Sections with position=after-companies — below Trusted Partners
         ============================================================ */}
      {afterCompaniesSections.map((section) => (
        <section key={section.id} className="container py-4">
          <HomepageSection
            section={section}
            items={dataMap[section.id]?.items || []}
          />
        </section>
      ))}

      {/* ============================================================
         6. Marketplace (Suppliers + Buyers)
         ============================================================ */}
      <section className="container py-4">
        <MarketplaceSection suppliers={topSuppliers} buyers={topBuyers} />
      </section>

      {/* ============================================================
         7. Sections with position=before-cta
         ============================================================ */}
      {beforeCtaSections.map((section) => (
        <section key={section.id} className="container py-4">
          <HomepageSection
            section={section}
            items={dataMap[section.id]?.items || []}
          />
        </section>
      ))}

      {/* ============================================================
         8. CTA
         ============================================================ */}
      <section className="container">
        <CtaSection />
      </section>
    </>
  );
}