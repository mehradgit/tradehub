// src/app/api/cron/process-email-queue/route.js
import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/emailQueueService";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  try {
    if (CRON_SECRET) {
      const { searchParams } = new URL(request.url);
      const secret =
        searchParams.get("secret") ||
        request.headers.get("x-cron-secret");
      if (secret !== CRON_SECRET) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await processEmailQueue(30);
    return NextResponse.json({
      message: "Email queue processed",
      ...result,
    });
  } catch (error) {
    console.error("[Cron] email queue error:", error);
    return NextResponse.json(
      { message: "Failed to process queue", error: error.message },
      { status: 500 }
    );
  }
}