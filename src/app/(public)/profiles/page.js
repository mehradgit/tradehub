// src/app/(public)/profiles/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileFilter from "@/components/profiles/ProfileFilter";
import Pagination from "@/components/requests/Pagination";
import { categories as allCategories } from "@/lib/categories";

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

  if (role === "supplier") {
    where.role = "SUPPLIER";
  } else if (role === "buyer") {
    where.role = "BUYER";
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { country: { contains: search } },
    ];
  }

  // ✅ فیلتر دسته / زیردسته
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
  return (
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
          Profiles
        </h1>
        <p className="profiles-page-subtitle">
          Discover verified suppliers and buyers on our platform
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
  );
} 