// src/app/(public)/search/page.js
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";

export const metadata = { title: "Search Results | FoodTradeHub" };

export default async function SearchPage({ searchParams }) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  if (!query || query.length < 2) {
    return (
      <div className="container py-5">
        <div className="empty-state">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h3>Search FoodTradeHub</h3>
          <p className="text-muted">Type at least 2 characters to search.</p>
        </div>
      </div>
    );
  }

  const [products, requests, profiles] = await Promise.all([
    prisma.product.findMany({
      where: {
        isVisible: true,
        status: "APPROVED",
        OR: [
          { name: { contains: query } },
          { shortDesc: { contains: query } },
          { category: { contains: query } },
          { subCategory: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        currency: true,
        unit: true,
        category: true,
        productNumber: true,
        slug: true,
        country: true,
        countryCode: true,
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    prisma.buyingRequest.findMany({
      where: {
        isVisible: true,
        status: "APPROVED",
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
          { deliveryCountry: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        quantity: true,
        unit: true,
        isUrgent: true,
        deliveryCountry: true,
        buyerCountry: true,
        createdAt: true,
        requestNumber: true,
        slug: true,
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        registrationComplete: true,
        OR: [
          { companyName: { contains: query } },
          { name: { contains: query } },
          { country: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        image: true,
        logo: true,
        country: true,
        countryCode: true,
        role: true,
        profileNumber: true,
        slug: true,
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const total = products.length + requests.length + profiles.length;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-0">
          <i
            className="fas fa-search me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Search Results
        </h1>
        <p className="text-muted">
          {total} result{total !== 1 ? "s" : ""} for &quot;{query}&quot;
        </p>
      </div>

      {total === 0 && (
        <div className="empty-state">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h3>No results found</h3>
          <p className="text-muted">Try different keywords.</p>
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">
            <i className="fas fa-box me-2" style={{ color: "var(--primary)" }}></i>
            Products ({products.length})
          </h3>
          <div className="row g-3">
            {products.map((p) => (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <Link
                  href={`/products/${p.productNumber}/${p.slug}`}
                  className="text-decoration-none"
                >
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{ overflow: "hidden", borderRadius: 12 }}
                  >
                    <img
                      src={p.images?.[0] || "https://placehold.co/400x200"}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "cover",
                      }}
                    />
                    <div className="card-body">
                      <div
                        className="fw-bold"
                        style={{ fontSize: 14, color: "var(--black)" }}
                      >
                        {p.name}
                      </div>
                      <div
                        className="text-muted small mt-1"
                        style={{ fontSize: 12 }}
                      >
                        {p.category}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span
                          className="fw-bold"
                          style={{ color: "var(--primary)", fontSize: 15 }}
                        >
                          ${p.price}
                          <span
                            className="text-muted fw-normal"
                            style={{ fontSize: 11 }}
                          >
                            /{p.unit}
                          </span>
                        </span>
                        {p.country && (
                          <span
                            className="text-muted"
                            style={{ fontSize: 11 }}
                          >
                            <CountryFlag
                              countryCode={p.countryCode}
                              size="14px"
                            />{" "}
                            {p.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Requests */}
      {requests.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">
            <i
              className="fas fa-cart-shopping me-2"
              style={{ color: "var(--primary)" }}
            ></i>
            Buying Requests ({requests.length})
          </h3>
          <div className="row g-3">
            {requests.map((r) => (
              <div key={r.id} className="col-12 col-md-6">
                <Link
                  href={`/requests/${r.requestNumber}/${r.slug}`}
                  className="text-decoration-none"
                >
                  <div className="card border-0 shadow-sm h-100 p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div
                        className="fw-bold"
                        style={{ fontSize: 14, color: "var(--black)" }}
                      >
                        {r.title}
                      </div>
                      {r.isUrgent && (
                        <span
                          className="badge"
                          style={{
                            background: "#fde8e5",
                            color: "#dc2626",
                            fontSize: 10,
                          }}
                        >
                          Urgent
                        </span>
                      )}
                    </div>
                    <div
                      className="text-muted small mt-1"
                      style={{ fontSize: 12 }}
                    >
                      {r.category} · {r.quantity} {r.unit}
                      {r.deliveryCountry ? ` · ${r.deliveryCountry}` : ""}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Profiles */}
      {profiles.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">
            <i
              className="fas fa-users me-2"
              style={{ color: "var(--primary)" }}
            ></i>
            Profiles ({profiles.length})
          </h3>
          <div className="row g-3">
            {profiles.map((u) => (
              <div key={u.id} className="col-12 col-md-6 col-lg-4">
                <Link
                  href={`/profiles/${u.profileNumber}/${u.slug}`}
                  className="text-decoration-none"
                >
                  <div className="card border-0 shadow-sm h-100 p-3 d-flex flex-row align-items-center gap-3">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #13795b, #1d9a71)",
                        color: "white",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 16,
                        fontWeight: 800,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {u.logo || u.image ? (
                        <img
                          src={u.logo || u.image}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        (u.companyName || u.name || "U")
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="fw-bold"
                        style={{
                          fontSize: 14,
                          color: "var(--black)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.companyName || u.name}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: 12 }}
                      >
                        {u.role === "SUPPLIER" ? "Supplier" : "Buyer"}
                        {u.country ? ` · ${u.country}` : ""}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}