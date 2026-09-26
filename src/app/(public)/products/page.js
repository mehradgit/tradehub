// src/app/(public)/products/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";
import Pagination from "@/components/requests/Pagination";
import ProductFilterBar from "@/components/product/ProductFilterBar";

export default async function ProductsPage({ searchParams }) {
  const {
    page: pageParam = 1,
    category = "",
    subCategory = "",
    search = "",
    sort = "newest",
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = {
    isVisible: true,
    status: "APPROVED",
  };

  if (category) {
    where.category = category;
  }
  if (subCategory) {
    where.subCategory = subCategory;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { shortDesc: { contains: search } },
      { fullDesc: { contains: search } },
    ];
  }

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
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

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
        slug: true,
        productNumber: true,
        user: {
          select: {
            companyName: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/" style={{ color: "var(--primary)" }}>
              Home
            </Link>
          </li>
          <li className="breadcrumb-item active text-muted">All Products</li>
        </ol>
      </nav>

      <div className="page-header">
        <h1>
          <i className="fas fa-box" style={{ color: "var(--primary)" }}></i>
          All Products
        </h1>
      </div>

      {/* ✅ فیلتربار بدون نیاز به categories از دیتابیس */}
      <ProductFilterBar
        currentCategory={category}
        currentSubCategory={subCategory}
        currentSearch={search}
        currentSort={sort}
      />

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
          <p>Try adjusting your filters.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
