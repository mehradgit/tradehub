// src/app/api/admin/telegram/test/route.js
// ============================================================
// تست اطلاع‌رسانی تلگرام — فقط ادمین
//
//   POST /api/admin/telegram/test
//
// پاسخ شامل وضعیت نهایی است:
//   ok:true   ← پیام به تلگرام رسید
//   ok:false  ← دلیل دقیق (توکن نادرست / چت پیدا نشد /
//               پروکسی / ...) — کافی است این پیام را بفرستید
// ============================================================
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  isTelegramConfigured,
  sendTelegramMessage,
} from "@/lib/telegramService";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // ====== ۱. تنظیمات وجود دارد؟ ======
    if (!isTelegramConfigured()) {
      return NextResponse.json({
        ok: false,
        stage: "config",
        error: "TELEGRAM_BOT_TOKEN یا TELEGRAM_CHAT_ID در .env خالی است. سرور را بعد از تغییر .env ری‌استارت کنید.",
        env: {
          botTokenSet: Boolean(process.env.TELEGRAM_BOT_TOKEN),
          chatIdSet: Boolean(process.env.TELEGRAM_CHAT_ID),
          alertsEnabled: process.env.TELEGRAM_ALERTS_ENABLED !== "false",
          proxy: process.env.TELEGRAM_PROXY || null,
        },
      });
    }

    // ====== ۲. ارسال تست ======
    const time = new Date().toLocaleString("en-GB", { hour12: false });
    const result = await sendTelegramMessage(
      `🧪 <b>تست اطلاع‌رسانی</b>\n` +
        `اگر این پیام را می‌بینید، اطلاع‌رسانی تلگرام درست کار می‌کند.\n` +
        `زمان: ${time}`
    );

    if (result.skipped === "rate_limited") {
      return NextResponse.json({
        ok: false,
        stage: "rate_limit",
        error: "سقف پیام در دقیقه به رسید. یک دقیقه صبر کنید و دوباره تست کنید.",
      });
    }

    if (result.sent > 0) {
      return NextResponse.json({
        ok: true,
        message: "پیام تست به تلگرام ارسال شد. در چت خود بررسی کنید.",
      });
    }

    // ====== ۳. ارسال شد ولی به هیچ چت نرسید ======
    // (خطای هر چت در لاگ سرور چاپ شده)
    return NextResponse.json({
      ok: false,
      stage: "send",
      error:
        "ارسال به تلگرام انجام شد اما پیامی تحویل نشد. علل رایج:\n" +
        "۱. ربات را در تلگرام استارت نکرده‌اید — ابتدا به @BotFather بروید، " +
        "ربات را بسازید و لینک t.me/<botusername> را باز کنید و /start بزنید.\n" +
        "۲. TELEGRAM_CHAT_ID اشتباه است — آیدی خود را از @userinfobot بگیرید.\n" +
        "جزئیات خطا در لاگ سرور (pm2 logs) با پیشوند [Telegram] موجود است.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, stage: "exception", error: error.message },
      { status: 500 }
    );
  }
}
