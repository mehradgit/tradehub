// src/app/(public)/profiles/[profileNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import ProfileTabs from "@/components/profiles/ProfileTabs";

// ====== دریافت اطلاعات کاربر با استفاده از profileNumber ======
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

  if (!user) notFound();
  return user;
}

// ====== دریافت محصولات و درخواست‌های خرید ======
async function getUserRelatedData(user) {
  let products = [];
  let buyingRequests = [];

  if (user.role === "SUPPLIER") {
    products = await prisma.product.findMany({
      where: { userId: user.id, isVisible: true, status: "APPROVED" },
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
  } else if (user.role === "BUYER") {
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

  return { products, buyingRequests };
}

// ====== متادیتا ======
export async function generateMetadata({ params }) {
  const { profileNumber } = await params;
  const user = await prisma.user.findUnique({
    where: { profileNumber: parseInt(profileNumber) },
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
  const { profileNumber, slug } = await params;
  const profileNum = parseInt(profileNumber);

  const user = await getUserProfile(profileNum);
  const { products, buyingRequests } = await getUserRelatedData(user);

  const displayName = user.companyName || user.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const logo = user.logo || user.image || null;
  const coverImage = user.coverImage || null;
  const isVerified = user.plan === "GOLD" || user.plan === "SILVER";
  const isPremium = user.plan === "GOLD";
  const isSupplier = user.role === "SUPPLIER";
  const roleLabel = isSupplier ? "Supplier" : "Buyer";

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
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
          <li className="breadcrumb-item active text-muted">{displayName}</li>
        </ol>
      </nav>

      {/* ====== Cover Image ====== */}
      <div
        className="profile-cover-wrapper"
        style={{
          width: "100%",
          height: "300px",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${displayName} cover`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "30px 150px 20px 30px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: 800,
              margin: 0,
            }}
          >
            {displayName}
          </h1>
          <div
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
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
      <div
        className="profile-header"
        style={{
          display: "flex",
          alignItems: "flex-end",
          marginTop: "-60px",
          padding: "0 30px 20px",
          position: "relative",
          zIndex: 2,
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "4px solid white",
            boxShadow: "var(--shadow)",
            background: "var(--white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            fontWeight: 800,
            color: "var(--primary)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {logo ? (
            <img
              src={logo}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {initials}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "200px", paddingTop: "60px" }}>
          <h2 style={{ fontSize: "24px", color: "var(--black)", margin: 0 }}>
            {displayName}
          </h2>
          <div
            style={{ color: "var(--gray)", fontSize: "14px", marginTop: "4px" }}
          >
            <i className="fas fa-map-pin"></i>{" "}
            {user.country || "Location not specified"}
            {user.employeeCount && (
              <>
                <span className="mx-2">·</span>
                <i className="fas fa-users"></i> {user.employeeCount} employees
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
        </div>

        {/* دکمه‌های اقدام (در صورت لاگین بودن و غیره) */}
        {/* اینجا می‌توانید ProfileHeader را اضافه کنید */}
      </div>

      {/* ====== Tabs ====== */}
      <ProfileTabs
        user={user}
        products={products}
        buyingRequests={buyingRequests}
      />
    </div>
  );
}
