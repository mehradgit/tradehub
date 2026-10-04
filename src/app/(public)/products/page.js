// src/app/(public)/products/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";
import Pagination from "@/components/requests/Pagination";
import FilterBar from "@/components/filters/FilterBar";
import { getFilterContext } from "@/lib/filters/serverContext";
import { describePath } from "@/lib/categoryTree";

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
  const resolvedParams = await searchParams;

  // ============================================================
  // موتور فیلتر مشترک
  // where / orderBy / صفحه‌بندی / گزینه‌ها / اتریبیوت‌ها / facet
  // از یک منبع می‌آید (src/lib/filters/schemas.js)
  // ============================================================
  const filters = await getFilterContext("products", resolvedParams);
  const { where, orderBy, page, limit, skip } = filters.plan;

  // پارامترهای مؤثر (شامل تبدیل لینک‌های قدیمی category/subCategory)
  const params = filters.effectiveParams;
  const search = params.search || "";
  const category = params.category || "";
  const subCategory = params.subCategory || "";

  // برچسب دسته از مسیر سه‌سطحی (slug → نام نمایشی)
  const categoryLabel = filters.categoryPath
    ? describePath(filters.categoryPath, filters.index)
    : category && subCategory
    ? `${category} › ${subCategory}`
    : category || subCategory || "";

  // بریدکرامب از سطح‌های مسیر (هر سطح لینک‌دار)
  const crumbs = String(filters.categoryPath || "")
    .split("/")
    .filter(Boolean)
    .map((slug, idx, arr) => ({
      slug,
      name: filters.index?.byPath?.get(slug)?.name || slug,
      path: arr.slice(0, idx + 1).join("/"),
      isLast: idx === arr.length - 1,
    }));

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
            {crumbs.map((crumb) => (
              <li
                key={crumb.path}
                className={
                  crumb.isLast
                    ? "breadcrumb-item active text-muted"
                    : "breadcrumb-item"
                }
              >
                {crumb.isLast ? (
                  crumb.name
                ) : (
                  <Link
                    href={`/categories/${crumb.path}`}
                    style={{ color: "var(--primary)" }}
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}

            {crumbs.length === 0 && (
              <li className="breadcrumb-item active text-muted">
                All Products
              </li>
            )}
          </ol>
        </nav>

        <div className="page-header products-page-header">
          <h1>
            <i className="fas fa-box" style={{ color: "var(--primary)" }}></i>
            {search ? `Search: "${search}"` : categoryLabel || "All Products"}
          </h1>
          <span className="request-count">{totalCount} products</span>
        </div>

        {/* ✅ نوار فیلتر یکپارچه — از اسکیمای مشترک ساخته می‌شود
            (جست‌وجو + دسته + مرتب‌سازی + پنل فیلترهای بیشتر) */}
        <FilterBar {...filters.barProps} resultCount={totalCount} />

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