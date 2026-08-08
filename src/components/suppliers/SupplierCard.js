// src/components/suppliers/SupplierCard.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";

export default function SupplierCard({ supplier }) {
  const initials = supplier.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "S";

  const verified = supplier.plan === "GOLD" || supplier.plan === "SILVER";
  const premium = supplier.plan === "GOLD";

  return (
    <Link href={`/suppliers/${supplier.id}`} className="supplier-card">
      <div className="supplier-header">
        <div className="supplier-avatar">
          {supplier.image ? (
            <img src={supplier.image} alt={supplier.name} />
          ) : (
            initials
          )}
        </div>
        <div>
          <div className="supplier-name">{supplier.name}</div>
          <div className="supplier-company">{supplier.companyName || "Independent Supplier"}</div>
        </div>
      </div>

      <div className="supplier-badges" style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {verified && (
          <span className="supplier-badge verified">
            <i className="fas fa-check-circle"></i> Verified
          </span>
        )}
        {premium && (
          <span className="supplier-badge premium">
            <i className="fas fa-crown"></i> Premium
          </span>
        )}
      </div>

      <div className="supplier-details">
        <div className="detail-item">
          <CountryFlag countryCode={supplier.countryCode} size="16px" />
          {supplier.country || "—"}
        </div>
        <div className="detail-item">
          <i className="fas fa-box"></i>
          {supplier._count?.products || 0} Products
        </div>
        <div className="detail-item">
          <i className="fas fa-calendar-alt"></i>
          Joined {new Date(supplier.createdAt).getFullYear()}
        </div>
        <div className="detail-item">
          <i className="fas fa-star" style={{ color: "var(--secondary)" }}></i>
          {supplier.plan || "Free"}
        </div>
      </div>

      <div className="supplier-footer">
        <span className="products-count">
          <span>{supplier._count?.products || 0}</span> products listed
        </span>
        <span className="btn btn-outline-secondary btn-sm rounded-pill px-3">
          View Profile
        </span>
      </div>
    </Link>
  );
}