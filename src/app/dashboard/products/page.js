// src/app/dashboard/products/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import ProductList from "@/components/dashboard/ProductList";

export default async function DashboardProductsPage({ searchParams }) {
  // ====== احراز هویت ======
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { status = "all", page = "1" } = await searchParams;
  const currentPage = parseInt(page) || 1;
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // ====== ساخت شرط WHERE بر اساس وضعیت ======
  let where = { userId };

  switch (status) {
    case "active":
      where = { ...where, isVisible: true, stock: { gt: 0 } };
      break;
    case "sold_out":
      where = { ...where, isVisible: true, stock: 0 };
      break;
    case "suspended":
      where = { ...where, isVisible: false };
      break;
    default:
      // all: همه محصولات کاربر
      break;
  }

  // ====== دریافت محصولات ======
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        images: true,
        badge: true,
        stock: true,
        isVisible: true,
        createdAt: true,
        category: true,
        moq: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  // ====== آمار وضعیت‌ها ======
  const stats = await Promise.all([
    prisma.product.count({
      where: { userId, isVisible: true, stock: { gt: 0 } },
    }),
    prisma.product.count({
      where: { userId, isVisible: true, stock: 0 },
    }),
    prisma.product.count({
      where: { userId, isVisible: false },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <Layout>
      <div className="container py-4">
        {/* ====== هدر صفحه ====== */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-0">My Products</h1>
            <p className="text-muted">Manage your product listings</p>
          </div>
          <Link href="/products/new" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>Add New Product
          </Link>
        </div>

        {/* ====== آمار وضعیت‌ها ====== */}
        <div className="dashboard-stats-bar mb-4">
          <div className="stat-item">
            <div className="stat-number">{stats[0]}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats[1]}</div>
            <div className="stat-label">Sold Out</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats[2]}</div>
            <div className="stat-label">Suspended</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>

        {/* ====== فیلتر وضعیت ====== */}
        <div className="dashboard-filter-bar mb-4">
          <div className="filter-group">
            <Link
              href="/dashboard/products"
              className={`btn-filter ${status === "all" ? "active" : ""}`}
            >
              All
            </Link>
            <Link
              href="/dashboard/products?status=active"
              className={`btn-filter ${status === "active" ? "active" : ""}`}
            >
              <span className="badge bg-success me-1">●</span> Active
            </Link>
            <Link
              href="/dashboard/products?status=sold_out"
              className={`btn-filter ${status === "sold_out" ? "active" : ""}`}
            >
              <span className="badge bg-warning me-1">●</span> Sold Out
            </Link>
            <Link
              href="/dashboard/products?status=suspended"
              className={`btn-filter ${status === "suspended" ? "active" : ""}`}
            >
              <span className="badge bg-secondary me-1">●</span> Suspended
            </Link>
          </div>
        </div>

        {/* ====== لیست محصولات ====== */}
        {products.length > 0 ? (
          <ProductList products={products} />
        ) : (
          <div className="dashboard-empty-state">
            <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
            <h3>No products found</h3>
            <p className="text-muted">
              {status !== "all"
                ? "No products in this category."
                : "You haven't added any products yet."}
            </p>
            <Link href="/products/new" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>Add Your First Product
            </Link>
          </div>
        )}

        {/* ====== صفحه‌بندی ====== */}
        {totalPages > 1 && (
          <div className="dashboard-pagination-container">
            <nav>
              <ul className="pagination">
                {currentPage > 1 && (
                  <li className="page-item">
                    <Link
                      href={`/dashboard/products?status=${status}&page=${currentPage - 1}`}
                      className="page-link"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </Link>
                  </li>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <li
                      key={pageNum}
                      className={`page-item ${pageNum === currentPage ? "active" : ""}`}
                    >
                      <Link
                        href={`/dashboard/products?status=${status}&page=${pageNum}`}
                        className="page-link"
                      >
                        {pageNum}
                      </Link>
                    </li>
                  );
                })}
                {totalPages > 5 && (
                  <li className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
                )}
                {currentPage < totalPages && (
                  <li className="page-item">
                    <Link
                      href={`/dashboard/products?status=${status}&page=${currentPage + 1}`}
                      className="page-link"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </Layout>
  );
}