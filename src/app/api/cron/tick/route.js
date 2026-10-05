// src/app/api/cron/tick/route.js
// ============================================================
// The only endpoint the system scheduler should call (every minute).
//
// This endpoint reads from the ScheduledJob table and runs every job
// whose time has arrived. That means changing a schedule or
// turning a job off no longer requires touching the server.
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
