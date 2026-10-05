// src/lib/paymentService.js
import { prisma } from "@/lib/prisma";
import {
  generateInvoiceNumber,
  generateReferenceNumber,
} from "@/utils/invoiceHelpers";

// ====== Calculate the coupon discount ======
export async function calculateCouponDiscount(couponCode, planId, amount) {
  if (!couponCode) {
    return { valid: false, discount: 0, coupon: null, error: "No coupon code" };
  }

  const code = couponCode.toUpperCase().trim();

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return { valid: false, discount: 0, coupon: null, error: "Invalid coupon code" };
  }

  if (!coupon.isActive) {
    return { valid: false, discount: 0, coupon, error: "This coupon is inactive" };
  }

  if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
    return { valid: false, discount: 0, coupon, error: "This coupon has expired" };
  }

  if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
    return { valid: false, discount: 0, coupon, error: "This coupon is not active yet" };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, coupon, error: "This coupon has reached its usage limit" };
  }

  // Check the allowed plans
  if (coupon.appliesToPlans && Array.isArray(coupon.appliesToPlans)) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { name: true },
    });
    if (plan && !coupon.appliesToPlans.includes(plan.name)) {
      return {
        valid: false,
        discount: 0,
        coupon,
        error: "This coupon doesn't apply to the selected plan",
      };
    }
  }

  // Check the minimum amount
  if (coupon.minAmount && amount < Number(coupon.minAmount)) {
    return {
      valid: false,
      discount: 0,
      coupon,
      error: `Minimum amount for this coupon is $${coupon.minAmount}`,
    };
  }

  // Calculate the discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (amount * Number(coupon.value)) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === "fixed") {
    discount = Math.min(Number(coupon.value), amount);
  }

  discount = Math.round(discount * 100) / 100;

  return { valid: true, discount, coupon };
}

// ====== Validate coupon redemption ======
export async function hasUserUsedCoupon(userId, couponId) {
  const usage = await prisma.couponUsage.findFirst({
    where: { userId, couponId },
  });
  return !!usage;
}

// ====== Create Payment ======
export async function createPayment({
  userId,
  planId,
  duration,
  originalAmount,
  discountAmount = 0,
  couponId = null,
  amount,
  status = "pending",
  method = "simulated",
  description = null,
  createdById = null,
  transactionId = null,
  metadata = null,
}) {
  const invoiceNumber = await generateInvoiceNumber(prisma);
  const referenceNumber = generateReferenceNumber();

  const payment = await prisma.payment.create({
    data: {
      invoiceNumber,
      referenceNumber,
      userId,
      planId,
      duration,
      originalAmount,
      discountAmount,
      amount,
      couponId,
      status,
      method,
      description,
      createdById,
      transactionId,
      metadata,
      paidAt: status === "paid" ? new Date() : null,
    },
  });

  // If a coupon was used, record its redemption
  if (couponId && discountAmount > 0) {
    await prisma.$transaction([
      prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          paymentId: payment.id,
          discountAmount,
        },
      }),
      prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  }

  return payment;
}

// ====== Confirm payment (simulated) ======
export async function confirmPayment(paymentId) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });
  return payment;
}

// ====== Create a subscription from a Payment ======
export async function createSubscriptionFromPayment(payment) {
  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + payment.duration * 24 * 60 * 60 * 1000
  );

  // Check for an active subscription
  const activeSub = await prisma.userSubscription.findFirst({
    where: {
      userId: payment.userId,
      status: "active",
      endDate: { gt: new Date() },
    },
    orderBy: { startDate: "desc" },
  });

  const status = activeSub ? "reserved" : "active";

  const subscription = await prisma.userSubscription.create({
    data: {
      userId: payment.userId,
      planId: payment.planId,
      startDate: activeSub ? endDate : startDate,
      endDate: activeSub
        ? new Date(endDate.getTime() + payment.duration * 24 * 60 * 60 * 1000)
        : endDate,
      status,
    },
  });

  // Link the subscription to the payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: { subscriptionId: subscription.id },
  });

  return subscription;
}