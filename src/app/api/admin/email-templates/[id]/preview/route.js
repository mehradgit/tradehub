// src/app/api/admin/email-templates/[id]/preview/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderEmail } from "@/lib/emailTemplateService";

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
// GET: render a template with sample data so admins can
// preview the real output (layout + body) before saving.
// ============================================================
export async function GET(_request, { params }) {
  const guard = await checkAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    // Sample variables so the preview looks real
    const sampleVars = {
      userName: "John Doe",
      companyName: "Acme Foods Ltd.",
      year: String(new Date().getFullYear()),
      dashboardUrl: "https://foodtradelink.com/dashboard",
      productName: "Organic Dates 10kg Box",
      productUrl: "https://foodtradelink.com/products/1001/organic-dates",
      buyerName: "Global Retail Co.",
      inquiriesUrl: "https://foodtradelink.com/dashboard/inquiries",
      message:
        "Hello, I am interested in your product. Could you share pricing and availability?",
      orderNumber: "INV-2026-0001",
      amount: "$1,250.00",
      content:
        "<p>This is a sample message body. In a real email this area contains the actual message.</p>",
    };

    const rendered = await renderEmail(template.key, sampleVars);

    if (!rendered) {
      return NextResponse.json(
        { message: "Could not render template" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      key: template.key,
      name: template.name,
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
      textBody: rendered.textBody,
    });
  } catch (error) {
    console.error("[Email Template Preview]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
