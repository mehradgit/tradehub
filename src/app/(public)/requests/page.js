// src/app/(public)/requests/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RequestCard from "@/components/requests/RequestCard";
import Pagination from "@/components/requests/Pagination";
import FilterBar from "@/components/requests/FilterBar";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// generateMetadata — پویا
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
// صفحه (بدون تغییر)
// ============================================================
export default async function RequestsPage({ searchParams }) {
  const {
    page: pageParam = 1,
    category = "",
    subCategory = "",
    search = "",
    filter = "all",
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
      { title: { contains: search } },
      { description: { contains: search } },
      { category: { contains: search } },
      { subCategory: { contains: search } },
      { deliveryCountry: { contains: search } },
    ];
  }

  if (filter === "urgent") where.isUrgent = true;
  else if (filter === "verified") where.isUrgent = false;

  const [requests, totalCount] = await Promise.all([
    prisma.buyingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
              : subCategory || category || "Buying Requests"}
          </h1>
          <p className="requests-page-subtitle">
            {totalCount} active {filter === "urgent" ? "urgent " : ""}
            purchase requirements from verified buyers
          </p>
        </div>

        <FilterBar
          currentCategory={category}
          currentSubCategory={subCategory}
          currentSearch={search}
          currentFilter={filter}
        />

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