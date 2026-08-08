// src/app/page.js
import { prisma } from "@/lib/prisma";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import StatsBar from "@/components/home/StatsBar";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BuyingRequests from "@/components/home/BuyingRequests";
import Sidebar from "@/components/home/Sidebar";

export default async function HomePage() {
  // ====== دریافت داده‌ها از دیتابیس ======
  const [products, requests, suppliers, buyers, stats] = await Promise.all([
    // محصولات ویژه (۶ عدد)
    prisma.product.findMany({
      where: { isVisible: true },
      take: 4,
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        images: true,
        badge: true,
        country: true,
        countryCode: true,
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []), // ✅ در صورت خطا، آرایه خالی برگردان

    // درخواست‌های خرید (۴ عدد)
    prisma.buyingRequest.findMany({
      where: { isVisible: true },
      take: 4,
      select: {
        id: true,
        title: true,
        description: true,
        isUrgent: true,
        buyerCountry: true,
        deliveryCountry: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []), // ✅ در صورت خطا، آرایه خالی برگردان

    // تأمین‌کنندگان برتر (۳ عدد)
    prisma.user.findMany({
      where: { role: "SUPPLIER" },
      take: 3,
      select: {
        id: true,
        name: true,
        country: true,
        countryCode: true,
      },
      orderBy: { createdAt: "asc" },
    }).catch(() => []),

    // خریداران فعال (۳ عدد)
    prisma.user.findMany({
      where: { role: "BUYER" },
      take: 3,
      select: {
        id: true,
        name: true,
        country: true,
        countryCode: true,
      },
      orderBy: { createdAt: "asc" },
    }).catch(() => []),

    // آمار سایت
    prisma.$transaction([
      prisma.user.count({ where: { role: "SUPPLIER" } }),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.product.count({ where: { isVisible: true } }),
    ])
      .then(([supplierCount, buyerCount, productCount]) => ({
        suppliers: supplierCount || 8200,
        buyers: buyerCount || 4500,
        products: productCount || 24000,
      }))
      .catch(() => ({
        suppliers: 8200,
        buyers: 4500,
        products: 24000,
      })),
  ]);

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection stats={stats} />

      <div className="container py-3">
        {/* Stats Bar */}
        <StatsBar />

        {/* Main Content Grid */}
        <div className="row g-4">
          <div className="col-lg-9">
            {/* Featured Products */}
            <FeaturedProducts products={products || []} requests={requests || []} />

            {/* Buying Requests (به‌عنوان بخش اضافی) */}
            <BuyingRequests requests={requests || []} />
          </div>

          <div className="col-lg-3 ms-auto">
            {/* Sidebar */}
            <Sidebar suppliers={suppliers || []} buyers={buyers || []} />
          </div>
        </div>
      </div>
    </Layout>
  );
}