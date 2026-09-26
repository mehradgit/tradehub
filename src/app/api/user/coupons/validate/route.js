// src/app/api/user/coupons/validate/route.js
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  calculateCouponDiscount,
  hasUserUsedCoupon,
} from "@/lib/paymentService";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, planId, amount } = body;

    if (!code || !planId || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await calculateCouponDiscount(code, planId, amount);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.error },
        { status: 200 }
      );
    }

    // بررسی که کاربر قبلاً استفاده نکرده
    const alreadyUsed = await hasUserUsedCoupon(
      session.user.id,
      result.coupon.id
    );
    if (alreadyUsed) {
      return NextResponse.json(
        { valid: false, message: "You have already used this coupon" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
      coupon: {
        code: result.coupon.code,
        type: result.coupon.type,
        value: Number(result.coupon.value),
      },
      finalAmount: Math.max(0, amount - result.discount),
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json(
      { valid: false, message: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}