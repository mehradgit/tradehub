// src/app/api/auth/verify-email/route.js
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return new Response(
        JSON.stringify({ message: "Invalid request" }),
        { status: 400 }
      );
    }

    // پیدا کردن توکن
    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
        expires: { gt: new Date() },
      },
    });

    if (!verification) {
      return new Response(
        JSON.stringify({ message: "Invalid or expired token" }),
        { status: 400 }
      );
    }

    // به‌روزرسانی کاربر
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // حذف توکن (یکبار مصرف)
    await prisma.verificationToken.delete({
      where: { id: verification.id },
    });

    return new Response(
      JSON.stringify({ message: "Email verified successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ message: "Verification failed" }),
      { status: 500 }
    );
  }
}