import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ message: "Email and code are required" }),
        { status: 400 }
      );
    }

    // پیدا کردن کد در دیتابیس
    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
        expires: { gt: new Date() },
      },
    });

    if (!verification) {
      return new Response(
        JSON.stringify({ message: "Invalid or expired verification code" }),
        { status: 400 }
      );
    }

    // کد معتبر است، آن را حذف می‌کنیم
    await prisma.verificationToken.delete({
      where: { id: verification.id },
    });

    return new Response(
      JSON.stringify({ message: "Code verified successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify code error:', error);
    return new Response(
      JSON.stringify({ message: "Failed to verify code" }),
      { status: 500 }
    );
  }
}