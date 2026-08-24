// src/app/(public)/page.js
import { prisma } from "@/lib/prisma";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BuyingRequests from "@/components/home/BuyingRequests";
import FeatureGroup from "@/components/home/FeatureGroup";
import MarketplaceSection from "@/components/home/MarketplaceSection";
import CtaSection from "@/components/home/CtaSection";

export default async function HomePage() {
  const [products, requests, stats] = await Promise.all([
    // محصولات ویژه (۵ عدد)
    prisma.product
      .findMany({
        where: { isVisible: true },
        take: 6,
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
            select: {
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),

    // درخواست‌های خرید (۴ عدد)
    prisma.buyingRequest
      .findMany({
        where: { isVisible: true },
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

  return (
    <>
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
