// src/app/api/auth/forgot-password/route.js
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { verifyCaptcha } from "@/lib/captcha";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

// پیشوند شناسه برای جدا کردن reset از verify
const RESET_PREFIX = "reset:";

export async function POST(request) {
  try {
    const { email, captchaAnswer, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // ✅ بررسی کپچا
    if (!verifyCaptcha(captchaAnswer, captchaToken)) {
      return NextResponse.json(
        {
          message: "Incorrect captcha answer. Please try again.",
          reason: "captcha_failed",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, password: true },
    });

    // ⚠️ به دلایل امنیتی، همیشه پیام موفق برمی‌گردانیم
    // (تا کسی نتونه بفهمه چه ایمیل‌هایی ثبت شدن)
    const genericResponse = {
      message:
        "If an account with this email exists, a password reset link has been sent. Please check your inbox.",
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // اگر کاربر با Google ثبت‌نام کرده (پسورد نداره)
    if (!user.password) {
      // باز هم پیام عمومی می‌دیم
      return NextResponse.json(genericResponse);
    }

    const identifier = `${RESET_PREFIX}${normalizedEmail}`;

    // پاک کردن توکن‌های قبلی برای این ایمیل
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // ساخت توکن جدید (۳۲ بایت hex)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // ۱ ساعت

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    // ساخت URL بازیابی
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      normalizedEmail
    )}`;

    const result = await sendPasswordResetEmail(normalizedEmail, resetUrl);

    // در حالت development، لینک رو تو کنسول چاپ کن
    if (!result.success && process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("🔒 PASSWORD RESET LINK (dev mode):");
      console.log(resetUrl);
      console.log("========================================\n");
    }

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}