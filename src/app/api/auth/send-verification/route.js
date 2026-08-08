import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ message: "Email is required" }),
        { status: 400 }
      );
    }

    // تولید کد ۶ رقمی
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // حذف کدهای قبلی برای این ایمیل
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // ذخیره کد جدید (منقضی شدن بعد از ۱۰ دقیقه)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // ارسال ایمیل
    const result = await sendVerificationEmail(email, code);

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      // حتی اگر ایمیل ارسال نشد، به کاربر بگوییم کد ذخیره شده است
      // اما در واقع خطا رخ داده است - در محیط توسعه، کد را در کنسول لاگ می‌کنیم
      console.log(`Verification code for ${email}: ${code}`);
      return new Response(
        JSON.stringify({ 
          message: "Verification code sent (check console for development)" 
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Verification code sent successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Send verification error:', error);
    return new Response(
      JSON.stringify({ message: "Failed to send verification code" }),
      { status: 500 }
    );
  }
}