// src/app/api/contact/route.js
import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    // ارسال ایمیل به ادمین (اگر SMTP تنظیم باشد)
    try {
      await sendContactEmail({ name, email, subject, message });
    } catch (emailError) {
      console.error("Contact email failed:", emailError);
      // شکست ارسال ایمیل، مانع پاسخ موفق نمی‌شود
    }

    console.log("[Contact Form]", { name, email, subject });

    return NextResponse.json({
      message: "Message received. We'll be in touch soon.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}