// src/app/api/admin/scheduled-jobs/[id]/run/route.js
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { runJobNow } from "@/lib/schedulerService";

// ============================================================
// POST: run one job immediately
//
// Note: execution is synchronous so you can see the result. Jobs like
// process-email-queue may take a few tens of seconds.
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await runJobNow(id);

    if (!result.jobKey) {
      return NextResponse.json(
        { message: result.error || "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: result.ok
        ? `"${result.jobKey}" finished${result.summary ? `: ${result.summary}` : ""}`
        : `"${result.jobKey}" failed: ${result.error || "unknown error"}`,
      ...result,
    });
  } catch (error) {
    console.error("Scheduled job run error:", error);
    return NextResponse.json(
      { message: "Failed to run job" },
      { status: 500 }
    );
  }
}
