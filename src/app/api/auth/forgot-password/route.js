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

// Identifier prefix that keeps reset tokens separate from verify tokens
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

    // Verify the captcha
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

    // For security reasons we always return a success message
    // (so nobody can find out which emails are registered)
    const genericResponse = {
      message:
        "If an account with this email exists, a password reset link has been sent. Please check your inbox.",
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // If the user signed up with Google (no password set)
    if (!user.password) {
      // Still return the generic message
      return NextResponse.json(genericResponse);
    }

    const identifier = `${RESET_PREFIX}${normalizedEmail}`;

    // Delete any previous tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // Create a new token (32 bytes, hex)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    // Build the reset URL
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      normalizedEmail
    )}`;

    const result = await sendPasswordResetEmail(normalizedEmail, resetUrl);

    // In development mode, print the link to the console
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