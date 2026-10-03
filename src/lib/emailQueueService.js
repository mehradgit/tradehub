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
// افزودن ایمیل به صف
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

    // اگر templateKey داریم و subject/htmlBody پاس نشده، از قالب استفاده کن
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

    // محتوای ایمیل را در metadata موقت ذخیره می‌کنیم تا worker از آن استفاده کند
    // (به‌جای ستون جدا، برای سادگی فاز ۱)
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
// پردازش صف (batch)
// ============================================================
export async function processEmailQueue(limit = 30) {
  const now = new Date();

  const pending = await prisma.emailLog.findMany({
    where: {
      status: "queued",
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
// مدیریت خطا و retry
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