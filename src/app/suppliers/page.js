// src/app/suppliers/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import SupplierCard from "@/components/suppliers/SupplierCard";
import SupplierFilterBar from "@/components/suppliers/SupplierFilterBar";
import Pagination from "@/components/requests/Pagination";

export default async function SuppliersPage({ searchParams }) {
  // ====== دریافت پارامترهای صفحه ======
  const page = parseInt(searchParams?.page) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  // ====== دریافت فیلترها از URL ======
  const country = searchParams?.country || "";
  const search = searchParams?.search || "";
  const sort = searchParams?.sort || "newest";

  // ====== ساخت شرط WHERE ======
  const where = {
    role: "SUPPLIER",
  };

  if (country) {
    where.country = country;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { country: { contains: search } },
    ];
  }

  // ====== ساخت شرط ORDER BY ======
  let orderBy = {};
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "products":
      orderBy = { products: { _count: "desc" } };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // ====== دریافت داده‌ها از دیتابیس ======
  const [suppliers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        companyName: true,
        country: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: { isVisible: true },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ====== دریافت کشورها برای فیلتر ======
  const countries = await prisma.user.findMany({
    where: { role: "SUPPLIER" },
    select: { country: true },
    distinct: ["country"],
  });

  // ====== آمار ======
  const verifiedCount = await prisma.user.count({
    where: {
      role: "SUPPLIER",
      plan: { in: ["GOLD", "SILVER"] },
    },
  });

  const countryCount = await prisma.user.findMany({
    where: { role: "SUPPLIER" },
    select: { country: true },
    distinct: ["country"],
  });

  const countriesList = countries.map((c) => c.country).filter(Boolean);

  return (
    <Layout>
      <div className="container py-4">
        {/* ====== Breadcrumb ====== */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" className="text-decoration-none" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">Suppliers</li>
          </ol>
        </nav>

        {/* ====== Page Header ====== */}
        <div className="page-header">
          <h1>
            <i className="fas fa-tractor" style={{ color: "var(--primary)" }}></i>
            Suppliers
            <span className="request-count">({totalCount} suppliers)</span>
          </h1>
        </div>

        {/* ====== Stats Bar ====== */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label">Total Suppliers</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{verifiedCount}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{countriesList.length}</div>
            <div className="stat-label">Countries</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{Math.ceil(totalCount / 30)}</div>
            <div className="stat-label">Pages</div>
          </div>
        </div>

        {/* ====== Filter Bar ====== */}
        <SupplierFilterBar
          countries={countriesList}
          currentCountry={country}
          currentSearch={search}
          currentSort={sort}
        />

        {/* ====== Suppliers Grid ====== */}
        {suppliers.length > 0 ? (
          <div className="suppliers-grid">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No suppliers found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        )}

        {/* ====== Pagination ====== */}
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </Layout>
  );
}