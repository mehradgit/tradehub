// src/app/(public)/profiles/[profileNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileHeader from "@/components/profiles/ProfileHeader";
import ProfileTabs from "@/components/profiles/ProfileTabs";

// ====== getUserProfile ======
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
      galleryImages: true, // ✅
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

// ====== getUserProducts — هم برای Supplier و هم Buyer =====
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

// ====== generateMetadata ======
export async function generateMetadata({ params }) {
  const { profileNumber } = await params;
  const num = parseInt(profileNumber);
  if (isNaN(num)) return { title: "Profile Not Found" };

  const user = await prisma.user.findUnique({
    where: { profileNumber: num },
    select: { name: true, companyName: true, bio: true, role: true },
  });

  if (!user) return { title: "User Not Found" };

  const name = user.companyName || user.name || "User";
  const roleLabel = user.role === "SUPPLIER" ? "Supplier" : "Buyer";

  return {
    title: `${name} · ${roleLabel} Profile | B2B Food Hub`,
    description:
      user.bio?.slice(0, 160) || `View ${name}'s profile on B2B Food Hub.`,
  };
}

// ====== Page ======
export default async function ProfilePage({ params }) {
  const { profileNumber } = await params;
  const profileNum = parseInt(profileNumber);

  if (isNaN(profileNum)) notFound();

  const user = await getUserProfile(profileNum);
  const products = await getUserProducts(user.id);

  // serialize user (galleryImages و socialLinks ممکنه JSON باشن)
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

  return (
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
          <li className="breadcrumb-item active text-muted">
            {user.companyName || user.name}
          </li>
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
  );
}