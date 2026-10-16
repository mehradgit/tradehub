// src/app/api/admin/emails/send/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { queueEmail } from "@/lib/emailQueueService";

// ===== Guard: verify the admin =====
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { ok: true };
}

// ============================================================
// POST: send a manual email from the site to any recipient.
// The email is queued and sent from the site's SMTP identity
// ("FoodTradeLink" <SMTP_USER>) by the queue worker.
// ============================================================
export async function POST(request) {
  const guard = await checkAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { toEmail, subject, htmlBody, textBody } = await request.json();

    if (!toEmail || !subject || !htmlBody) {
      return NextResponse.json(
        { message: "Recipient, subject and body are required" },
        { status: 400 }
      );
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toEmail)) {
      return NextResponse.json(
        { message: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    const log = await queueEmail({
      userId: null,
      toEmail,
      subject,
      htmlBody,
      textBody: textBody || null,
      metadata: { source: "admin-compose" },
    });

    if (!log) {
      return NextResponse.json(
        { message: "Failed to queue the email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Email queued - it will be sent from the site shortly",
      id: log.id,
    });
  } catch (error) {
    console.error("[Admin Send Email]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
