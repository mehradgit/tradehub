// src/lib/planService.js
import { prisma } from "@/lib/prisma";


// Helper to compute the month index
function getMonthIndex(startDate) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 30);
}

// Get the user's active plan
export async function getUserActivePlan(userId) {
  const subscription = await prisma.userSubscription.findFirst({
    where: { userId, status: "active", endDate: { gt: new Date() } },
    include: { plan: true },
    orderBy: { startDate: "desc" },
  });

  if (subscription?.plan) {
    return { plan: subscription.plan, subscription };
  }

  // If there is no active subscription, fall back to the Basic plan
  const basicPlan = await prisma.plan.findUnique({ where: { name: "Basic" } });
  if (!basicPlan) {
    throw new Error("Basic plan not found. Please run seed.");
  }

  return { plan: basicPlan, subscription: null };
}

// Check the product limit
export async function canAddProduct(userId, plan) {
  if (plan?.maxProducts === -1) return true;
  const limit = plan?.maxProducts ?? 5; // fallback if it was undefined

  const productCount = await prisma.product.count({
    where: { userId, isVisible: true },
  });

  return productCount < limit;
}
// ====== Check the image limit of a product ======
export async function canAddProductImage(productId, plan) {
  if (plan.maxImagesPerProduct === -1) return true;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { images: true },
  });
  const imageCount = Array.isArray(product?.images) ? product.images.length : 0;
  return imageCount < plan.maxImagesPerProduct;
}

// ====== Check the image limit of a buying request ======
export async function canAddRequestImage(requestId, plan) {
  if (plan.maxImagesPerRequest === -1) return true;
  const request = await prisma.buyingRequest.findUnique({
    where: { id: requestId },
    select: { attachments: true },
  });
  const imageCount = Array.isArray(request?.attachments)
    ? request.attachments.length
    : 0;
  return imageCount < plan.maxImagesPerRequest;
}

// ====== Check the profile image limit ======
export async function canAddProfileImage(userId, plan) {
  if (plan.maxProfileImages === -1) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { galleryImages: true },
  });
  const galleryCount = Array.isArray(user?.galleryImages)
    ? user.galleryImages.length
    : 0;
  return galleryCount < plan.maxProfileImages;
}

// ====== Helper to get the monthly usage counter ======
export async function getUsageCount(userId, type, monthIndex) {
  const usage = await prisma.usageCounter.findUnique({
    where: { userId_type_month: { userId, type, month: monthIndex } },
  });
  return usage?.used || 0;
}

// ====== Check the buying request limit (monthly) ======
export async function canAddRequest(userId, plan, subscription) {
  if (plan.maxRequestsPerMonth === -1) return true;
  if (subscription) {
    const monthIndex = getMonthIndex(subscription.startDate);
    const used = await getUsageCount(userId, "request", monthIndex);
    return used < plan.maxRequestsPerMonth;
  }
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const requestCount = await prisma.buyingRequest.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });
  return requestCount < plan.maxRequestsPerMonth;
}

// ====== Check the inquiry limit (Inquiry) ======
export async function canAddInquiry(userId, plan, subscription) {
  if (plan.maxInquiriesPerMonth === -1) return true;
  if (subscription) {
    const monthIndex = getMonthIndex(subscription.startDate);
    const used = await getUsageCount(userId, "inquiry", monthIndex);
    return used < plan.maxInquiriesPerMonth;
  }
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const inquiryCount = await prisma.productInquiry.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });
  return inquiryCount < plan.maxInquiriesPerMonth;
}

// ====== Check the quote limit (Quote) ======
export async function canAddQuote(userId, plan, subscription) {
  if (plan.maxQuotesPerMonth === -1) return true;
  if (subscription) {
    const monthIndex = getMonthIndex(subscription.startDate);
    const used = await getUsageCount(userId, "quote", monthIndex);
    return used < plan.maxQuotesPerMonth;
  }
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const quoteCount = await prisma.quote.count({
    where: { supplierId: userId, createdAt: { gte: startOfMonth } },
  });
  return quoteCount < plan.maxQuotesPerMonth;
}

// ====== Increment the usage counter ======
export async function incrementUsage(userId, type, subscription) {
  if (!subscription) return;
  const monthIndex = getMonthIndex(subscription.startDate);
  await prisma.usageCounter.upsert({
    where: { userId_type_month: { userId, type, month: monthIndex } },
    update: { used: { increment: 1 } },
    create: { userId, type, month: monthIndex, used: 1 },
  });
}

// ====== Check permission to view the details of a buying request ======
// export async function canViewRequestDetails(userId, request) {
//   // 1. Guests are not allowed
//   if (!userId) {
//     return { allowed: false, reason: "login_required" };
//   }

//   // 2. The request owner is always allowed
//   if (request.userId === userId) {
//     return { allowed: true };
//   }

//   // 3. Admins are always allowed
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { isAdmin: true },
//   });
//   if (user?.isAdmin) {
//     return { allowed: true };
//   }

//   // 4. Get the active plan
//   const { plan, subscription } = await getUserActivePlan(userId);

//   // 5. The Basic/Free plan is not allowed to view the details
//   if (!plan || plan.name === "Basic" || plan.name === "Free") {
//     return { allowed: false, reason: "upgrade_required", currentPlan: plan?.name };
//   }

//   // 6. If the monthly inquiry quota is zero (unsuitable plan)
//   if (plan.maxInquiriesPerMonth === 0) {
//     return { allowed: false, reason: "upgrade_required", currentPlan: plan.name };
//   }

//   // 7. Check the remaining quota
//   if (subscription) {
//     const monthIndex = Math.floor(
//       (Date.now() - new Date(subscription.startDate).getTime()) /
//         (30 * 24 * 60 * 60 * 1000)
//     );
//     const used = await getUsageCount(userId, "inquiry", monthIndex);

//     if (
//       plan.maxInquiriesPerMonth !== -1 &&
//       used >= plan.maxInquiriesPerMonth
//     ) {
//       return {
//         allowed: false,
//         reason: "quota_exhausted",
//         currentPlan: plan.name,
//         used,
//         limit: plan.maxInquiriesPerMonth,
//       };
//     }
//   }

//   return { allowed: true };
// }