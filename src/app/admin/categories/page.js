// src/app/admin/categories/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CategoryManager from "@/components/admin/CategoryManager";
import { getCategories } from "@/lib/categoriesService";

export const metadata = { title: "Categories | Admin" };

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const [categories, productCounts, requestCounts] = await Promise.all([
    getCategories(),
    prisma.product.groupBy({
      by: ["category"],
      _count: true,
    }),
    prisma.buyingRequest.groupBy({
      by: ["category"],
      _count: true,
    }),
  ]);

  const productMap = Object.fromEntries(
    productCounts.map((p) => [p.category, p._count])
  );
  const requestMap = Object.fromEntries(
    requestCounts.map((r) => [r.category, r._count])
  );

  return (
    <>
      <AdminPageHeader
        title="Categories Management"
        subtitle={`${categories.filter((c) => c.parent === 0).length} main categories · ${categories.filter((c) => c.parent !== 0).length} subcategories`}
      />

      <CategoryManager
        initialCategories={categories}
        productCounts={productMap}
        requestCounts={requestMap}
      />
    </>
  );
}