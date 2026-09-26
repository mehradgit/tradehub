// src/app/admin/categories/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { categories as allCategories } from "@/lib/categories";

export const metadata = { title: "Categories | Admin" };

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  // محاسبه تعداد محصولات و درخواست‌ها برای هر دسته اصلی
  const [productCounts, requestCounts] = await Promise.all([
    prisma.product.groupBy({
      by: ["category"],
      _count: true,
    }),
    prisma.buyingRequest.groupBy({
      by: ["category"],
      _count: true,
    }),
  ]);

  const productMap = Object.fromEntries(productCounts.map((p) => [p.category, p._count]));
  const requestMap = Object.fromEntries(requestCounts.map((r) => [r.category, r._count]));

  const mainCategories = allCategories.filter((c) => c.parent === 0);

  return (
    <>
      <AdminPageHeader
        title="Categories Management"
        subtitle={`${mainCategories.length} main categories with subcategories`}
        action={
          <button
            style={{
              background: "var(--green2)",
              color: "white",
              border: 0,
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i>
            Add Category
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {mainCategories.map((cat) => {
          const subcategories = allCategories.filter((c) => c.parent === cat.id);
          const productCount = productMap[cat.name] || 0;
          const requestCount = requestMap[cat.name] || 0;

          return (
            <div className="admin-card" key={cat.id}>
              <div className="admin-card-head">
                <div>
                  <div className="admin-title">{cat.name}</div>
                  <div className="admin-subtitle">
                    {subcategories.length} subcategories
                  </div>
                </div>
                <button
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "var(--bg)", border: 0,
                    color: "var(--muted)", cursor: "pointer",
                    display: "grid", placeItems: "center", fontSize: 11,
                  }}
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green2)" }}>
                    {productCount}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>Products</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--blue)" }}>
                    {requestCount}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>Requests</div>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {subcategories.slice(0, 8).map((sub) => (
                  <span
                    key={sub.id}
                    style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 50,
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    {sub.name}
                  </span>
                ))}
                {subcategories.length > 8 && (
                  <span style={{ fontSize: 10, padding: "4px 10px", color: "var(--muted)" }}>
                    +{subcategories.length - 8} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}