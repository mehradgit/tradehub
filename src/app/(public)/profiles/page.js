// src/app/(public)/profiles/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileCard from "@/components/profiles/ProfileCard";
import SharedFilterBar from "@/components/filters/FilterBar";
import { getFilterContext } from "@/lib/filters/serverContext";
import { describePath } from "@/lib/categoryTree";
import Pagination from "@/components/requests/Pagination";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// generateMetadata — dynamic based on role and category
// ============================================================
export async function generateMetadata({ searchParams }) {
  const {
    role = "all",
    category = "",
    subCategory = "",
    page = 1,
    search = "",
  } = await searchParams;

  const pageNum = parseInt(page) || 1;

  // ===== Dynamic title based on role =====
  let roleLabel = "";
  if (role === "supplier") roleLabel = "Suppliers";
  else if (role === "buyer") roleLabel = "Buyers";
  else roleLabel = "Companies";

  let title = `${roleLabel} Directory — Verified B2B Network`;
  let description = `Discover verified ${roleLabel.toLowerCase()} on FoodTradeHub. Browse company profiles, products, and contact information for global B2B trade.`;

  if (search) {
    title = `Search: "${search}" — ${roleLabel} Directory`;
    description = `Find ${roleLabel.toLowerCase()} matching "${search}" on FoodTradeHub. View profiles, products, and verified contact information.`;
  } else if (subCategory) {
    title = `${subCategory} — ${roleLabel} in ${category || "Global"}`;
    description = `Verified ${roleLabel.toLowerCase()} specializing in ${subCategory}. Connect with trusted B2B partners.`;
  } else if (category) {
    title = `${category} — ${roleLabel} Directory`;
    description = `Browse verified ${roleLabel.toLowerCase()} in ${category}. View company profiles, certifications, and contact info.`;
  }

  if (pageNum > 1) {
    title += ` — Page ${pageNum}`;
  }

  // ===== Canonical URL =====
  const url = new URL(`${BASE_URL}/profiles`);
  if (role && role !== "all") url.searchParams.set("role", role);
  if (category) url.searchParams.set("category", category);
  if (subCategory) url.searchParams.set("subCategory", subCategory);
  if (search) url.searchParams.set("search", search);
  if (pageNum > 1) url.searchParams.set("page", String(pageNum));

  const canonicalUrl = url.toString();
  const ogImage = `${BASE_URL}/og-image.png`;

  const keywords = [
    role === "supplier" ? "verified suppliers" : role === "buyer" ? "verified buyers" : "B2B companies",
    category,
    subCategory,
    search,
    "B2B directory",
    "company profiles",
    "trade partners",
    "global suppliers",
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
export default async function ProfilesPage({ searchParams }) {
  const resolvedParams = await searchParams;

  // ============================================================
  // Shared filter engine
  // ============================================================
  const filters = await getFilterContext("profiles", resolvedParams);
  const { orderBy, page, limit, skip } = filters.plan;

  const params = filters.effectiveParams;
  const search = params.search || "";
  const rawRole = String(params.role || "").toLowerCase();
  // For use in JSON-LD and page copy
  const role = rawRole || "all";
  const category = params.category || "";
  const subCategory = params.subCategory || "";

  const where = { ...filters.plan.where };

  // Role: also accept legacy lowercase links such as ?role=supplier
  if (rawRole === "supplier") where.role = "SUPPLIER";
  else if (rawRole === "buyer") where.role = "BUYER";
  else if (params.role) where.role = String(params.role).toUpperCase();

  // ============================================================
  // Company category filter
  //
  // There is no category column on User, so the filter is applied through
  // the products or buying requests of that company. Using categoryPath
  // (slug) as a prefix covers all three levels.
  // ============================================================
  if (filters.categoryPath) {
    const pathFilter = {
      isVisible: true,
      status: "APPROVED",
      categoryPath: { startsWith: filters.categoryPath },
    };

    where.OR = [
      ...(where.OR || []),
      { products: { some: pathFilter } },
      { buyingRequests: { some: pathFilter } },
    ];
  }

  const categoryLabel = filters.categoryPath
    ? describePath(filters.categoryPath, filters.index)
    : category && subCategory
    ? `${category} › ${subCategory}`
    : category || subCategory || "";

  const [profiles, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        companyName: true,
        country: true,
        countryCode: true,
        role: true,
        plan: true,
        image: true,
        logo: true,
        createdAt: true,
        profileNumber: true,
        slug: true,
        _count: {
          select: {
            products: { where: { isVisible: true } },
            buyingRequests: { where: { isVisible: true } },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ============================================================
  // JSON-LD — ItemList of profiles
  // ============================================================
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: role === "supplier"
      ? "Verified Suppliers"
      : role === "buyer"
        ? "Verified Buyers"
        : "B2B Directory",
    numberOfItems: totalCount,
    itemListElement: profiles.map((u, index) => ({
      "@type": "ListItem",
      position: skip + index + 1,
      url: `${BASE_URL}/profiles/${u.profileNumber}/${u.slug}`,
      name: u.companyName || u.name || "Company",
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
          className="mb-4 profiles-page-breadcrumb"
        >
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">Profiles</li>
          </ol>
        </nav>

        <div className="profiles-page-header">
          <h1>
            <i className="fas fa-users"></i>
            {search
              ? `Search: "${search}"`
              : role === "supplier"
                ? "Verified Suppliers"
                : role === "buyer"
                  ? "Verified Buyers"
                  : "Profiles"}
          </h1>
          <p className="profiles-page-subtitle">
            {totalCount} verified companies on our B2B platform
          </p>
        </div>

        {/* ✅ Unified filter bar — built from the shared schema */}
        <SharedFilterBar {...filters.barProps} resultCount={totalCount} />

        {profiles.length > 0 ? (
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No profiles found</h3>
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