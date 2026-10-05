// src/lib/emailQueueService.js
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { renderEmail } from "@/lib/emailTemplateService";

// ============================================================
// Transporter
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================================
// Add an email to the queue
// ============================================================
export async function queueEmail({
  userId = null,
  toEmail,
  templateKey = null,
  subject = null,
  htmlBody = null,
  textBody = null,
  variables = {},
  metadata = null,
}) {
  try {
    if (!toEmail) {
      console.warn("[EmailQueue] No toEmail, skipping");
      return null;
    }

    let finalSubject = subject;
    let finalHtml = htmlBody;
    let finalText = textBody;

    // If we have a templateKey and subject/htmlBody were not passed, use the template
    if (templateKey && (!finalSubject || !finalHtml)) {
      const rendered = await renderEmail(templateKey, variables);
      if (!rendered) {
        console.warn(`[EmailQueue] Template render failed: ${templateKey}`);
        return null;
      }
      finalSubject = finalSubject || rendered.subject;
      finalHtml = finalHtml || rendered.htmlBody;
      finalText = finalText || rendered.textBody;
    }

    if (!finalSubject || !finalHtml) {
      console.warn("[EmailQueue] Missing subject or html");
      return null;
    }

    const log = await prisma.emailLog.create({
      data: {
        userId,
        toEmail,
        templateKey,
        subject: finalSubject,
        status: "queued",
        metadata: metadata || undefined,
      },
    });

    // We temporarily store the email content in metadata so the worker can use it
    // (instead of a separate column, to keep phase 1 simple)
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        metadata: {
          ...(metadata || {}),
          _html: finalHtml,
          _text: finalText,
        },
      },
    });

    return log;
  } catch (error) {
    console.error("[EmailQueue] queueEmail error:", error);
    return null;
  }
}

// ============================================================
// Process the queue (batch)
// options.ids — if provided, only those rows are processed
// (for manual retry from the admin panel)
// ============================================================
export async function processEmailQueue(limit = 30, options = {}) {
  const { ids = null } = options;
  const now = new Date();

  const pending = await prisma.emailLog.findMany({
    where: {
      status: "queued",
      ...(ids ? { id: { in: ids } } : {}),
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const log of pending) {
    const html = log.metadata?._html;
    const text = log.metadata?._text;

    if (!html) {
      await markPermanentlyFailed(log.id, "Missing HTML content");
      failed++;
      continue;
    }

    try {
      const info = await transporter.sendMail({
        from: `"FoodTradeLink" <${process.env.SMTP_USER}>`,
        to: log.toEmail,
        subject: log.subject,
        html,
        text,
      });

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          providerId: info.messageId || null,
        },
      });
      sent++;
    } catch (err) {
      failed++;
      await handleFailure(log, err.message);
    }
  }

  return { processed: pending.length, sent, failed };
}

// ============================================================
// Error handling and retry
// ============================================================
async function handleFailure(log, errorMessage) {
  const newRetryCount = log.retryCount + 1;
  const maxRetries = log.maxRetries || 3;

  if (newRetryCount >= maxRetries) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "permanently_failed",
        errorMessage,
        retryCount: newRetryCount,
        nextRetryAt: null,
      },
    });
    return;
  }

  // Exponential backoff: 1min, 5min, 30min
  const delays = [60, 5 * 60, 30 * 60];
  const delaySeconds = delays[newRetryCount - 1] || 30 * 60;

  await prisma.emailLog.update({
    where: { id: log.id },
    data: {
      status: "queued",
      errorMessage,
      retryCount: newRetryCount,
      nextRetryAt: new Date(Date.now() + delaySeconds * 1000),
    },
  });
}

async function markPermanentlyFailed(id, errorMessage) {
  await prisma.emailLog.update({
    where: { id },
    data: {
      status: "permanently_failed",
      errorMessage,
    },
  });
}

// ============================================================
// Manually retry a single email (from the admin panel)
//
// Only rows whose rendered content was stored (metadata._html) can be
// retried. If the initial render failed (for example the template did not
// exist), retrying is pointless and a clear message is returned.
// ============================================================
export async function retryEmailLog(id) {
  const log = await prisma.emailLog.findUnique({ where: { id } });

  if (!log) {
    return { ok: false, error: "Email log not found" };
  }
  if (log.status === "sent") {
    return { ok: false, error: "This email was already sent" };
  }
  if (!log.metadata?._html) {
    return {
      ok: false,
      error:
        "No rendered content stored for this email. Make sure the template exists (run the seed script) and trigger the event again.",
    };
  }

  await prisma.emailLog.update({
    where: { id },
    data: {
      status: "queued",
      retryCount: 0,
      errorMessage: null,
      nextRetryAt: null,
    },
  });

  const result = await processEmailQueue(1, { ids: [id] });

  const updated = await prisma.emailLog.findUnique({
    where: { id },
    select: { status: true, errorMessage: true, sentAt: true },
  });

  return { ok: true, result, log: updated };
}

// ============================================================
// Manually retry all failed emails (failed + permanently_failed)
// ============================================================
export async function retryAllFailedEmails(batchSize = 20) {
  const failed = await prisma.emailLog.findMany({
    where: {
      status: { in: ["failed", "permanently_failed"] },
    },
    select: { id: true, metadata: true },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  // ✅ Filtering in JS — filtering on null for a Json column in Prisma is fragile
  const retryable = failed.filter((l) => l.metadata?._html);

  if (retryable.length === 0) {
    return { requeued: 0, sent: 0, failed: 0, skipped: failed.length };
  }

  const ids = retryable.map((l) => l.id);

  await prisma.emailLog.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "queued",
      retryCount: 0,
      errorMessage: null,
      nextRetryAt: null,
    },
  });

  const result = await processEmailQueue(ids.length, { ids });

  return { requeued: ids.length, skipped: failed.length - ids.length, ...result };
}

// ============================================================
// Send a test email from the admin panel
// Renders the template with sample variables and sends it immediately so the
// admin can check SMTP and the template before the real event.
// ============================================================
export async function sendTestEmail({ toEmail, templateKey, variables }) {
  if (!toEmail) return { ok: false, error: "No recipient email" };

  const rendered = await renderEmail(templateKey, variables || {});
  if (!rendered) {
    return {
      ok: false,
      error: `Template "${templateKey}" is missing or inactive. Run: node scripts/seed-email-templates.js`,
    };
  }

  const log = await queueEmail({
    toEmail,
    templateKey,
    subject: `[TEST] ${rendered.subject}`,
    htmlBody: rendered.htmlBody,
    textBody: rendered.textBody,
    metadata: { test: true, templateKey },
  });

  if (!log) {
    return { ok: false, error: "Could not queue the test email" };
  }

  const result = await processEmailQueue(1, { ids: [log.id] });

  const updated = await prisma.emailLog.findUnique({
    where: { id: log.id },
    select: { status: true, errorMessage: true },
  });

  return {
    ok: updated?.status === "sent",
    error: updated?.errorMessage || null,
    result,
    log: updated,
  };
}

