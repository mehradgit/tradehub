// src/app/api/cron/process-email-queue/route.js
import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/emailQueueService";
import { isAuthorizedCron } from "@/lib/cronAuth";

export async function GET(request) {
  // ✅ fail-closed: if CRON_SECRET is not set, no request is authorized.
  //    The old version placed this condition inside an if, meaning that
  //    with an empty variable the check was skipped entirely and the endpoint became public.
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
    // ✅ The internal error message is not leaked outward
    return NextResponse.json(
      { message: "Failed to process queue" },
      { status: 500 }
    );
  }
}
