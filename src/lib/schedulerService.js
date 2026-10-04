// src/lib/schedulerService.js
// ============================================================
// موتور زمان‌بندی
//
// یک endpoint واحد (/api/cron/tick) هر دقیقه صدا زده می‌شود و
// این سرویس تصمیم می‌گیرد کدام job ها «سررسیده»اند.
//
// قفل: هر job با یک updateMany شرطی «رزرو» می‌شود؛ فقط برنده‌ی
// رزرو اجرا می‌کند. این کار حتی با چند نمونه‌ی همزمان اپ هم
// از اجرای تکراری جلوگیری می‌کند.
// ============================================================
import { prisma } from "@/lib/prisma";
import { DEFAULT_JOBS, JOB_HANDLERS, runJobHandler } from "@/lib/jobHandlers";
import { parseCron, matchesCron, getNextRunAt } from "@/lib/cronExpression";

// اگر یک اجرا بیش از این مدت «running» بماند، مرده فرض می‌شود
const STALE_RUN_MS = 10 * 60 * 1000;

// ============================================================
// ساخت job های پیش‌فرض (idempotent)
// ============================================================
export async function ensureDefaultJobs() {
  if (DEFAULT_JOBS.length === 0) return;
  try {
    await prisma.scheduledJob.createMany({
      data: DEFAULT_JOBS,
      skipDuplicates: true,
    });
  } catch (err) {
    // اگر جدول روی این دیتابیس وجود نداشت، اینجا نباید کل tick بشکند
    console.error("[scheduler] ensureDefaultJobs failed:", err.message);
  }
}

// ============================================================
// لیست job ها + وضعیت محاسبه‌شده (برای پنل ادمین)
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
// اجرای job های سررسیده
//
// options:
//   jobId          → فقط همین job
//   force          → بدون توجه به زمان‌بندی (برای «Run now»)
//   includeInactive→ اجرای job غیرفعال (فقط برای Run now)
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
    // ===== اعتبارسنجی زمان‌بندی =====
    const parsed = parseCron(job.cronExpression);
    if (!parsed.ok) {
      results.push({
        jobKey: job.jobKey,
        skipped: `invalid schedule: ${parsed.error}`,
      });
      continue;
    }

    if (!force && !matchesCron(parsed, now)) continue;

    // ===== قفل اتمیک =====
    // محافظ ۱: اجرای همزمان + بازیابی اجرای گیرکرده
    //   (lastRunStatus ممکن است NULL باشد، پس صریح چک می‌شود)
    const guards = [
      {
        OR: [
          { lastRunStatus: null },
          { lastRunStatus: { not: "running" } },
          { lastRunAt: { lt: staleCutoff } },
        ],
      },
    ];

    // محافظ ۲: در حالت خودکار، در همان دقیقه دوباره اجرا نشود
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

    // ===== اجرا =====
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
// اجرای فوری یک job (از پنل ادمین)
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
// ساخت job جدید در دیتابیس (برای job هایی که در کد اضافه شده‌اند)
// ============================================================
export async function syncJobDefinitions() {
  await ensureDefaultJobs();
  return prisma.scheduledJob.count();
}
