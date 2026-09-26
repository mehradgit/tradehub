// src/app/api/user/subscription/purchase/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  calculateCouponDiscount,
  hasUserUsedCoupon,
  createPayment,
  confirmPayment,
  createSubscriptionFromPayment,
} from "@/lib/paymentService";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { planId, duration, couponCode } = body;

    if (!planId || !duration) {
      return NextResponse.json(
        { message: "Plan ID and duration are required" },
        { status: 400 }
      );
    }

    // دریافت پلن و قیمت
    const [plan, price] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.planPrice.findUnique({
        where: { planId_duration: { planId, duration } },
      }),
    ]);

    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    if (!price) {
      return NextResponse.json(
        { message: "Price for this duration not found" },
        { status: 404 }
      );
    }

    const originalAmount = Number(price.price);
    let discountAmount = 0;
    let couponId = null;

    // محاسبه کد تخفیف (اگر داده شده)
    if (couponCode) {
      const result = await calculateCouponDiscount(
        couponCode,
        planId,
        originalAmount
      );

      if (!result.valid) {
        return NextResponse.json(
          { message: result.error || "Invalid coupon" },
          { status: 400 }
        );
      }

      // بررسی که کاربر قبلاً از این کد استفاده نکرده باشد
      const alreadyUsed = await hasUserUsedCoupon(userId, result.coupon.id);
      if (alreadyUsed) {
        return NextResponse.json(
          { message: "You have already used this coupon" },
          { status: 400 }
        );
      }

      discountAmount = result.discount;
      couponId = result.coupon.id;
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // تشخیص متد
    const method = finalAmount === 0 ? "coupon_free" : "simulated";

    // ایجاد Payment
    const payment = await createPayment({
      userId,
      planId,
      duration,
      originalAmount,
      discountAmount,
      amount: finalAmount,
      couponId,
      status: "pending",
      method,
      description: `${plan.name} Plan · ${duration} days`,
    });

    // شبیه‌سازی: بلافاصله موفق
    const paidPayment = await confirmPayment(payment.id);

    // ایجاد اشتراک
    await createSubscriptionFromPayment(paidPayment);

    // به‌روزرسانی فیلد plan در User
    await prisma.user.update({
      where: { id: userId },
      data: { plan: plan.name.toUpperCase() },
    });

    return NextResponse.json({
      message: "Subscription activated successfully",
      payment: {
        id: paidPayment.id,
        invoiceNumber: paidPayment.invoiceNumber,
        amount: Number(paidPayment.amount),
      },
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { message: "Purchase failed", error: error.message },
      { status: 500 }
    );
  }
}