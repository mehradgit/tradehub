// src/lib/schedulerService.js
// ============================================================
// Scheduling engine
//
// A single endpoint (/api/cron/tick) is called every minute and
// this service decides which jobs are "due".
//
// Locking: each job is "claimed" with a conditional updateMany; only the
// winner of the claim runs it. This prevents duplicate execution even
// when several instances of the app run at the same time.
// ============================================================
import { prisma } from "@/lib/prisma";
import { DEFAULT_JOBS, JOB_HANDLERS, runJobHandler } from "@/lib/jobHandlers";
import { parseCron, matchesCron, getNextRunAt } from "@/lib/cronExpression";

// If a run stays "running" longer than this, it is assumed dead
const STALE_RUN_MS = 10 * 60 * 1000;

// ============================================================
// Create the default jobs (idempotent)
// ============================================================
export async function ensureDefaultJobs() {
  if (DEFAULT_JOBS.length === 0) return;
  try {
    await prisma.scheduledJob.createMany({
      data: DEFAULT_JOBS,
      skipDuplicates: true,
    });
  } catch (err) {
    // If the table does not exist on this database, the whole tick must not break here
    console.error("[scheduler] ensureDefaultJobs failed:", err.message);
  }
}

// ============================================================
// List of jobs + computed status (for the admin panel)
// ============================================================
export async function getJobsWithStatus() {
  await ensureDefaultJobs();

  const jobs = await prisma.scheduledJob.findMany({
    orderBy: { jobKey: "asc" },
  });

  const now = new Date();

  return jobs.map((job) => {
    const parsed = parseCron(job.cronExpression);

    let nextRunAt = null;
    if (parsed.ok) {
      nextRunAt =
        job.nextRunAt && job.nextRunAt > now
          ? job.nextRunAt
          : getNextRunAt(job.cronExpression, now);
    }

    return {
      ...job,
      scheduleValid: parsed.ok,
      scheduleError: parsed.ok ? null : parsed.error,
      computedNextRunAt: nextRunAt,
      handlerExists: Boolean(JOB_HANDLERS[job.handlerKey]),
      handlerName: JOB_HANDLERS[job.handlerKey]?.name || null,
    };
  });
}

// ============================================================
// Run the due jobs
//
// options:
//   jobId          → only this job
//   force          → ignore the schedule (used for "Run now")
//   includeInactive→ also run an inactive job (only for Run now)
// ============================================================
export async function runDueJobs(now = new Date(), options = {}) {
  const { jobId = null, force = false, includeInactive = false } = options;

  await ensureDefaultJobs();

  const where = {};
  if (jobId) where.id = jobId;
  if (!includeInactive) where.isActive = true;

  const jobs = await prisma.scheduledJob.findMany({
    where,
    orderBy: { jobKey: "asc" },
  });

  const minuteStart = new Date(now.getTime());
  minuteStart.setSeconds(0, 0);

  const staleCutoff = new Date(now.getTime() - STALE_RUN_MS);

  const results = [];

  for (const job of jobs) {
    // ===== Schedule validation =====
    const parsed = parseCron(job.cronExpression);
    if (!parsed.ok) {
      results.push({
        jobKey: job.jobKey,
        skipped: `invalid schedule: ${parsed.error}`,
      });
      continue;
    }

    if (!force && !matchesCron(parsed, now)) continue;

    // ===== Atomic lock =====
    // Guard 1: concurrent runs + recovery of a stuck run
    //   (lastRunStatus may be NULL, so it is checked explicitly)
    const guards = [
      {
        OR: [
          { lastRunStatus: null },
          { lastRunStatus: { not: "running" } },
          { lastRunAt: { lt: staleCutoff } },
        ],
      },
    ];

    // Guard 2: in automatic mode, do not run again within the same minute
    if (!force) {
      guards.push({
        OR: [{ lastRunAt: null }, { lastRunAt: { lt: minuteStart } }],
      });
    }

    const claim = await prisma.scheduledJob.updateMany({
      where: { id: job.id, AND: guards },
      data: {
        lastRunStatus: "running",
        lastRunAt: now,
        runCount: { increment: 1 },
        nextRunAt: getNextRunAt(job.cronExpression, now),
      },
    });

    if (claim.count !== 1) {
      results.push({
        jobKey: job.jobKey,
        skipped: "locked (running or already executed this minute)",
      });
      continue;
    }

    // ===== Execution =====
    const outcome = await runJobHandler(job.handlerKey);

    try {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunStatus: outcome.ok ? "success" : "failed",
          lastRunError: outcome.ok
            ? null
            : outcome.error || "Unknown error",
          ...(outcome.ok ? {} : { failCount: { increment: 1 } }),
        },
      });
    } catch (err) {
      console.error("[scheduler] failed to record job result:", err.message);
    }

    results.push({
      jobKey: job.jobKey,
      ok: outcome.ok,
      summary: outcome.summary || null,
      error: outcome.error || null,
    });
  }

  return results;
}

// ============================================================
// Run a job immediately (from the admin panel)
// ============================================================
export async function runJobNow(id) {
  const job = await prisma.scheduledJob.findUnique({ where: { id } });
  if (!job) return { jobKey: null, ok: false, error: "Job not found" };

  const parsed = parseCron(job.cronExpression);
  if (!parsed.ok) {
    return {
      jobKey: job.jobKey,
      ok: false,
      error: `Invalid schedule: ${parsed.error}`,
    };
  }

  const results = await runDueJobs(new Date(), {
    jobId: id,
    force: true,
    includeInactive: true,
  });

  return (
    results[0] || {
      jobKey: job.jobKey,
      ok: false,
      error: "Job is already running",
    }
  );
}

// ============================================================
// Create a new job in the database (for jobs added in code)
// ============================================================
export async function syncJobDefinitions() {
  await ensureDefaultJobs();
  return prisma.scheduledJob.count();
}
