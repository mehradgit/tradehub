// src/app/api/auth/reset-password/route.js
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const RESET_PREFIX = "reset:";

export async function POST(request) {
  try {
    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const identifier = `${RESET_PREFIX}${normalizedEmail}`;

    // پیدا کردن توکن معتبر
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token,
        expires: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        {
          message:
            "This reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // هش پسورد جدید
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // به‌روزرسانی پسورد
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // پاک کردن توکن (یک‌بارمصرف)
    await prisma.verificationToken.deleteMany({
      where: { identifier, token },
    });

    return NextResponse.json({
      message:
        "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}