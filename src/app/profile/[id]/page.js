// src/app/profile/[id]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { getImageSrc } from "@/utils/imageHelpers";
// ====== تابع دریافت اطلاعات کاربر ======
async function getUserProfile(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true, // لوگو (از تکمیل ثبت‌نام)
      coverImage: true,
      logo: true, // لوگو (ذخیره شده جدا)
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
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  // دریافت محصولات (برای تأمین‌کننده)
  let products = [];
  if (user.role === "SUPPLIER") {
    products = await prisma.product.findMany({
      where: { userId: user.id, isVisible: true },
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
  }

  // دریافت درخواست‌های خرید (برای خریدار)
  let buyingRequests = [];
  if (user.role === "BUYER") {
    buyingRequests = await prisma.buyingRequest.findMany({
      where: { userId: user.id, isVisible: true },
      select: {
        id: true,
        title: true,
        description: true,
        budgetRange: true,
        isUrgent: true,
        deliveryCountry: true,
        createdAt: true,
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    });
  }

  return { user, products, buyingRequests };
}

// ====== متادیتا ======
export async function generateMetadata({ params }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, companyName: true, bio: true, role: true },
  });

  if (!user) {
    return { title: "User Not Found" };
  }

  const name = user.companyName || user.name || "User";
  const roleLabel = user.role === "SUPPLIER" ? "Supplier" : "Buyer";
  return {
    title: `${name} · ${roleLabel} Profile | B2B Food Hub`,
    description:
      user.bio?.slice(0, 160) || `View ${name}'s profile on B2B Food Hub.`,
  };
}

// ====== صفحه پروفایل ======
export default async function ProfilePage({ params }) {
  const { id } = await params;
  const { user, products, buyingRequests } = await getUserProfile(id);

  const displayName = user.companyName || user.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // اولویت: لوگو را از فیلد logo یا image بگیر
  const logo = user.logo || user.image || null;
  const coverImage = user.coverImage || null;

  const isVerified = user.plan === "GOLD" || user.plan === "SILVER";
  const isPremium = user.plan === "GOLD";
  const isSupplier = user.role === "SUPPLIER";
  const roleLabel = isSupplier ? "Supplier" : "Buyer";

  const socialLinks = user.socialLinks || {};

  return (
    <Layout>
      <div className="container py-4">
        {/* ====== Breadcrumb ====== */}
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
                href={isSupplier ? "/suppliers" : "/buyers"}
                className="text-decoration-none"
                style={{ color: "var(--primary)" }}
              >
                {isSupplier ? "Suppliers" : "Buyers"}
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">{displayName}</li>
          </ol>
        </nav>

        {/* ====== Cover Image ====== */}
        <div className="supplier-cover">
          {coverImage ? (
            <img src={coverImage} alt={`${displayName} cover`} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: isSupplier
                  ? "linear-gradient(135deg, var(--primary-light), var(--primary))"
                  : "linear-gradient(135deg, var(--accent), #1f5c4a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <i
                className={isSupplier ? "fas fa-store" : "fas fa-shopping-cart"}
              ></i>
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
              <span className="ms-2">{roleLabel}</span>
              {user.businessType && (
                <span className="ms-2">· {user.businessType}</span>
              )}
            </div>
          </div>
        </div>

        {/* ====== Profile Header ====== */}
        <div className="supplier-profile-header">
          <div className="supplier-logo">
            {logo ? (
              <img src={logo} alt={`${displayName} logo`} />
            ) : (
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "var(--primary)",
                }}
              >
                {initials}
              </span>
            )}
          </div>
          <div className="supplier-info-main">
            <h2>{displayName}</h2>
            <div className="sub-info">
              <i className="fas fa-map-pin"></i>{" "}
              {user.country || "Location not specified"}
              {user.employeeCount && (
                <>
                  <span className="mx-2">·</span>
                  <i className="fas fa-users"></i> {user.employeeCount}{" "}
                  employees
                </>
              )}
              {user.businessType && (
                <>
                  <span className="mx-2">·</span>
                  <i className="fas fa-tag"></i> {user.businessType}
                </>
              )}
              <span className="mx-2">·</span>
              <i className="fas fa-calendar-alt"></i> Member since{" "}
              {new Date(user.createdAt).getFullYear()}
            </div>
            {/* Social Links */}
            {Object.keys(socialLinks).length > 0 && (
              <div className="social-links mt-2">
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <i className="fab fa-twitter"></i>
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
              </div>
            )}
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
        <ProfileTabs
          user={user}
          products={products}
          buyingRequests={buyingRequests}
        />
      </div>
    </Layout>
  );
}
