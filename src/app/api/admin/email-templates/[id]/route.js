// src/app/api/admin/email-templates/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { clearTemplateCache } from "@/lib/emailTemplateService";

// ============================================================
// helper: استخراج متغیرهای {{...}} از یک متن
// ============================================================
function extractVariables(text) {
  if (!text) return [];
  const found = new Set();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(text))) !== null) {
    found.add(m[1]);
  }
  return [...found];
}

// ============================================================
// GET: یک قالب
// ============================================================
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const template = await prisma.emailTemplate.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Email template fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH: ویرایش قالب
// ============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      subject,
      htmlBody,
      textBody,
      category,
      variables,
      isActive,
    } = body;

    const data = {};

    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof description === "string")
      data.description = description.trim() || null;
    if (typeof subject === "string" && subject.trim())
      data.subject = subject.trim();
    if (typeof htmlBody === "string" && htmlBody.trim())
      data.htmlBody = htmlBody;
    if (typeof textBody === "string")
      data.textBody = textBody.trim() || null;
    if (typeof category === "string" && category.trim())
      data.category = category.trim();
    if (Array.isArray(variables)) data.variables = variables;
    if (typeof isActive === "boolean") data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 }
      );
    }

    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    data.updatedById = session.user.id;

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data,
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        subject: true,
        category: true,
        variables: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // ✅ کش درون‌پروسه‌ای پاک می‌شود تا تغییر فوراً اعمال شود
    clearTemplateCache(updated.key);

    // ===== بررسی هشدارها (بلاک‌کننده نیست) =====
    const warnings = [];
    const declared = Array.isArray(updated.variables)
      ? updated.variables
      : [];
    const used = extractVariables(
      `${updated.subject} ${data.htmlBody || ""}`
    );
    const undeclared = used.filter((v) => !declared.includes(v));
    if (undeclared.length > 0) {
      warnings.push(
        `These placeholders are used but not declared in variables: ${undeclared.join(
          ", "
        )}`
      );
    }

    return NextResponse.json({
      message: "Template updated",
      template: updated,
      warnings,
    });
  } catch (error) {
    console.error("Email template update error:", error);
    return NextResponse.json(
      { message: "Failed to update template" },
      { status: 500 }
    );
  }
}
