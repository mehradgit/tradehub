// src/app/requests/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import RequestCard from "@/components/requests/RequestCard";
import Pagination from "@/components/requests/Pagination";
import FilterBar from "@/components/requests/FilterBar";

export default async function RequestsPage({ searchParams }) {
  const {
    page: pageParam = 1,
    category = "",
    search = "",
    filter = "all",
  } = await searchParams;
  const page = parseInt(searchParams?.page) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = {
    isVisible: true,
  };

  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
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
            countryCode: true, // ✅ اضافه شد
          },
        },
      },
    }),
    prisma.buyingRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const totalUrgent = await prisma.buyingRequest.count({
    where: { ...where, isUrgent: true },
  });
  const totalOpen = await prisma.buyingRequest.count({
    where: { ...where, isUrgent: false },
  });

  const categories = await prisma.buyingRequest.findMany({
    where: { isVisible: true },
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <Layout>
      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link
                href="/"
                className="text-decoration-none"
                style={{ color: "var(--primary)" }}
              >
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">
              Buying Requests
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="page-header">
          <h1>
            <i
              className="fas fa-shopping-cart"
              style={{ color: "var(--primary)" }}
            ></i>
            Buying Requests
            <span className="request-count">({totalCount} requests)</span>
          </h1>
          <Link href="/requests/new" className="btn btn-primary">
            <i className="fas fa-plus"></i> Post New Request
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{totalUrgent}</div>
            <div className="stat-label">Urgent</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{totalOpen}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{Math.ceil(totalCount / 30)}</div>
            <div className="stat-label">Pages</div>
          </div>
        </div>

        {/* Filter Bar (Client Component) */}
        <FilterBar
          categories={categories}
          currentCategory={category}
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
            <p>Try adjusting your filters or post a new request.</p>
            <Link href="/requests/new" className="btn btn-primary">
              <i className="fas fa-plus"></i> Post New Request
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </Layout>
  );
}
