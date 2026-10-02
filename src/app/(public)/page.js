// src/app/(public)/page.js
import { prisma } from "@/lib/prisma";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BuyingRequests from "@/components/home/BuyingRequests";
import FeatureGroup from "@/components/home/FeatureGroup";
import MarketplaceSection from "@/components/home/MarketplaceSection";
import CtaSection from "@/components/home/CtaSection";
import CompanyAdsSection from "@/components/home/CompanyAdsSection";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// Metadata اختصاصی صفحه اصلی
// ============================================================
export const metadata = {
  title: "B2B Food Marketplace — Buy & Sell Wholesale Food Globally",

  description:
    "FoodTradeHub is a global B2B food marketplace connecting verified suppliers, manufacturers, and buyers. Source wholesale food products from 120+ countries with confidence.",

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
    siteName: "FoodTradeHub",
    title: "B2B Food Marketplace — Buy & Sell Wholesale Food Globally",
    description:
      "Connect with verified food suppliers and buyers across 120+ countries. Trade wholesale food products without borders.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "FoodTradeHub — Global B2B Food Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "B2B Food Marketplace — FoodTradeHub",
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
// HomePage
// ============================================================
export default async function HomePage() {
  // ===== دریافت داده‌ها =====
  const [products, requests, stats] = await Promise.all([
    // محصولات ویژه (۵ عدد)
    prisma.product
      .findMany({
        where: { isVisible: true, status: "APPROVED" },
        take: 5,
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
          user: {
            select: { companyName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),

    // درخواست‌های خرید (۶ عدد)
    prisma.buyingRequest
      .findMany({
        where: { isVisible: true, status: "APPROVED" },
        take: 6,
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
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),

    // آمار سایت
    prisma
      .$transaction([
        prisma.user.count({ where: { role: "SUPPLIER" } }),
        prisma.user.count({ where: { role: "BUYER" } }),
        prisma.product.count({ where: { isVisible: true } }),
      ])
      .then(([supplierCount, buyerCount, productCount]) => ({
        suppliers: supplierCount || 18500,
        buyers: buyerCount || 4500,
        products: productCount || 72000,
        countries: 120,
      }))
      .catch(() => ({
        suppliers: 18500,
        buyers: 4500,
        products: 72000,
        countries: 120,
      })),
  ]);

  // ============================================================
  // JSON-LD اختصاصی صفحه اصلی
  // ============================================================

  // 1️⃣ WebPage — اطلاعات صفحه اصلی
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/#webpage`,
    url: `${BASE_URL}/`,
    name: "FoodTradeHub — Global B2B Food Marketplace",
    description:
      "Global B2B food marketplace connecting verified suppliers, manufacturers, and buyers across 120+ countries.",
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    about: {
      "@id": `${BASE_URL}/#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${BASE_URL}/og-image.png`,
      width: 1200,
      height: 630,
    },
    datePublished: "2024-01-01T00:00:00+00:00",
    dateModified: new Date().toISOString(),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
      ],
    },
  };

  // 2️⃣ ItemList — محصولات ویژه
  const featuredProductsJsonLd =
    products.length > 0
      ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Featured Products",
        description: "Featured wholesale food products from verified suppliers",
        numberOfItems: products.length,
        itemListElement: products.map((p, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${BASE_URL}/products/${p.productNumber}/${p.slug}`,
          name: p.name,
          image: Array.isArray(p.images) && p.images[0]
            ? p.images[0].startsWith("http")
              ? p.images[0]
              : `${BASE_URL}${p.images[0]}`
            : undefined,
        })),
      }
      : null;

  // 3️⃣ ItemList — درخواست‌های خرید فعال
  const activeRequestsJsonLd =
    requests.length > 0
      ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Active Buying Requests",
        description: "Latest purchase requirements from verified buyers",
        numberOfItems: requests.length,
        itemListElement: requests.map((r, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${BASE_URL}/requests/${r.requestNumber}/${r.slug}`,
          name: r.title,
        })),
      }
      : null;

  // 4️⃣ AggregateRating — نظرات (اگه دیتا داری)
  // فعلاً کامنت شده چون دیتای واقعی نظرات توی دیتابیس نیست
  // const aggregateRatingJsonLd = { ... };

  return (
    <>
      {/* ============================================================
         Structured Data — JSON-LD
         ============================================================ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />

      {featuredProductsJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(featuredProductsJsonLd),
          }}
        />
      )}

      {activeRequestsJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(activeRequestsJsonLd),
          }}
        />
      )}

      {/* ============================================================
         محتوای صفحه — بدون تغییر نسبت به قبل
         ============================================================ */}

      {/* Hero Section */}
      <HeroSection stats={stats} />

      {/* Trust Bar */}
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

      {/* Products & Requests */}
      <div className="container py-3">
        <div className="row g-4">
          <div className="col-12">
            <FeaturedProducts
              products={products || []}
              requests={requests || []}
            />

            {/* Categories Section */}
            <div className="container">
              <CategoriesSection />
            </div>
            <div className="container">
              <CompanyAdsSection />
            </div>
            <BuyingRequests requests={requests || []} />
          </div>
        </div>

        {/* ====== بخش‌های جدید ====== */}
        <div className="container">
          <FeatureGroup />

          <FeaturedProducts
            products={products || []}
            requests={requests || []}
          />

          <MarketplaceSection />

          <BuyingRequests requests={requests || []} />

          <CtaSection />
        </div>
      </div>
    </>
  );
}