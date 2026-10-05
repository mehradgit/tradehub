// src/app/api/admin/email-templates/[id]/test/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/emailQueueService";

// ============================================================
// Sample values for the template variables
// ============================================================
function baseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return String(raw).replace(/\/+$/, "");
}

const SAMPLE_VARIABLES = {
  userName: "Test Admin",
  companyName: "FoodTradeLink Test Co.",
  dashboardUrl: `${baseUrl()}/dashboard`,
  productName: "Sample Organic Honey",
  productUrl: `${baseUrl()}/products`,
  requestTitle: "Sample Buying Request — 20MT Honey",
  requestUrl: `${baseUrl()}/requests`,
  rejectionNote: "The description was too short. Please add more details.",
  message: "This is a sample inquiry message body.",
  messagePreview: "This is a sample message preview.",
  buyerName: "Sample Buyer Co.",
  supplierName: "Sample Supplier Co.",
  offeredPrice: "$1,250.00",
  inquiriesUrl: `${baseUrl()}/dashboard/inquiries?tab=supplier`,
  ticketNumber: "1001",
  ticketSubject: "Sample support ticket subject",
  ticketUrl: `${baseUrl()}/dashboard/support/1001`,
  adminUrl: `${baseUrl()}/admin/tickets/1001`,
  requesterName: "Sample Requester",
  ticketCategory: "general",
  ticketPriority: "medium",
};

// ============================================================
// POST: send a test email to the admin's own email address
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      select: { key: true, variables: true, isActive: true },
    });

    if (!template) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    // Sample variables plus any declared variable that has no sample value
    const declared = Array.isArray(template.variables)
      ? template.variables
      : [];
    const variables = { ...SAMPLE_VARIABLES };
    for (const key of declared) {
      if (variables[key] === undefined) variables[key] = `[${key}]`;
    }

    // ✅ Sent only to the admin's own email address (never an arbitrary address)
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    const toEmail = admin?.email || session.user.email;

    if (!toEmail) {
      return NextResponse.json(
        { message: "Your admin account has no email address" },
        { status: 400 }
      );
    }

    const result = await sendTestEmail({
      toEmail,
      templateKey: template.key,
      variables,
    });

    if (!result.ok) {
      return NextResponse.json(
        { message: result.error || "Test email failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Test email sent to ${toEmail}`,
      sentTo: toEmail,
    });
  } catch (error) {
    console.error("Email template test error:", error);
    return NextResponse.json(
      { message: "Failed to send test email" },
      { status: 500 }
    );
  }
}
