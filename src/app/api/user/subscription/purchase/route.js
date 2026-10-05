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
import { requestYekPayPayment } from "@/lib/yekpayService";

// ============================================================
// base URL
// ============================================================
function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

// ============================================================
// POST: Purchase subscription
// ============================================================
export async function POST(request) {
  try {
    // ====== Authentication ======
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

    // ============================================================
    // Fetch plan and price
    // ============================================================
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

    // ============================================================
    // Validate the coupon code
    // ============================================================
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
    const description = `${plan.name} Plan · ${duration} days`;

    // ============================================================
    // Case 1: Free plan or 100% discount coupon
    // ============================================================
    if (finalAmount === 0) {
      const payment = await createPayment({
        userId,
        planId,
        duration,
        originalAmount,
        discountAmount,
        amount: 0,
        couponId,
        status: "pending",
        method: "coupon_free",
        description,
      });

      const paidPayment = await confirmPayment(payment.id);
      await createSubscriptionFromPayment(paidPayment);

      await prisma.user.update({
        where: { id: userId },
        data: { plan: plan.name.toUpperCase() },
      });

      return NextResponse.json({
        free: true,
        message: "Subscription activated successfully",
        payment: {
          id: paidPayment.id,
          invoiceNumber: paidPayment.invoiceNumber,
        },
      });
    }

    // ============================================================
    // Case 2: Without YekPay (simulated fallback)
    // ============================================================
    const merchantId = process.env.YEKPAY_MERCHANT_ID;
    if (!merchantId) {
      const payment = await createPayment({
        userId,
        planId,
        duration,
        originalAmount,
        discountAmount,
        amount: finalAmount,
        couponId,
        status: "pending",
        method: "simulated",
        description,
      });

      const paidPayment = await confirmPayment(payment.id);
      await createSubscriptionFromPayment(paidPayment);

      await prisma.user.update({
        where: { id: userId },
        data: { plan: plan.name.toUpperCase() },
      });

      return NextResponse.json({
        message: "Subscription activated (simulated)",
        payment: {
          id: paidPayment.id,
          invoiceNumber: paidPayment.invoiceNumber,
        },
      });
    }

    // ============================================================
    // Case 3: With YekPay
    // ============================================================

    // ====== Pre-flight Check: validate profile data ======
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        companyName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        countryCode: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Required fields for YekPay
    const requiredFields = [
      {
        key: "name",
        label: "Full Name",
        value: user.name || user.companyName,
      },
      { key: "phone", label: "Phone Number", value: user.phone },
      { key: "address", label: "Address", value: user.address },
      { key: "city", label: "City", value: user.city },
      { key: "postalCode", label: "Postal Code", value: user.postalCode },
      { key: "country", label: "Country", value: user.country },
    ];

    // Find the missing fields
    const missingFields = requiredFields
      .filter((f) => !f.value || String(f.value).trim().length < 2)
      .map((f) => ({ key: f.key, label: f.label }));

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          message: "Please complete your profile before making a payment.",
          reason: "incomplete_profile",
          missingFields,
          redirectTo: "/dashboard/edit-profile",
        },
        { status: 400 }
      );
    }

    // ====== Create Payment (pending) ======
    const payment = await createPayment({
      userId,
      planId,
      duration,
      originalAmount,
      discountAmount,
      amount: finalAmount,
      couponId,
      status: "pending",
      method: "gateway",
      gatewayName: "yekpay",
      description,
    });

    // ====== Prepare the name ======
    const fullName = (user.name || user.companyName || "Customer").trim();
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "-";

    const callbackUrl = `${getBaseUrl()}/api/payment/yekpay/verify`;
    const orderNumber = payment.invoiceNumber.replace(/[^0-9]/g, "");

    // ====== Request to YekPay ======
    let yekpayResult;
    try {
      yekpayResult = await requestYekPayPayment({
        amount: finalAmount,
        orderNumber,
        callbackUrl,
        description,
        user: {
          email: user.email,
          mobile: user.phone,
          firstName,
          lastName,
          address: user.address,
          postalCode: user.postalCode,
          country: user.country || "IR",
          city: user.city,
        },
      });
    } catch (yekpayError) {
      console.error("YekPay request failed:", yekpayError.message);

      // Mark the payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          metadata: {
            error: yekpayError.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json(
        {
          message:
            "Payment gateway is currently unavailable. Please try again later.",
          reason: "gateway_unavailable",
          detail: yekpayError.message,
        },
        { status: 503 }
      );
    }

    // ====== Store the authority on the payment ======
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: yekpayResult.authority,
        metadata: {
          authority: yekpayResult.authority,
          orderNumber,
          planName: plan.name,
          planDuration: duration,
          planId,
        },
      },
    });

    // ====== Return to the frontend ======
    return NextResponse.json({
      message: "Redirecting to payment gateway...",
      paymentUrl: yekpayResult.paymentUrl,
      paymentId: payment.id,
      invoiceNumber: payment.invoiceNumber,
      amount: finalAmount,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { message: error.message || "Purchase failed" },
      { status: 500 }
    );
  }
}