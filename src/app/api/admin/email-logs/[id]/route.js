// src/app/api/admin/email-logs/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { retryEmailLog } from "@/lib/emailQueueService";

// ============================================================
// POST: retry یک ایمیل
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await retryEmailLog(id);

    if (!result.ok) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    const sentOk = result.log?.status === "sent";

    return NextResponse.json({
      message: sentOk
        ? "Email sent successfully"
        : `Retry failed: ${result.log?.errorMessage || "unknown error"}`,
      ...result,
    });
  } catch (error) {
    console.error("Email retry error:", error);
    return NextResponse.json(
      { message: "Failed to retry email" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE: حذف یک ردیف لاگ
// ============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.emailLog.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Log not found" }, { status: 404 });
    }

    await prisma.emailLog.delete({ where: { id } });

    return NextResponse.json({ message: "Log deleted" });
  } catch (error) {
    console.error("Email log delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete log" },
      { status: 500 }
    );
  }
}
