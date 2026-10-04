// src/app/admin/emails/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmailLogActions from "@/components/admin/EmailLogActions";

export const metadata = { title: "Email Detail | Admin" };

const STATUS_META = {
  queued: { cls: "pending", label: "Queued" },
  sent: { cls: "active", label: "Sent" },
  failed: { cls: "suspended", label: "Failed" },
  permanently_failed: { cls: "suspended", label: "Permanently failed" },
  bounced: { cls: "suspended", label: "Bounced" },
};

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, children }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "9px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          width: "130px",
          fontSize: "11px",
          color: "var(--muted)",
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--text)",
          wordBreak: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default async function AdminEmailDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { id } = await params;

  const log = await prisma.emailLog.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, companyName: true },
      },
    },
  });

  if (!log) notFound();

  const html = log.metadata?._html || "";
  const text = log.metadata?._text || "";
  const meta = STATUS_META[log.status] || { cls: "basic", label: log.status };

  return (
    <>
      <AdminPageHeader
        title="Email Detail"
        subtitle={log.subject}
        action={
          <EmailLogActions id={log.id} status={log.status} html={html} />
        }
      />

      <div style={{ marginBottom: "14px" }}>
        <Link
          href="/admin/emails"
          style={{ fontSize: "11px", color: "var(--muted)" }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to email queue
        </Link>
      </div>

      {/* ===== اطلاعات ===== */}
      <div className="admin-card" style={{ padding: "6px 18px", marginBottom: "16px" }}>
        <Row label="Status">
          <span className={`admin-pill ${meta.cls}`}>{meta.label}</span>
        </Row>
        <Row label="Recipient">{log.toEmail}</Row>
        <Row label="Subject">{log.subject}</Row>
        <Row label="Template">
          {log.templateKey ? <code>{log.templateKey}</code> : "—"}
        </Row>
        <Row label="User">
          {log.user
            ? `${log.user.companyName || log.user.name || "—"} (${log.user.email})`
            : "—"}
        </Row>
        <Row label="Attempts">
          {log.retryCount} / {log.maxRetries}
        </Row>
        <Row label="Created">{fmt(log.createdAt)}</Row>
        <Row label="Sent at">{fmt(log.sentAt)}</Row>
        <Row label="Next retry">{fmt(log.nextRetryAt)}</Row>
        <Row label="Provider ID">{log.providerId || "—"}</Row>
        {log.errorMessage && (
          <Row label="Error">
            <span style={{ color: "#e75e5e" }}>{log.errorMessage}</span>
          </Row>
        )}
      </div>

      {/* ===== پیش‌نمایش ===== */}
      {html ? (
        <div
          className="admin-card"
          style={{ padding: 0, overflow: "hidden", marginBottom: "16px" }}
        >
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid var(--line)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--dark)",
            }}
          >
            <i className="fa-solid fa-eye"></i> Rendered preview
            <span
              style={{
                fontWeight: 400,
                color: "var(--muted)",
                marginLeft: "8px",
              }}
            >
              (scripts blocked — content is built from user data)
            </span>
          </div>
          <iframe
            title="Email preview"
            srcDoc={html}
            sandbox=""
            style={{
              width: "100%",
              height: "640px",
              border: 0,
              background: "#fff",
              display: "block",
            }}
          />
        </div>
      ) : (
        <div
          className="admin-card"
          style={{
            padding: "24px",
            marginBottom: "16px",
            fontSize: "11px",
            color: "var(--muted)",
            lineHeight: 1.7,
          }}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>{" "}
          No rendered content is stored for this email, so there is nothing to
          preview or retry. This usually means the template did not exist when
          the event fired. Run{" "}
          <code>node scripts/seed-email-templates.js</code> and trigger the
          event again.
        </div>
      )}

      {/* ===== متن ساده و HTML خام ===== */}
      {text && (
        <details
          className="admin-card"
          style={{ padding: "14px 18px", marginBottom: "16px" }}
        >
          <summary
            style={{
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--dark)",
            }}
          >
            Plain-text version
          </summary>
          <pre
            style={{
              marginTop: "12px",
              fontSize: "11px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "var(--text)",
              lineHeight: 1.7,
            }}
          >
            {text}
          </pre>
        </details>
      )}

      {html && (
        <details className="admin-card" style={{ padding: "14px 18px" }}>
          <summary
            style={{
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--dark)",
            }}
          >
            Raw HTML source
          </summary>
          <pre
            style={{
              marginTop: "12px",
              fontSize: "10px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              color: "var(--muted)",
              maxHeight: "420px",
              overflow: "auto",
              lineHeight: 1.6,
            }}
          >
            {html}
          </pre>
        </details>
      )}
    </>
  );
}
