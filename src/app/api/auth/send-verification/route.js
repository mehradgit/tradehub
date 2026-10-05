// src/app/api/auth/send-verification/route.js
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Security: do not tell the user that this email does not exist
      return NextResponse.json({
        message:
          "If an account with this email exists, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          message: "This email is already verified. You can sign in.",
          reason: "already_verified",
        },
        { status: 400 }
      );
    }

    // Delete previous tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // New token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(
      normalizedEmail
    )}`;

    const result = await sendVerificationEmail(normalizedEmail, verificationUrl);

    if (!result.success && process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("📧 RESEND VERIFICATION LINK:");
      console.log(verificationUrl);
      console.log("========================================\n");
    }

    return NextResponse.json({
      message: "Verification link sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { message: "Failed to send verification email" },
      { status: 500 }
    );
  }
}