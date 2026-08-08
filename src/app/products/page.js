// src/app/products/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/home/ProductCard";
import Pagination from "@/components/requests/Pagination";
import ProductFilterBar from "@/components/product/ProductFilterBar";

export default async function ProductsPage({ searchParams }) {
  const {
    page: pageParam = 1,
    category = "",
    search = "",
    sort = "newest",
  } = await searchParams;
  // ====== دریافت پارامترهای صفحه ======
  const page = ( parseInt(pageParam)) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  // ====== ساخت شرط WHERE ======
  const where = {
    isVisible: true,
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { shortDesc: { contains: search } },
      { fullDesc: { contains: search } },
    ];
  }

  // ====== ساخت شرط ORDER BY ======
  let orderBy = {};
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "price_low":
      orderBy = { price: "asc" };
      break;
    case "price_high":
      orderBy = { price: "desc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // ====== دریافت داده‌ها از دیتابیس ======
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        images: true,
        badge: true,
        country: true,
        countryCode: true,
        createdAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ====== دریافت دسته‌بندی‌ها برای فیلتر ======
  const categories = await prisma.product.findMany({
    where: { isVisible: true },
    select: { category: true },
    distinct: ["category"],
  });

  // ====== آمار ======
  const totalCategories = categories.length;

  // محاسبه قیمت‌ها برای آمار
  const priceStats = await prisma.product.aggregate({
    where: { isVisible: true },
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
  });

  return (
    <Layout>
      <div className="container py-4">
        {/* ====== Breadcrumb ====== */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link
                href="/"
                className="text-decoration-none"
                style={{ color: "var(--primary)" }}
              >
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">All Products</li>
          </ol>
        </nav>

        {/* ====== Page Header ====== */}
        <div className="page-header">
          <h1>
            <i className="fas fa-box" style={{ color: "var(--primary)" }}></i>
            All Products
            <span className="request-count">({totalCount} products)</span>
          </h1>
          <Link href="/products/new" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add New Product
          </Link>
        </div>

        {/* ====== Stats Bar ====== */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{totalCategories}</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              ${priceStats._avg?.price?.toFixed(2) || "0.00"}
            </div>
            <div className="stat-label">Avg Price</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{Math.ceil(totalCount / 30)}</div>
            <div className="stat-label">Pages</div>
          </div>
        </div>

        {/* ====== Filter Bar ====== */}
        <ProductFilterBar
          categories={categories}
          currentCategory={category}
          currentSearch={search}
          currentSort={sort}
        />

        {/* ====== Products Grid ====== */}
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No products found</h3>
            <p>Try adjusting your filters or add a new product.</p>
            <Link href="/products/new" className="btn btn-primary">
              <i className="fas fa-plus"></i> Add New Product
            </Link>
          </div>
        )}

        {/* ====== Pagination ====== */}
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </Layout>
  );
}
