// src/app/api/cron/process-email-queue/route.js
import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/emailQueueService";
import { isAuthorizedCron } from "@/lib/cronAuth";

export async function GET(request) {
  // ✅ fail-closed: اگر CRON_SECRET ست نشده باشد، هیچ درخواستی مجاز نیست.
  //    نسخه‌ی قدیمی این شرط را داخل if می‌گذاشت، یعنی با خالی‌بودن
  //    متغیر، بررسی کلاً رد می‌شد و endpoint عمومی می‌شد.
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processEmailQueue(30);
    return NextResponse.json({
      message: "Email queue processed",
      ...result,
    });
  } catch (error) {
    console.error("[Cron] email queue error:", error);
    // ✅ پیام خطای داخلی به بیرون درز نمی‌کند
    return NextResponse.json(
      { message: "Failed to process queue" },
      { status: 500 }
    );
  }
}
