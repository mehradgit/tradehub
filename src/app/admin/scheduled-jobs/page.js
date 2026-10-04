// src/app/admin/scheduled-jobs/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ScheduledJobsManager from "@/components/admin/ScheduledJobsManager";
import { getJobsWithStatus } from "@/lib/schedulerService";
import { CRON_PRESETS } from "@/lib/cronExpression";
import { JOB_HANDLERS } from "@/lib/jobHandlers";

export const metadata = { title: "Scheduled Jobs | Admin" };

export default async function AdminScheduledJobsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const jobs = await getJobsWithStatus();

  const serialized = jobs.map((j) => ({
    id: j.id,
    jobKey: j.jobKey,
    name: j.name,
    description: j.description,
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
  }));

  const activeCount = serialized.filter((j) => j.isActive).length;
  const failingCount = serialized.filter(
    (j) => j.lastRunStatus === "failed"
  ).length;

  const availableHandlers = Object.entries(JOB_HANDLERS).map(([key, def]) => ({
    key,
    name: def.name,
    defaultCron: def.defaultCron,
  }));

  return (
    <>
      <AdminPageHeader
        title="Scheduled Jobs"
        subtitle={`${serialized.length} job(s) · ${activeCount} active${
          failingCount ? ` · ${failingCount} failing` : ""
        } · driven by /api/cron/tick`}
      />

      <ScheduledJobsManager
        initialJobs={serialized}
        presets={CRON_PRESETS}
        availableHandlers={availableHandlers}
      />
    </>
  );
}
