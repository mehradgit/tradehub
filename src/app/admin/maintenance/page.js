// src/app/admin/maintenance/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import MaintenanceTools from "@/components/admin/MaintenanceTools";

export const metadata = { title: "Maintenance | Admin" };

export default async function AdminMaintenancePage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  return (
    <>
      <AdminPageHeader
        title="Maintenance"
        subtitle="Housekeeping tools for existing data — rebuild the search indexes and normalise legacy vocabulary values. Both tools are safe to re-run."
      />
      <MaintenanceTools />
    </>
  );
}
