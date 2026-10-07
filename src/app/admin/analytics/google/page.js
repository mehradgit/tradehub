// src/app/admin/analytics/google/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import GoogleAnalyticsDashboard from "@/components/admin/GoogleAnalyticsDashboard";

export const metadata = { title: "Google Analytics | Admin" };

export default async function AdminGoogleAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  return (
    <>
      <AdminPageHeader
        title="Google Analytics"
        subtitle="Real-time traffic, top pages and audience insights from your Google Analytics 4 property"
      />
      <GoogleAnalyticsDashboard />
    </>
  );
}