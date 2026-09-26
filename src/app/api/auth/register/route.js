// src/app/api/auth/register/route.js
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { generateNumber, generateSlug } from "@/utils/generate";
import { verifyCaptcha } from "@/lib/captcha";

// ✅ تعیین base URL
function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

// ✅ تولید profileNumber یکتا
async function generateUniqueProfileNumber() {
  let profileNumber;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    profileNumber = generateNumber();
    const existing = await prisma.user.findUnique({
      where: { profileNumber },
      select: { id: true },
    });
    if (!existing) isUnique = true;
    attempts++;
  }

  if (!isUnique) {
    throw new Error("Could not generate unique profile number");
  }

  return profileNumber;
}

// ✅ تولید slug یکتا
async function generateUniqueSlug(baseText) {
  const baseSlug = generateSlug(baseText || "user");
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // ⚠️ چون slug در اسکیما @unique نیست، باید از findFirst استفاده کنیم
    const existing = await prisma.user.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

    slug = `${baseSlug}_${counter}`;
    counter++;

    if (counter > 100) {
      // در بدترین حالت، از یک شناسه‌ی تصادفی استفاده کن
      return `${baseSlug}_${Date.now()}`;
    }
  }
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }
    // ✅ بررسی کپچا
    if (!verifyCaptcha(captchaAnswer, captchaToken)) {
      return NextResponse.json(
        {
          message: "Incorrect captcha answer. Please try again.",
          reason: "captcha_failed",
        },
        { status: 400 },
      );
    }
    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // بررسی وجود کاربر
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (!existingUser.emailVerified) {
        return NextResponse.json(
          {
            message:
              "This email is already registered but not verified. Please check your inbox or request a new verification link.",
            reason: "unverified",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          message: "This email is already registered. Please sign in instead.",
        },
        { status: 400 },
      );
    }

    // هش رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ تولید profileNumber و slug
    const profileNumber = await generateUniqueProfileNumber();
    const slug = await generateUniqueSlug(normalizedEmail.split("@")[0]);

    // ساخت کاربر
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: null,
        registrationComplete: false,
        name: normalizedEmail.split("@")[0],
        profileNumber,
        slug,
      },
    });

    // ساخت توکن تأیید
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    // ارسال ایمیل
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(
      normalizedEmail,
    )}`;

    const emailResult = await sendVerificationEmail(
      normalizedEmail,
      verificationUrl,
    );

    if (!emailResult.success && process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("📧 VERIFICATION LINK (dev mode):");
      console.log(verificationUrl);
      console.log("========================================\n");
    }

    return NextResponse.json(
      {
        message:
          "Registration successful. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
