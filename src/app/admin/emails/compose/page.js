import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmailComposeForm from "@/components/admin/EmailComposeForm";

export const metadata = { title: "Compose Email | Admin" };

export default async function AdminComposeEmailPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  // Ensure the layout can be imported lazily (avoids a circular import)
  return (
    <>
      <AdminPageHeader
        title="Compose Email"
        subtitle="Send an email from the site to any recipient"
      />
      <EmailComposeForm />
    </>
  );
}
