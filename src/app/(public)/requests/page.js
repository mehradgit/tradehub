// src/app/(public)/requests/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RequestCard from "@/components/requests/RequestCard";
import Pagination from "@/components/requests/Pagination";
import FilterBar from "@/components/requests/FilterBar";

export default async function RequestsPage({ searchParams }) {
  const {
    page: pageParam = 1,
    category = "",
    subCategory = "", // ✅ اضافه شد
    search = "",
    filter = "all", // ممکن است فیلتر urgent باشد
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = {
    isVisible: true,
    status: "APPROVED", 
  };

  if (category) {
    where.category = category;
  }
  if (subCategory) {
    where.subCategory = subCategory;
  }

  // ✅ جستجوی پیشرفته
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { category: { contains: search } },
      { subCategory: { contains: search } },
      { deliveryCountry: { contains: search } },
    ];
  }

  // فیلتر وضعیت (urgent)
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

  // آمارها (دیگر در UI نشان داده نمی‌شوند)
  // const totalUrgent = ... (حذف شده)

  return (
      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>Home</Link>
            </li>
            <li className="breadcrumb-item active text-muted">Buying Requests</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="page-header">
          <h1>
            <i className="fas fa-shopping-cart" style={{ color: "var(--primary)" }}></i>
            Buying Requests
            {/* ✅ تعداد درخواست‌ها حذف شد */}
          </h1>
          {/* ✅ دکمه Post New Request حذف شد */}
        </div>

        {/* ✅ نوار آمار حذف شد */}

        {/* Filter Bar (با دراپ‌داون سلسله‌مراتبی) */}
        <FilterBar
          currentCategory={category}
          currentSubCategory={subCategory}
          currentSearch={search}
          currentFilter={filter}
        />

        {/* Requests Grid */}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
  );
}