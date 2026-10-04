// src/app/admin/emails/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import EmailLogsTable from "@/components/admin/EmailLogsTable";
import EmailBulkActions from "@/components/admin/EmailBulkActions";

export const metadata = { title: "Email Queue | Admin" };

export default async function AdminEmailsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    page: pageParam = 1,
    status = "",
    templateKey = "",
    search = "",
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam) || 1);
  const limit = 20;
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

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [logs, totalCount, stats, templates, sentLast24h] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      // ⚠️ metadata انتخاب نمی‌شود؛ حاوی HTML کامل ایمیل است
      select: {
        id: true,
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
    prisma.emailLog.count({
      where: { status: "sent", sentAt: { gte: last24h } },
    }),
  ]);

  const [queuedCount, sentCount, failedCount, permFailedCount] = stats;
  const totalPages = Math.ceil(totalCount / limit);

  const serialized = logs.map((l) => ({
    id: l.id,
    toEmail: l.toEmail,
    subject: l.subject,
    templateKey: l.templateKey,
    status: l.status,
    errorMessage: l.errorMessage,
    retryCount: l.retryCount,
    maxRetries: l.maxRetries,
    nextRetryAt: l.nextRetryAt ? l.nextRetryAt.toISOString() : null,
    sentAt: l.sentAt ? l.sentAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        title="Email Queue"
        subtitle={`${totalCount} total · ${sentLast24h} sent in the last 24h`}
        action={<EmailBulkActions failedCount={failedCount + permFailedCount} />}
      />

      {/* Stats */}
      <div
        className="admin-kpis"
        style={{ marginBottom: 16, gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon orange-bg">
            <i className="fa-solid fa-clock"></i>
          </div>
          <h4>Queued</h4>
          <strong>{queuedCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon green-bg">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <h4>Sent</h4>
          <strong>{sentCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon red-bg">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h4>Failed</h4>
          <strong>{failedCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon purple-bg">
            <i className="fa-solid fa-ban"></i>
          </div>
          <h4>Permanent fail</h4>
          <strong>{permFailedCount}</strong>
        </div>
      </div>

      <AdminFilterBar
        searchPlaceholder="Search by recipient or subject..."
        filters={[
          {
            name: "status",
            placeholder: "All Statuses",
            options: [
              { value: "queued", label: "Queued" },
              { value: "sent", label: "Sent" },
              { value: "failed", label: "Failed" },
              { value: "permanently_failed", label: "Permanent fail" },
            ],
          },
          {
            name: "templateKey",
            placeholder: "All Templates",
            options: templates.map((t) => ({
              value: t.key,
              label: t.name || t.key,
            })),
          },
        ]}
      />

      <EmailLogsTable logs={serialized} />

      <AdminPagination currentPage={page} totalPages={totalPages} />
    </>
  );
}
