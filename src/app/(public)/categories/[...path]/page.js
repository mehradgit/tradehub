// src/app/(public)/categories/[...path]/page.js
// ============================================================
// Category landing — three levels and indexable
//
//   /categories/grains-cereals
//   /categories/grains-cereals/rice
//   /categories/grains-cereals/rice/basmati
//
// Why the /categories prefix and not /products/...:
//   The route /products/[productNumber]/[slug] has two segments, so
//   /products/grains-cereals/rice would conflict with it and
//   parseInt("rice") would become NaN.
//
// The content comes from the same shared filter engine (getFilterContext),
// so this page is only an "SEO shell" on top of that engine.
// ============================================================
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import Pagination from "@/components/requests/Pagination";
import FilterBar from "@/components/filters/FilterBar";
import { getFilterContext, getCategoryTreeOnly } from "@/lib/filters/serverContext";
import { MAX_CATEGORY_LEVEL } from "@/lib/categoryTree";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// Resolve the URL path to a category node
//
// It deliberately uses getCategoryTreeOnly and not getFilterContext:
// only the tree is needed to validate the path, otherwise the options and
// facets would be computed twice for no reason.
// ============================================================
async function resolveCategory(pathSegments) {
  const segments = (pathSegments || []).filter(Boolean);

  if (segments.length === 0 || segments.length > MAX_CATEGORY_LEVEL) {
    return null;
  }

  const categoryPath = segments.join("/");
  const { index } = await getCategoryTreeOnly();

  const node = index?.byPath?.get(categoryPath);
  if (!node) return null;

  return { categoryPath, node, index };
}

// ============================================================
// Category condition (the path itself plus all of its descendants)
// ============================================================
function categoryWhere(categoryPath) {
  return {
    isVisible: true,
    status: "APPROVED",
    OR: [
      { categoryPath },
      { categoryPath: { startsWith: `${categoryPath}/` } },
    ],
  };
}

// ============================================================
// generateMetadata
// ============================================================
export async function generateMetadata({ params }) {
  const { path } = await params;
  const resolved = await resolveCategory(path);

  if (!resolved) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: true },
    };
  }

  const { node, categoryPath, index } = resolved;

  // Real product count for the meta description
  let count = 0;
  try {
    count = await prisma.product.count({ where: categoryWhere(categoryPath) });
  } catch {
    count = 0;
  }

  const parent = categoryPath.includes("/")
    ? categoryPath.split("/").slice(0, -1).join("/")
    : null;
  const parentName = parent ? index?.byPath?.get(parent)?.name : null;

  const title = parentName
    ? `${node.name} — ${parentName} | Wholesale & Bulk Supply`
    : `${node.name} — Wholesale & Bulk Supply`;

  const description = (
    node.description ||
    `Source ${node.name} in bulk from verified global suppliers. ${
      count > 0 ? `${count} products available. ` : ""
    }Compare prices, MOQ, certifications and delivery terms.`
  ).slice(0, 158);

  const canonicalUrl = `${BASE_URL}/categories/${categoryPath}`;
  const ogImage = `${BASE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      node.name,
      parentName,
      "wholesale",
      "bulk supply",
      "B2B food marketplace",
      "verified suppliers",
      "exporters",
    ].filter(Boolean),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      siteName: "FoodTradeLink",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
// Page
// ============================================================
export default async function CategoryLandingPage({ params, searchParams }) {
  const { path } = await params;
  const resolvedParams = (await searchParams) || {};

  const resolved = await resolveCategory(path);
  if (!resolved) notFound();

  const { node, categoryPath } = resolved;

  // Extra filters from the query string (sort, origin, price, …)
  // categoryPath comes from the route and takes priority over the query.
  const filters = await getFilterContext("products", {
    ...resolvedParams,
    categoryPath,
  });

  const { where, orderBy, page, limit, skip } = filters.plan;

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
        ratingAverage: true,
        ratingCount: true,
        user: { select: { companyName: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ===== Subcategories (for internal linking and UX) =====
  const children = node.children || [];

  // ===== Parent levels =====
  const segments = categoryPath.split("/");
  const crumbs = segments.map((slug, idx) => {
    const crumbPath = segments.slice(0, idx + 1).join("/");
    return {
      slug,
      path: crumbPath,
      name: filters.index?.byPath?.get(crumbPath)?.name || slug,
      isLast: idx === segments.length - 1,
    };
  });

  // ===== Structured Data =====
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: node.name,
    description: node.description || undefined,
    url: `${BASE_URL}/categories/${categoryPath}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: products.map((p, index) => ({
        "@type": "ListItem",
        position: skip + index + 1,
        url: `${BASE_URL}/products/${p.productNumber}/${p.slug}`,
        name: p.name,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${BASE_URL}/products`,
      },
      ...crumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        position: idx + 3,
        name: crumb.name,
        item: `${BASE_URL}/categories/${crumb.path}`,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container py-4">
        {/* ===== Breadcrumb ===== */}
        <nav
          aria-label="breadcrumb category-page-breadcrumb"
          className="mb-4"
        >
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/products" style={{ color: "var(--primary)" }}>
                Products
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
          </ol>
        </nav>

        {/* ===== Header ===== */}
        <div className="page-header products-page-header">
          <h1>
            <i
              className={`fas ${
                node.icon ? `fa-${node.icon}` : "fa-layer-group"
              }`}
              style={{ color: "var(--primary)" }}
            ></i>
            {node.name}
          </h1>
          <span className="request-count">{totalCount} products</span>
        </div>

        {node.description && (
          <p
            style={{
              color: "var(--muted)",
              fontSize: "14px",
              maxWidth: "820px",
              marginBottom: "18px",
              lineHeight: 1.8,
            }}
          >
            {node.description}
          </p>
        )}

        {/* ===== Subcategories ===== */}
        {children.length > 0 && (
          <div
            className="d-flex flex-wrap gap-2 mb-4"
            aria-label="Subcategories"
          >
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.path}`}
                className="badge text-decoration-none"
                style={{
                  background: "#f1f5f3",
                  color: "var(--text)",
                  fontWeight: 600,
                  fontSize: "12px",
                  padding: "8px 13px",
                  borderRadius: "50px",
                }}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {/* ===== Filters ===== */}
        <FilterBar {...filters.barProps} resultCount={totalCount} />

        {/* ===== Results ===== */}
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No products in this category yet</h3>
            <p>Try a parent category or clear the filters.</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </>
  );
}
