// src/app/api/auth/verify-email/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token, email } = await request.json();
    if (!token || !email) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        token,
        expires: { gt: new Date() },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { message: "This link is invalid or expired. Please request a new one." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: new Date() },
      });
    }

    // ✅ توکن رو اینجا پاک نکن! برای auto-login لازمه
    return NextResponse.json({
      message: "Email verified successfully",
      loginToken: token,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}