// src/app/admin/email-templates/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";

export const metadata = { title: "Email Templates | Admin" };

export default async function AdminEmailTemplatesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      subject: true,
      htmlBody: true,
      textBody: true,
      category: true,
      variables: true,
      isActive: true,
      updatedAt: true,
    },
  });

  const serialized = templates.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name,
    description: t.description,
    subject: t.subject,
    htmlBody: t.htmlBody,
    textBody: t.textBody,
    category: t.category,
    variables: t.variables,
    isActive: t.isActive,
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        title="Email Templates"
        subtitle={`${serialized.length} template(s) · edits apply immediately`}
      />
      <EmailTemplateEditor templates={serialized} />
    </>
  );
}
