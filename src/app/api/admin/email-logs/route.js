// src/app/api/admin/email-logs/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { retryAllFailedEmails, processEmailQueue } from "@/lib/emailQueueService";

// ============================================================
// GET: لیست لاگ ایمیل‌ها + آمار
// ============================================================
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const templateKey = searchParams.get("templateKey") || "";
    const search = searchParams.get("search") || "";

    // ✅ محدودسازی صفحه/تعداد، تا کسی نتواند کل جدول را بکشد
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (templateKey) where.templateKey = templateKey;
    if (search) {
      where.OR = [
        { toEmail: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    const [logs, totalCount, stats, templates] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        // ⚠️ metadata عمداً انتخاب نمی‌شود؛ حاوی HTML کامل ایمیل است
        select: {
          id: true,
          userId: true,
          toEmail: true,
          subject: true,
          templateKey: true,
          status: true,
          errorMessage: true,
          retryCount: true,
          maxRetries: true,
          nextRetryAt: true,
          sentAt: true,
          createdAt: true,
        },
      }),
      prisma.emailLog.count({ where }),
      Promise.all([
        prisma.emailLog.count({ where: { status: "queued" } }),
        prisma.emailLog.count({ where: { status: "sent" } }),
        prisma.emailLog.count({ where: { status: "failed" } }),
        prisma.emailLog.count({ where: { status: "permanently_failed" } }),
      ]),
      prisma.emailTemplate.findMany({
        select: { key: true, name: true },
        orderBy: { key: "asc" },
      }),
    ]);

    const [queued, sent, failed, permanentlyFailed] = stats;

    return NextResponse.json({
      logs,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats: {
        queued,
        sent,
        failed,
        permanentlyFailed,
        total: queued + sent + failed + permanentlyFailed,
      },
      templates,
    });
  } catch (error) {
    console.error("Email logs fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: عملیات گروهی
// body: { action: "retry-all-failed" | "process-queue" }
// ============================================================
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "retry-all-failed") {
      const result = await retryAllFailedEmails(20);
      return NextResponse.json({
        message: `${result.sent || 0} email(s) re-sent, ${
          result.failed || 0
        } failed`,
        ...result,
      });
    }

    if (action === "process-queue") {
      const result = await processEmailQueue(30);
      return NextResponse.json({
        message: `Queue processed: ${result.sent} sent, ${result.failed} failed`,
        ...result,
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Email logs action error:", error);
    return NextResponse.json(
      { message: "Failed to run the action" },
      { status: 500 }
    );
  }
}
