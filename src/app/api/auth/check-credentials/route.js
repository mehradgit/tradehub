// src/app/api/auth/check-credentials/route.js
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha";

export async function POST(request) {
  try {
    const { email, password, captchaAnswer, captchaToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
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
      select: {
        id: true,
        email: true,
        password: true,
        emailVerified: true,
        registrationComplete: true,
      },
    });

    // User not found → generic message (for security)
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // The user signed up with Google (no password set)
    if (!user.password) {
      return NextResponse.json(
        {
          message:
            "This account was created with Google. Please sign in with Google instead.",
          reason: "oauth_only",
        },
        { status: 401 }
      );
    }

    // Wrong password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Email not verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          message:
            "Your email is not verified yet. Please check your inbox for the verification link.",
          reason: "email_not_verified",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Everything checks out
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Check credentials error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}