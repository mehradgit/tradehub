// src/app/(public)/profiles/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileFilter from "@/components/profiles/ProfileFilter";
import Pagination from "@/components/requests/Pagination";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// generateMetadata — پویا بر اساس role و category
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

  // ===== عنوان پویا بر اساس نقش =====
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
// صفحه (بدون تغییر)
// ============================================================
export default async function ProfilesPage({ searchParams }) {
  const {
    role = "all",
    category = "",
    subCategory = "",
    page: pageParam = 1,
    search = "",
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = {
    registrationComplete: true,
  };

  if (role === "supplier") where.role = "SUPPLIER";
  else if (role === "buyer") where.role = "BUYER";

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { country: { contains: search } },
    ];
  }

  if (category) {
    const productFilter = {
      isVisible: true,
      category,
      ...(subCategory && { subCategory }),
    };
    const requestFilter = {
      isVisible: true,
      category,
      ...(subCategory && { subCategory }),
    };

    where.OR = [
      ...(where.OR || []),
      { products: { some: productFilter } },
      { buyingRequests: { some: requestFilter } },
    ];
  }

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
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ============================================================
  // JSON-LD — ItemList پروفایل‌ها
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

        <ProfileFilter
          currentRole={role}
          currentCategory={category}
          currentSearch={search}
        />

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