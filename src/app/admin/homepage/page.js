// src/app/admin/homepage/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import HomepageManager from "@/components/admin/HomepageManager";
import { getHomepageSections } from "@/lib/homepageService";
import { getCategories } from "@/lib/categoriesService";

export const metadata = { title: "Homepage Sections | Admin" };

export default async function AdminHomepagePage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const [sections, categories] = await Promise.all([
    getHomepageSections(),
    getCategories(),
  ]);

  // Filter to active only
  const activeCategories = categories.filter((c) => c.isActive !== false);

  return (
    <>
      <AdminPageHeader
        title="Homepage Sections"
        subtitle={`${sections.length} sections · ${sections.filter((s) => s.isActive).length} active`}
      />

      <HomepageManager
        initialSections={sections}
        categories={activeCategories}
      />
    </>
  );
}