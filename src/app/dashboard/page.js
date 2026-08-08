// src/app/dashboard/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import MembershipCard from "@/components/dashboard/MembershipCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentMessages from "@/components/dashboard/RecentMessages";

export default async function DashboardPage() {
  // ====== احراز هویت ======
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // ====== دریافت اطلاعات کامل کاربر از دیتابیس ======
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      logo: true,
      coverImage: true,
      bio: true,
      address: true,
      phone: true,
      website: true,
      companyEmail: true,
      employeeCount: true,
      companyName: true,
      country: true,
      role: true,
      plan: true,
      createdAt: true,
      registrationComplete: true,
      _count: {
        select: {
          products: { where: { isVisible: true } },
          buyingRequests: { where: { isVisible: true } },
        },
      },
    },
  });

  if (!user || !user.registrationComplete) {
    redirect("/complete-registration");
  }

  // ====== آمار ======
  const stats = {
    products: user._count.products || 0,
    requests: user._count.buyingRequests || 0,
    orders: 12, // نمونه
    messages: 18, // نمونه
  };

  // ====== فعالیت‌های اخیر (نمونه) ======
  const recentActivities = [
    {
      id: 1,
      activity: "New order: Organic Coffee Beans (500kg)",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "processing",
    },
    {
      id: 2,
      activity: "Quote received for Raw Honey",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "pending",
    },
    {
      id: 3,
      activity: "Product added: Premium Saffron",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: 4,
      activity: "Order #1042 shipped: Olive Oil",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: 5,
      activity: "Buying request expired: Organic Quinoa",
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: "cancelled",
    },
  ];

  // ====== پیام‌های اخیر (نمونه) ======
  const recentMessages = [
    {
      id: 1,
      sender: "James Davis",
      initials: "JD",
      preview: "Hi, I'm interested in your organic coffee beans...",
      time: "2 hours ago",
    },
    {
      id: 2,
      sender: "Sarah Mitchell",
      initials: "SM",
      preview: "Can you provide a quote for 500kg of honey?",
      time: "5 hours ago",
    },
    {
      id: 3,
      sender: "Robert King",
      initials: "RK",
      preview: "Order #1042 has been shipped. Tracking:...",
      time: "Yesterday",
    },
  ];

  // ====== اطلاعات پلن ======
  const planInfo = {
    FREE: {
      badge: "Free",
      price: "$0",
      period: "forever",
      features: ["5 products", "3 requests/month", "Standard support"],
    },
    BRONZE: {
      badge: "Bronze",
      price: "$19",
      period: "/ month",
      features: [
        "25 products",
        "10 requests/month",
        "Priority support",
        "Basic analytics",
      ],
    },
    SILVER: {
      badge: "Popular",
      price: "$39",
      period: "/ month",
      features: [
        "100 products",
        "25 requests/month",
        "24/7 priority support",
        "Advanced analytics",
        "Verified badge",
      ],
    },
    GOLD: {
      badge: "Gold",
      price: "$79",
      period: "/ month",
      features: [
        "Unlimited products",
        "Unlimited requests",
        "Premium support",
        "Advanced analytics + API",
        "Gold badge",
        "Free trade assurance",
      ],
    },
  };

  const currentPlan = user.plan || "FREE";
  const plan = planInfo[currentPlan] || planInfo.FREE;

  // ====== اطلاعات نمایشی ======
  const displayName = user.companyName || user.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const coverImage = user.coverImage || null;
  const logo = user.logo || user.image || null;
  const isVerified = user.plan === "GOLD" || user.plan === "SILVER";
  const isPremium = user.plan === "GOLD";
  const roleLabel = user.role === "SUPPLIER" ? "Supplier" : "Buyer";
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout>
      <div className="container py-4">
        {/* ====== هدر شرکت ====== */}
        <div className="dashboard-company-header">
          {/* تصویر کاور */}
          <div className="company-cover">
            {coverImage ? (
              <img src={coverImage} alt={`${displayName} cover`} />
            ) : (
              <div className="default-cover">
                <i className="fas fa-building"></i>
              </div>
            )}
          </div>

          {/* اطلاعات شرکت */}
          <div className="company-info-wrapper">
            <div className="company-logo">
              {logo ? (
                <img src={logo} alt={displayName} />
              ) : (
                <span className="initials">{initials}</span>
              )}
            </div>
            <div className="company-details">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <h2 className="company-name">{displayName}</h2>
                {isVerified && (
                  <span className="badge bg-success px-3 py-2">✓ Verified</span>
                )}
                {isPremium && (
                  <span
                    className="badge px-3 py-2"
                    style={{
                      background: "var(--secondary)",
                      color: "var(--black)",
                    }}
                  >
                    ★ Premium
                  </span>
                )}
              </div>
              <div className="company-meta">
                <span>
                  <i className="fas fa-tag"></i> {roleLabel}
                </span>
                {user.businessType && (
                  <span>
                    <i className="fas fa-briefcase"></i> {user.businessType}
                  </span>
                )}
                {user.country && (
                  <span>
                    <i className="fas fa-map-pin"></i> {user.country}
                  </span>
                )}
                {user.employeeCount && (
                  <span>
                    <i className="fas fa-users"></i> {user.employeeCount}{" "}
                    employees
                  </span>
                )}
                <span>
                  <i className="fas fa-calendar-alt"></i> Member since{" "}
                  {new Date(user.createdAt).getFullYear()}
                </span>
              </div>
              {user.bio && (
                <p className="company-bio">{user.bio}</p>
              )}
              <div className="company-contact">
                {user.phone && (
                  <a href={`tel:${user.phone}`} className="contact-link">
                    <i className="fas fa-phone"></i> {user.phone}
                  </a>
                )}
                {(user.companyEmail || user.email) && (
                  <a
                    href={`mailto:${user.companyEmail || user.email}`}
                    className="contact-link"
                  >
                    <i className="fas fa-envelope"></i>{" "}
                    {user.companyEmail || user.email}
                  </a>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link"
                  >
                    <i className="fas fa-globe"></i> {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {user.address && (
                  <span className="contact-link">
                    <i className="fas fa-location-dot"></i> {user.address}
                  </span>
                )}
              </div>
              <div className="company-actions">
                <Link href="/dashboard/edit-profile" className="btn btn-primary btn-sm">
                  <i className="fas fa-user-edit me-1"></i> Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>


        {/* ====== Stats Grid ====== */}
        <StatsCard stats={stats} />

        {/* ====== Dashboard Grid ====== */}
        <div className="dashboard-grid">
          {/* ====== LEFT COLUMN ====== */}
          <div>
            {/* Recent Activity */}
            <RecentActivity activities={recentActivities} />

            {/* Membership Benefits Preview */}
            <div className="activity-section" style={{ marginBottom: 0 }}>
              <div className="section-header" style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px" }}>
                  <i className="fas fa-rocket"></i> Your Membership Benefits
                </h3>
                <Link href="/plans" style={{ fontSize: "13px" }}>
                  Upgrade
                </Link>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    background: "var(--light)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--accent)",
                    }}
                  >
                    {currentPlan === "FREE"
                      ? "5"
                      : currentPlan === "BRONZE"
                      ? "25"
                      : currentPlan === "SILVER"
                      ? "100"
                      : "∞"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--gray)" }}>
                    Product Listings
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    background: "var(--light)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--secondary)",
                    }}
                  >
                    {currentPlan === "FREE"
                      ? "3"
                      : currentPlan === "BRONZE"
                      ? "10"
                      : currentPlan === "SILVER"
                      ? "25"
                      : "∞"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--gray)" }}>
                    Requests / Month
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    background: "var(--light)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--primary)",
                    }}
                  >
                    ∞
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--gray)" }}>
                    Messages
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    background: "var(--light)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--primary-dark)",
                    }}
                  >
                    {currentPlan === "GOLD" ? "✓" : "—"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--gray)" }}>
                    Verified Badge
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====== RIGHT SIDEBAR ====== */}
          <div className="sidebar">
            {/* Membership Card */}
            <MembershipCard plan={plan} currentPlan={currentPlan} />

            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Messages */}
            <RecentMessages messages={recentMessages} />
          </div>
        </div>
      </div>
    </Layout>
  );
}