// src/app/admin/products/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";

export const metadata = { title: "Products | Admin" };

export default async function AdminProductsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    page: pageParam = 1,
    search = "",
    category = "",
    status = "",
    approval = "",
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { shortDesc: { contains: search } },
    ];
  }
  if (category) where.category = category;
  if (status === "visible") where.isVisible = true;
  if (status === "hidden") where.isVisible = false;
  if (approval) where.status = approval;

  const [products, totalCount, categories, statusCounts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        unit: true,
        images: true,
        category: true,
        subCategory: true,
        isVisible: true,
        status: true,
        rejectionNote: true,
        views: true,
        stock: true,
        createdAt: true,
        productNumber: true,
        slug: true,
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            profileNumber: true,
            slug: true,
          },
        },
        _count: {
          select: { inquiries: true },
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    }),
    Promise.all([
      prisma.product.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "APPROVED" } }),
      prisma.product.count({ where: { status: "REJECTED" } }),
    ]),
  ]);

  const [pendingCount, approvedCount, rejectedCount] = statusCounts;
  const totalPages = Math.ceil(totalCount / limit);

  const getStatusBadge = (product) => {
    if (product.status === "PENDING") {
      return { label: "Pending", icon: "fa-clock", bg: "#fff7e6", color: "#b45309", border: "#fde68a" };
    }
    if (product.status === "REJECTED") {
      return { label: "Rejected", icon: "fa-times-circle", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    }
    if (product.status === "APPROVED") {
      if (!product.isVisible) return { label: "Hidden", icon: "fa-eye-slash", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
      if (product.stock === 0) return { label: "Sold Out", icon: "fa-box-open", bg: "#fff7e6", color: "#92400e", border: "#fde68a" };
      return { label: "Active", icon: "fa-check-circle", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    }
    return { label: "Active", icon: "fa-check-circle", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  };

  return (
    <>
      <AdminPageHeader
        title="Products Management"
        subtitle={`${totalCount} products on the platform`}
        action={
          <Link
            href="/admin/products/new"
            style={{
              background: "var(--green2)",
              color: "white",
              border: 0,
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i>
            Add Product
          </Link>
        }
      />

      {/* Status Stats */}
      <div
        className="admin-kpis"
        style={{ marginBottom: 16, gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <Link
          href="/admin/products?approval=PENDING"
          style={{ textDecoration: "none" }}
        >
          <div className="admin-kpi" style={{ minHeight: "auto", padding: 16, cursor: "pointer" }}>
            <div className="admin-kpi-icon orange-bg"><i className="fa-solid fa-clock"></i></div>
            <h4>Pending Review</h4>
            <strong>{pendingCount}</strong>
          </div>
        </Link>
        <Link
          href="/admin/products?approval=APPROVED"
          style={{ textDecoration: "none" }}
        >
          <div className="admin-kpi" style={{ minHeight: "auto", padding: 16, cursor: "pointer" }}>
            <div className="admin-kpi-icon green-bg"><i className="fa-solid fa-check-circle"></i></div>
            <h4>Approved</h4>
            <strong>{approvedCount}</strong>
          </div>
        </Link>
        <Link
          href="/admin/products?approval=REJECTED"
          style={{ textDecoration: "none" }}
        >
          <div className="admin-kpi" style={{ minHeight: "auto", padding: 16, cursor: "pointer" }}>
            <div className="admin-kpi-icon purple-bg"><i className="fa-solid fa-times-circle"></i></div>
            <h4>Rejected</h4>
            <strong>{rejectedCount}</strong>
          </div>
        </Link>
      </div>

      <AdminFilterBar
        searchPlaceholder="Search products..."
        filters={[
          {
            name: "approval",
            placeholder: "All Approvals",
            options: [
              { value: "PENDING", label: "Pending Review" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ],
          },
          {
            name: "category",
            placeholder: "All Categories",
            options: categories.map((c) => ({
              value: c.category,
              label: c.category,
            })),
          },
          {
            name: "status",
            placeholder: "Visibility",
            options: [
              { value: "visible", label: "Visible" },
              { value: "hidden", label: "Hidden" },
            ],
          },
        ]}
      />

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Supplier</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Views</th>
                <th>Inquiries</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const badge = getStatusBadge(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-person">
                          <img
                            src={product.images?.[0] || "https://via.placeholder.com/40"}
                            alt={product.name}
                            style={{ borderRadius: 8 }}
                          />
                          <div>
                            <b>{product.name}</b>
                            <span>#{product.productNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {product.user ? (
                          <Link
                            href={`/admin/users/${product.user.id}`}
                            style={{ color: "var(--green2)", fontWeight: 600 }}
                          >
                            {product.user.companyName || product.user.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{product.category || "—"}</td>
                      <td>
                        <b>${product.price}</b>
                        <span style={{ color: "var(--muted)" }}>/{product.unit}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 11px",
                            borderRadius: 50,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: 10,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i className={`fas ${badge.icon}`} style={{ fontSize: 10 }}></i>
                          {badge.label}
                        </span>
                      </td>
                      <td>{product.views || 0}</td>
                      <td>{product._count.inquiries}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Link
                            href={`/admin/products/${product.id}`}
                            style={{
                              width: 28, height: 28,
                              borderRadius: 7,
                              background: "var(--bg)",
                              color: "var(--green2)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                            }}
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <Link
                            href={`/products/${product.productNumber}/${product.slug}`}
                            target="_blank"
                            style={{
                              width: 28, height: 28,
                              borderRadius: 7,
                              background: "var(--bg)",
                              color: "var(--muted)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 11,
                            }}
                            title="View Public Page"
                          >
                            <i className="fa-solid fa-external-link-alt"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination currentPage={page} totalPages={totalPages} />
      </div>
    </>
  );
}