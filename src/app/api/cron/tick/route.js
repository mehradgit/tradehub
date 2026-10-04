// src/app/api/cron/tick/route.js
// ============================================================
// تنها endpointی که زمان‌بند سیستم باید صدا بزند (هر دقیقه).
//
// این endpoint از جدول ScheduledJob می‌خواند و هر job ی که
// زمانش رسیده باشد اجرا می‌کند. یعنی برای تغییر زمان‌بندی یا
// خاموش‌کردن یک job دیگر لازم نیست به سرور دست بزنی.
// ============================================================
import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { runDueJobs } from "@/lib/schedulerService";

export async function GET(request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const startedAt = Date.now();
    const results = await runDueJobs(new Date());

    const executed = results.filter((r) => r.skipped === undefined);
    const skipped = results.filter((r) => r.skipped !== undefined);

    return NextResponse.json({
      message: "Tick processed",
      executed: executed.length,
      skipped: skipped.length,
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (error) {
    console.error("[Cron] tick error:", error);
    return NextResponse.json({ message: "Tick failed" }, { status: 500 });
  }
}
