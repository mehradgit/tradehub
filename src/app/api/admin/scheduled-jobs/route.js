// src/app/api/admin/scheduled-jobs/route.js
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getJobsWithStatus } from "@/lib/schedulerService";
import { CRON_PRESETS } from "@/lib/cronExpression";
import { JOB_HANDLERS } from "@/lib/jobHandlers";

// ============================================================
// GET: list of scheduled jobs + status
// ============================================================
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const jobs = await getJobsWithStatus();

    const serialized = jobs.map((j) => ({
      id: j.id,
      jobKey: j.jobKey,
      name: j.name,
      description: j.description,
      handlerKey: j.handlerKey,
      cronExpression: j.cronExpression,
      isActive: j.isActive,
      lastRunAt: j.lastRunAt ? j.lastRunAt.toISOString() : null,
      nextRunAt: j.computedNextRunAt
        ? j.computedNextRunAt.toISOString()
        : null,
      lastRunStatus: j.lastRunStatus,
      lastRunError: j.lastRunError,
      runCount: j.runCount,
      failCount: j.failCount,
      scheduleValid: j.scheduleValid,
      scheduleError: j.scheduleError,
      handlerExists: j.handlerExists,
      handlerName: j.handlerName,
    }));

    return NextResponse.json({
      jobs: serialized,
      presets: CRON_PRESETS,
      // handler keys available in the code — so the admin knows which
      // jobs can actually be created
      availableHandlers: Object.entries(JOB_HANDLERS).map(([key, def]) => ({
        key,
        name: def.name,
        description: def.description,
        defaultCron: def.defaultCron,
      })),
    });
  } catch (error) {
    console.error("Scheduled jobs fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch scheduled jobs" },
      { status: 500 }
    );
  }
}
