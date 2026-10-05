// src/app/api/admin/scheduled-jobs/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { parseCron, getNextRunAt } from "@/lib/cronExpression";

// ============================================================
// PATCH: edit schedule / name / active state
// ============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const { name, description, cronExpression, isActive } = body;

    const data = {};

    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof description === "string")
      data.description = description.trim() || null;
    if (typeof isActive === "boolean") data.isActive = isActive;

    // ===== Schedule validation =====
    if (typeof cronExpression === "string" && cronExpression.trim()) {
      const expr = cronExpression.trim();
      const parsed = parseCron(expr);

      if (!parsed.ok) {
        return NextResponse.json(
          { message: `Invalid schedule: ${parsed.error}` },
          { status: 400 }
        );
      }

      data.cronExpression = expr;
      data.nextRunAt = getNextRunAt(expr);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 }
      );
    }

    const existing = await prisma.scheduledJob.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const updated = await prisma.scheduledJob.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: "Job updated",
      job: {
        id: updated.id,
        jobKey: updated.jobKey,
        name: updated.name,
        description: updated.description,
        cronExpression: updated.cronExpression,
        isActive: updated.isActive,
        nextRunAt: updated.nextRunAt ? updated.nextRunAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Scheduled job update error:", error);
    return NextResponse.json(
      { message: "Failed to update job" },
      { status: 500 }
    );
  }
}
