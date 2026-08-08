// src/app/suppliers/[id]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import ProfileTabs from "@/components/profile/ProfileTabs";
import CountryFlag from "@/components/ui/CountryFlag";

async function getSupplier(id) {
  const supplier = await prisma.user.findUnique({
    where: { id, role: "SUPPLIER" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      coverImage: true,
      logo: true,
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
      createdAt: true,
    },
  });

  if (!supplier) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { userId: supplier.id, isVisible: true },
    select: {
      id: true,
      name: true,
      price: true,
      unit: true,
      images: true,
      badge: true,
      country: true,
      countryCode: true,
    },
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  return { supplier, products };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supplier = await prisma.user.findUnique({
    where: { id, role: "SUPPLIER" },
    select: { name: true, companyName: true, bio: true },
  });

  if (!supplier) {
    return { title: "Supplier Not Found" };
  }

  const name = supplier.companyName || supplier.name || "Supplier";
  return {
    title: `${name} · B2B Food Hub`,
    description:
      supplier.bio?.slice(0, 160) || `View ${name}'s profile on B2B Food Hub.`,
  };
}

export default async function SupplierProfilePage({ params }) {
  const { id } = await params;
  const { supplier, products } = await getSupplier(id);

  const displayName = supplier.companyName || supplier.name || "Supplier";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const coverImage = supplier.coverImage || null;
  const logo = supplier.logo || supplier.image || null;

  const isVerified = supplier.plan === "GOLD" || supplier.plan === "SILVER";
  const isPremium = supplier.plan === "GOLD";

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
            <li className="breadcrumb-item">
              <Link
                href="/suppliers"
                className="text-decoration-none"
                style={{ color: "var(--primary)" }}
              >
                Suppliers
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">{displayName}</li>
          </ol>
        </nav>

        {/* Cover Image */}
        <div className="supplier-cover">
          {coverImage ? (
            <img src={coverImage} alt={displayName} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, var(--primary-light), var(--primary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <i className="fas fa-building"></i>
            </div>
          )}
          <div className="cover-overlay">
            <h1 className="supplier-name-big">{displayName}</h1>
            <div className="supplier-role-badge">
              {isVerified && (
                <span className="badge bg-success me-2">✓ Verified</span>
              )}
              {isPremium && (
                <span
                  className="badge"
                  style={{
                    background: "var(--secondary)",
                    color: "var(--black)",
                  }}
                >
                  ★ Premium
                </span>
              )}
              <span className="ms-2">
                {supplier.businessType || "Supplier"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="supplier-profile-header">
          <div className="supplier-logo">
            {logo ? <img src={logo} alt={displayName} /> : initials}
          </div>
          <div className="supplier-info-main">
            <h2>{displayName}</h2>
            <div className="sub-info">
              <CountryFlag countryCode={supplier.countryCode} size="16px" />
              
              {supplier.country || "Location not specified"}
              {supplier.employeeCount && (
                <>
                  <span className="mx-2">·</span>
                  <i className="fas fa-users"></i> {supplier.employeeCount}{" "}
                  employees
                </>
              )}
              {supplier.businessType && (
                <>
                  <span className="mx-2">·</span>
                  <i className="fas fa-tag"></i> {supplier.businessType}
                </>
              )}
            </div>
          </div>
          <div className="supplier-actions">
            <button className="btn btn-primary">
              <i className="fas fa-envelope"></i> Contact
            </button>
            <button className="btn btn-outline-secondary">
              <i className="fas fa-bookmark"></i> Save
            </button>
          </div>
        </div>

        {/* ====== Tabs ====== */}
        {/* ✅ اصلاح: supplier -> user */}
        <ProfileTabs user={supplier} products={products} />
      </div>
    </Layout>
  );
}
