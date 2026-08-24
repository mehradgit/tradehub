// src/app/(public)/profiles/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileFilter from "@/components/profiles/ProfileFilter";
import Pagination from "@/components/requests/Pagination";

export default async function ProfilesPage({ searchParams }) {
  const {
    role = "all",
    category = "",
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

  if (category) {
    where.OR = [
      ...(where.OR || []),
      {
        products: {
          some: {
            category: category,
            isVisible: true,
          },
        },
      },
      {
        buyingRequests: {
          some: {
            category: category,
            isVisible: true,
          },
        },
      },
    ];
  }

  const categoriesData = await prisma.$queryRaw`
    SELECT DISTINCT category FROM (
      SELECT category FROM Product WHERE isVisible = true
      UNION
      SELECT category FROM BuyingRequest WHERE isVisible = true
    ) AS all_categories
    WHERE category IS NOT NULL AND category != ''
  `;
  const categories = categoriesData.map((row) => row.category).filter(Boolean);

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
        profileNumber: true,   // ✅ اضافه شد
        slug: true,            // ✅ اضافه شد
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
      <div className="page-header">
        <h1>
          <i className="fas fa-users" style={{ color: "var(--primary)" }}></i>
          Profiles
        </h1>
      </div>

      <ProfileFilter
        currentRole={role}
        currentCategory={category}
        currentSearch={search}
        categories={categories}
      />

      {profiles.length > 0 ? (
        <div className="profiles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h3>No profiles found</h3>
          <p className="text-muted">Try adjusting your filters.</p>
        </div>
      )}

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} />}
    </div>
  );
}