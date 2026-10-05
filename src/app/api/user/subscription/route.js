// src/app/api/user/subscription/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserActivePlan, getUsageCount } from "@/lib/planService"; // assuming this function exists in planService

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { plan, subscription } = await getUserActivePlan(userId);

    // Monthly quota counters
    const usage = {};
    if (subscription) {
      const monthIndex = Math.floor(
        (Date.now() - subscription.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );

      const [requests, inquiries, quotes] = await Promise.all([
        getUsageCount(userId, "request", monthIndex),
        getUsageCount(userId, "inquiry", monthIndex),
        getUsageCount(userId, "quote", monthIndex),
      ]);

      usage.requests = { used: requests, limit: plan.maxRequestsPerMonth };
      usage.inquiries = { used: inquiries, limit: plan.maxInquiriesPerMonth };
      usage.quotes = { used: quotes, limit: plan.maxQuotesPerMonth };
    } else {
      // No active subscription - fall back to the overall calendar-month stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const [reqCount, inqCount, quoteCount] = await Promise.all([
        prisma.buyingRequest.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
        prisma.productInquiry.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
        prisma.quote.count({ where: { supplierId: userId, createdAt: { gte: startOfMonth } } }),
      ]);
      usage.requests = { used: reqCount, limit: plan.maxRequestsPerMonth };
      usage.inquiries = { used: inqCount, limit: plan.maxInquiriesPerMonth };
      usage.quotes = { used: quoteCount, limit: plan.maxQuotesPerMonth };
    }

    // Product count and profile image count
    const [productCount, profileImagesCount] = await Promise.all([
      prisma.product.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { galleryImages: true },
      }).then((user) => (Array.isArray(user?.galleryImages) ? user.galleryImages.length : 0)),
    ]);

    // Reserved subscription
    const reservedSubscription = await prisma.userSubscription.findFirst({
      where: { userId, status: "reserved" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      plan,
      activeSubscription: subscription,
      reservedSubscription,
      usage,
      products: { count: productCount, limit: plan.maxProducts },
      profileImages: { count: profileImagesCount, limit: plan.maxProfileImages },
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json({ message: "Failed to fetch subscription" }, { status: 500 });
  }
}