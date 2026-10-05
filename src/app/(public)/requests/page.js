// src/app/(public)/requests/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RequestCard from "@/components/requests/RequestCard";
import Pagination from "@/components/requests/Pagination";
import SharedFilterBar from "@/components/filters/FilterBar";
import { getFilterContext } from "@/lib/filters/serverContext";
import { describePath } from "@/lib/categoryTree";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// generateMetadata — dynamic
// ============================================================
export async function generateMetadata({ searchParams }) {
  const {
    page = 1,
    category = "",
    subCategory = "",
    search = "",
    filter = "all",
  } = await searchParams;

  const pageNum = parseInt(page) || 1;

  let title = "Buying Requests — Active Purchase Requirements";
  let description =
    "Discover active buying requests from verified buyers worldwide. Submit quotes and win new B2B deals on FoodTradeHub.";

  if (search) {
    title = `Search: "${search}" — Buying Requests`;
    description = `Find buying requests matching "${search}" from verified global buyers. Submit your quote now.`;
  } else if (subCategory) {
    title = `${subCategory} Buying Requests — ${category || "Global"}`;
    description = `Active buying requests for ${subCategory}. Connect with verified buyers sourcing in bulk.`;
  } else if (category) {
    title = `${category} Buying Requests — Global Sourcing`;
    description = `Browse active ${category} buying requests from verified buyers. Submit quotes and win deals.`;
  }

  if (filter === "urgent") {
    title = `Urgent ${title}`;
    description = `Urgent ${description}`;
  }

  if (pageNum > 1) {
    title += ` — Page ${pageNum}`;
  }

  const url = new URL(`${BASE_URL}/requests`);
  if (category) url.searchParams.set("category", category);
  if (subCategory) url.searchParams.set("subCategory", subCategory);
  if (search) url.searchParams.set("search", search);
  if (filter && filter !== "all") url.searchParams.set("filter", filter);
  if (pageNum > 1) url.searchParams.set("page", String(pageNum));

  const canonicalUrl = url.toString();
  const ogImage = `${BASE_URL}/og-image.png`;

  const keywords = [
    category,
    subCategory,
    search,
    "buying requests",
    "sourcing requests",
    "B2B buyer inquiries",
    "procurement",
    "supplier quotes",
  ].filter(Boolean);

  return {
    title,
    description: description.slice(0, 158),
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description: description.slice(0, 158),
      siteName: "FoodTradeHub",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
// Page (unchanged)
// ============================================================
export default async function RequestsPage({ searchParams }) {
  const resolvedParams = await searchParams;

  // ============================================================
  // Shared filter engine (same schema as products, with request fields)
  // ============================================================
  const filters = await getFilterContext("requests", resolvedParams);
  const { orderBy, page, limit, skip } = filters.plan;

  // Effective params (automatic conversion of the legacy category/subCategory)
  const params = filters.effectiveParams;
  const search = params.search || "";
  const category = params.category || "";
  const subCategory = params.subCategory || "";
  const filter = params.filter || "all";

  // Engine clause + keep the legacy ?filter=urgent|verified filter
  const where = { ...filters.plan.where };
  if (filter === "urgent") where.isUrgent = true;
  else if (filter === "verified") where.isUrgent = false;

  // Category label from the three-level path
  const categoryLabel = filters.categoryPath
    ? describePath(filters.categoryPath, filters.index)
    : category && subCategory
    ? `${category} › ${subCategory}`
    : category || subCategory || "";

  const [requests, totalCount] = await Promise.all([
    prisma.buyingRequest.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            country: true,
            countryCode: true,
          },
        },
      },
    }),
    prisma.buyingRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ============================================================
  // JSON-LD — ItemList
  // ============================================================
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: search
      ? `Buying requests for "${search}"`
      : category
        ? `${category} Buying Requests`
        : "Buying Requests",
    numberOfItems: totalCount,
    itemListElement: requests.map((r, index) => ({
      "@type": "ListItem",
      position: skip + index + 1,
      url: `${BASE_URL}/requests/${r.requestNumber}/${r.slug}`,
      name: r.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="container py-4">
        <nav
          aria-label="breadcrumb"
          className="mb-4 requests-page-breadcrumb"
        >
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            {category && (
              <li className="breadcrumb-item">
                <Link
                  href={`/requests?category=${encodeURIComponent(category)}`}
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
                Buying Requests
              </li>
            )}
          </ol>
        </nav>

        <div className="requests-page-header">
          <h1>
            <i className="fas fa-shopping-cart"></i>
            {search
              ? `Search: "${search}"`
              : categoryLabel || "Buying Requests"}
          </h1>
          <p className="requests-page-subtitle">
            {totalCount} active {filter === "urgent" ? "urgent " : ""}
            purchase requirements from verified buyers
          </p>
        </div>

        {/* ✅ Unified filter bar — built from the shared schema */}
        <SharedFilterBar {...filters.barProps} resultCount={totalCount} />

        {requests.length > 0 ? (
          <div className="requests-grid">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No requests found</h3>
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