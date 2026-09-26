// src/app/dashboard/customers/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CustomerCard from "@/components/dashboard/CustomerCard";

export const metadata = { title: "Customers | Dashboard" };

export default async function CustomersPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isAdmin: true },
  });

  if (!user) redirect("/login");

  // فقط SUPPLIER یا admin
  if (user.role !== "SUPPLIER" && !user.isAdmin) {
    redirect("/dashboard");
  }

  const userId = session.user.id;
  const { search = "", sort = "recent" } = await searchParams;

  // ====== دریافت همه‌ی inquiries دریافت‌شده ======
  const allInquiries = await prisma.productInquiry.findMany({
    where: { supplierId: userId },
    select: {
      userId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          companyName: true,
          country: true,
          countryCode: true,
          image: true,
          logo: true,
          profileNumber: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // ====== گروه‌بندی بر اساس کاربر ======
  const customerMap = new Map();

  for (const inq of allInquiries) {
    const uid = inq.userId;
    if (!customerMap.has(uid)) {
      customerMap.set(uid, {
        user: inq.user,
        inquiryCount: 0,
        messageCount: 0,
        quoteCount: 0,
        lastContact: null,
      });
    }
    const entry = customerMap.get(uid);
    entry.inquiryCount++;
    if (!entry.lastContact || new Date(inq.createdAt) > new Date(entry.lastContact)) {
      entry.lastContact = inq.createdAt;
    }
  }

  // ====== اضافه کردن تعداد پیام‌ها و quotes ======
  const customerIds = Array.from(customerMap.keys());

  if (customerIds.length > 0) {
    const [messageCounts, quoteCounts] = await Promise.all([
      prisma.message.groupBy({
        by: ["senderId"],
        where: {
          receiverId: userId,
          senderId: { in: customerIds },
        },
        _count: true,
      }),
      prisma.quote.groupBy({
        by: ["buyerId"],
        where: {
          supplierId: userId,
          buyerId: { in: customerIds },
        },
        _count: true,
      }),
    ]);

    messageCounts.forEach((m) => {
      const entry = customerMap.get(m.senderId);
      if (entry) entry.messageCount = m._count;
    });

    quoteCounts.forEach((q) => {
      const entry = customerMap.get(q.buyerId);
      if (entry) entry.quoteCount = q._count;
    });
  }

  let customers = Array.from(customerMap.values());

  // ====== جستجو ======
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter((c) => {
      const name = (c.user.name || "").toLowerCase();
      const company = (c.user.companyName || "").toLowerCase();
      const country = (c.user.country || "").toLowerCase();
      return (
        name.includes(q) || company.includes(q) || country.includes(q)
      );
    });
  }

  // ====== مرتب‌سازی ======
  if (sort === "inquiries") {
    customers.sort((a, b) => b.inquiryCount - a.inquiryCount);
  } else if (sort === "name") {
    customers.sort((a, b) =>
      (a.user.companyName || a.user.name || "").localeCompare(
        b.user.companyName || b.user.name || ""
      )
    );
  } else {
    // recent (default)
    customers.sort(
      (a, b) => new Date(b.lastContact) - new Date(a.lastContact)
    );
  }

  // ====== آمار کلی ======
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => {
    if (!c.lastContact) return false;
    const diff =
      (Date.now() - new Date(c.lastContact).getTime()) /
      (1000 * 60 * 60 * 24);
    return diff < 30;
  }).length;
  const newCustomers = customers.filter((c) => {
    if (!c.lastContact) return false;
    const diff =
      (Date.now() - new Date(c.lastContact).getTime()) /
      (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;

  const sortOptions = [
    { value: "recent", label: "Recent Activity" },
    { value: "inquiries", label: "Most Inquiries" },
    { value: "name", label: "Name (A-Z)" },
  ];

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1600 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1
            className="fw-bold mb-0"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 24,
              color: "var(--d-dark, #0b1f18)",
            }}
          >
            <i
              className="fas fa-users me-2"
              style={{ color: "var(--d-primary, #0f9e6e)" }}
            ></i>
            Customers
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Buyers who have contacted you
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="d-stats mb-4">
        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon green">
              <i className="fas fa-users"></i>
            </div>
          </div>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-label">Total Customers</div>
        </div>

        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon indigo">
              <i className="fas fa-user-check"></i>
            </div>
          </div>
          <div className="stat-value">{activeCustomers}</div>
          <div className="stat-label">Active (Last 30d)</div>
        </div>

        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon amber">
              <i className="fas fa-user-plus"></i>
            </div>
          </div>
          <div className="stat-value">{newCustomers}</div>
          <div className="stat-label">New (Last 7d)</div>
        </div>

        <div className="d-stat" style={{ cursor: "default" }}>
          <div className="stat-head">
            <div className="stat-icon rose">
              <i className="fas fa-comments"></i>
            </div>
          </div>
          <div className="stat-value">
            {customers.reduce((sum, c) => sum + c.inquiryCount, 0)}
          </div>
          <div className="stat-label">Total Inquiries</div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="d-flex gap-3 mb-4 flex-wrap align-items-center"
        style={{
          background: "white",
          padding: 14,
          borderRadius: 14,
          border: "1px solid var(--d-border, #e8edf0)",
        }}
      >
        <form
          action="/dashboard/customers"
          style={{
            flex: 1,
            minWidth: 220,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--d-bg, #f6f8f9)",
            borderRadius: 10,
            padding: "4px 4px 4px 14px",
          }}
        >
          <i
            className="fas fa-search"
            style={{ color: "var(--d-muted, #94a3b8)", fontSize: 13 }}
          ></i>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, company, or country..."
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              background: "transparent",
              fontSize: 13,
              padding: "8px 0",
              color: "var(--d-dark, #0b1f18)",
            }}
          />
          {sort !== "recent" && (
            <input type="hidden" name="sort" value={sort} />
          )}
          <button
            type="submit"
            style={{
              padding: "7px 16px",
              background: "var(--d-primary, #0f9e6e)",
              color: "white",
              border: 0,
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/dashboard/customers?sort=${opt.value}${
                search ? `&search=${search}` : ""
              }`}
              style={{
                padding: "8px 14px",
                borderRadius: 50,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                background:
                  sort === opt.value ? "var(--d-primary, #0f9e6e)" : "white",
                color:
                  sort === opt.value ? "white" : "var(--d-text, #334155)",
                border: `1px solid ${
                  sort === opt.value
                    ? "var(--d-primary, #0f9e6e)"
                    : "var(--d-border, #e8edf0)"
                }`,
              }}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Customer Grid */}
      {customers.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {customers.map((c) => (
            <CustomerCard key={c.user.id} customer={c} />
          ))}
        </div>
      ) : (
        <div
          className="d-card"
          style={{
            padding: 60,
            textAlign: "center",
            color: "var(--d-muted, #94a3b8)",
          }}
        >
          <i
            className="fas fa-users"
            style={{
              fontSize: 44,
              opacity: 0.3,
              display: "block",
              marginBottom: 14,
            }}
          ></i>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--d-dark, #0b1f18)",
              marginBottom: 6,
            }}
          >
            {search ? "No customers found" : "No customers yet"}
          </h3>
          <p style={{ fontSize: 13, marginBottom: 0 }}>
            {search
              ? "Try a different search term."
              : "When buyers contact you, they'll appear here."}
          </p>
        </div>
      )}
    </div>
  );
}