import SettingsForm from "@/components/admin/SettingsForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");
  return <SettingsForm />;
}