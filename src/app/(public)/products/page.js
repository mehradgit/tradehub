// src/app/(public)/products/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";
import Pagination from "@/components/requests/Pagination";
import ProductFilterBar from "@/components/product/ProductFilterBar";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// generateMetadata — پویا بر اساس فیلترها
// ============================================================
export async function generateMetadata({ searchParams }) {
  const {
    page = 1,
    category = "",
    subCategory = "",
    search = "",
    sort = "newest",
  } = await searchParams;

  const pageNum = parseInt(page) || 1;

  // ===== ساخت عنوان پویا =====
  let title = "All Products";
  let description =
    "Browse thousands of wholesale food products from verified suppliers worldwide. Filter by category, country, and price.";

  if (search) {
    title = `Search Results for "${search}"`;
    description = `Find wholesale "${search}" from verified global suppliers. Compare prices, MOQ, and certifications.`;
  } else if (subCategory) {
    title = `${subCategory} — ${category || "Wholesale"}`;
    description = `Buy bulk ${subCategory} at wholesale prices from verified suppliers. Global shipping, competitive MOQ.`;
  } else if (category) {
    title = `${category} — Wholesale & Bulk Supply`;
    description = `Source ${category} in bulk from verified manufacturers and exporters. Get quotes from multiple suppliers.`;
  }

  if (pageNum > 1) {
    title += ` — Page ${pageNum}`;
  }

  // ===== ساخت Canonical URL =====
  const url = new URL(`${BASE_URL}/products`);
  if (category) url.searchParams.set("category", category);
  if (subCategory) url.searchParams.set("subCategory", subCategory);
  if (search) url.searchParams.set("search", search);
  if (sort && sort !== "newest") url.searchParams.set("sort", sort);
  if (pageNum > 1) url.searchParams.set("page", String(pageNum));

  const canonicalUrl = url.toString();

  // ===== تصویر =====
  const ogImage = `${BASE_URL}/og-image.png`;

  // ===== کلمات کلیدی =====
  const keywords = [
    category,
    subCategory,
    search,
    "wholesale products",
    "B2B food marketplace",
    "bulk food supply",
    "verified suppliers",
    "food exporters",
  ].filter(Boolean);

  return {
    title,
    description: description.slice(0, 158),
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description: description.slice(0, 158),
      siteName: "FoodTradeHub",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 158),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ============================================================
// صفحه لیست محصولات (بدون تغییر)
// ============================================================
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

  if (category) where.category = category;
  if (subCategory) where.subCategory = subCategory;
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
          select: { companyName: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ============================================================
  // JSON-LD — ItemList (لیست محصولات)
  // ============================================================
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: search
      ? `Search results for "${search}"`
      : category
        ? `${category} Products`
        : "All Products",
    numberOfItems: totalCount,
    itemListElement: products.map((p, index) => ({
      "@type": "ListItem",
      position: skip + index + 1,
      url: `${BASE_URL}/products/${p.productNumber}/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      {/* ✅ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb products-page-breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            {category && (
              <li className="breadcrumb-item">
                <Link
                  href={`/products?category=${encodeURIComponent(category)}`}
                  style={{ color: "var(--primary)" }}
                >
                  {category}
                </Link>
              </li>
            )}
            {subCategory && (
              <li className="breadcrumb-item active text-muted">
                {subCategory}
              </li>
            )}
            {!category && !subCategory && (
              <li className="breadcrumb-item active text-muted">
                All Products
              </li>
            )}
          </ol>
        </nav>

        <div className="page-header products-page-header">
          <h1>
            <i className="fas fa-box" style={{ color: "var(--primary)" }}></i>
            {search
              ? `Search: "${search}"`
              : subCategory || category || "All Products"}
          </h1>
          <span className="request-count">{totalCount} products</span>
        </div>

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
    </>
  );
}