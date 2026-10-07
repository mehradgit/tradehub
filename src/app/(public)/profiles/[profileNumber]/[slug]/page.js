// src/app/(public)/profiles/[profileNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileHeader from "@/components/profiles/ProfileHeader";
import ProfileTabs from "@/components/profiles/ProfileTabs";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// getUserProfile
// ============================================================
async function getUserProfile(profileNumber) {
  const user = await prisma.user.findUnique({
    where: { profileNumber },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      logo: true,
      coverImage: true,
      galleryImages: true,
      bio: true,
      employeeCount: true,
      address: true,
      phone: true,
      website: true,
      companyEmail: true,
      socialLinks: true,
      companyName: true,
      country: true,
      countryCode: true,
      businessType: true,
      plan: true,
      role: true,
      primaryCategory: true,
      primarySubCategory: true,
      createdAt: true,
      profileNumber: true,
      slug: true,
    },
  });

  if (!user) notFound();
  return user;
}

// ============================================================
// getUserProducts
// ============================================================
async function getUserProducts(userId) {
  const products = await prisma.product.findMany({
    where: {
      userId,
      isVisible: true,
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      price: true,
      unit: true,
      images: true,
      badge: true,
      category: true,
      subCategory: true,
      country: true,
      countryCode: true,
      createdAt: true,
      slug: true,
      productNumber: true,
      ratingAverage: true, 
      ratingCount: true,
      user: {
        select: {
          companyName: true,
        },
      },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return products;
}

// ============================================================
// generateMetadata
// ============================================================
export async function generateMetadata({ params }) {
  const { profileNumber } = await params;
  const num = parseInt(profileNumber);
  if (isNaN(num)) return { title: "Profile Not Found" };

  const user = await prisma.user.findUnique({
    where: { profileNumber: num },
    select: {
      name: true,
      companyName: true,
      bio: true,
      role: true,
      country: true,
      countryCode: true,
      businessType: true,
      logo: true,
      image: true,
      coverImage: true,
      website: true,
      slug: true,
      primaryCategory: true,
    },
  });

  if (!user) {
    return {
      title: "User Not Found",
      description: "The profile you're looking for does not exist.",
      robots: { index: false, follow: false },
    };
  }

  const name = user.companyName || user.name || "User";
  const roleLabel = user.role === "SUPPLIER" ? "Supplier" : "Buyer";
  const profileUrl = `${BASE_URL}/profiles/${profileNumber}/${user.slug}`;

  // Image
  const avatar = user.logo || user.image || user.coverImage;
  const imageUrl = avatar
    ? avatar.startsWith("http")
      ? avatar
      : `${BASE_URL}${avatar}`
    : `${BASE_URL}/og-default.png`;

  // Description
  const bioPlain = user.bio?.replace(/<[^>]*>/g, "").trim() || "";
  const description = (
    bioPlain ||
    `${name} - Verified ${roleLabel} on FoodTradeHub${user.country ? ` from ${user.country}` : ""}. Browse products, requests, and company profile.`
  ).slice(0, 158);

  // Keywords
  const keywords = [
    name,
    roleLabel,
    user.businessType,
    user.country,
    user.primaryCategory,
    `${name} supplier`,
    `${name} profile`,
    "B2B company",
    "verified supplier",
    "food trade",
  ].filter(Boolean);

  // Schema type based on role
  const ogType = user.role === "SUPPLIER" ? "profile" : "profile";

  return {
    title: `${name} · ${roleLabel} Profile`,
    description,
    keywords,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      type: ogType,
      url: profileUrl,
      title: `${name} · ${roleLabel}`,
      description,
      siteName: "FoodTradeHub",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
      ...(user.country && { locale: "en_US" }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} · ${roleLabel}`,
      description,
      images: [imageUrl],
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
// ProfilePage
// ============================================================
export default async function ProfilePage({ params }) {
  const { profileNumber } = await params;
  const profileNum = parseInt(profileNumber);

  if (isNaN(profileNum)) notFound();

  const user = await getUserProfile(profileNum);
  const products = await getUserProducts(user.id);

  // ====== Serialize ======
  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    galleryImages: Array.isArray(user.galleryImages) ? user.galleryImages : [],
    socialLinks:
      user.socialLinks && typeof user.socialLinks === "object"
        ? user.socialLinks
        : {},
  };

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    images: Array.isArray(p.images) ? p.images : [],
    badge: p.badge,
    category: p.category,
    subCategory: p.subCategory,
    country: p.country,
    countryCode: p.countryCode,
    createdAt: p.createdAt.toISOString(),
    slug: p.slug,
    productNumber: p.productNumber,
    user: p.user,
  }));

  // ============================================================
  // JSON-LD
  // ============================================================
  const name = user.companyName || user.name || "User";
  const roleLabel = user.role === "SUPPLIER" ? "Supplier" : "Buyer";
  const profileUrl = `${BASE_URL}/profiles/${profileNumber}/${user.slug}`;

  const avatar = user.logo || user.image;
  const logoUrl = avatar
    ? avatar.startsWith("http")
      ? avatar
      : `${BASE_URL}${avatar}`
    : undefined;

  const bioPlain = user.bio?.replace(/<[^>]*>/g, "").trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": user.role === "SUPPLIER" ? "Organization" : "Organization",
    name,
    url: profileUrl,
    ...(logoUrl && { logo: logoUrl }),
    ...(bioPlain && { description: bioPlain.slice(0, 500) }),
    ...(user.country && {
      address: {
        "@type": "PostalAddress",
        ...(user.address && { streetAddress: user.address }),
        ...(user.country && { addressCountry: user.country }),
      },
    }),
    ...(user.phone && { telephone: user.phone }),
    ...(user.companyEmail && { email: user.companyEmail }),
    ...(user.website && { sameAs: [user.website] }),
    ...(user.businessType && {
      additionalType: user.businessType,
    }),
    ...(user.createdAt && {
      foundingDate: new Date(user.createdAt).toISOString().split("T")[0],
    }),
  };

  return (
    <>
      {/* ✅ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-4">
        {/* Breadcrumb */}
        <nav
          aria-label="breadcrumb"
          className="mb-4 profile-page-breadcrumb"
        >
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/profiles" style={{ color: "var(--primary)" }}>
                Profiles
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">{name}</li>
          </ol>
        </nav>

        {/* Header */}
        <ProfileHeader
          user={serializedUser}
          productCount={serializedProducts.length}
          galleryCount={serializedUser.galleryImages.length}
        />

        {/* Tabs */}
        <ProfileTabs user={serializedUser} products={serializedProducts} />
      </div>
    </>
  );
}