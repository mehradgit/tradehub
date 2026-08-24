// src/components/profiles/ProfileCard.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryName } from "@/lib/countries";

export default function ProfileCard({ profile }) {
  const displayName = profile.companyName || profile.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const isSupplier = profile.role === "SUPPLIER";
  const isVerified = profile.plan === "GOLD" || profile.plan === "SILVER";

  return (
    <Link href={`/profiles/${profile.profileNumber}/${profile.slug}`} className="text-decoration-none">
      <div
        className="card h-100 shadow-sm border-0"
        style={{ transition: "all 0.2s ease", borderRadius: "12px" }}
      >
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "56px",
                height: "56px",
                background: isSupplier ? "var(--primary)" : "var(--accent)",
                color: "white",
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="fw-bold fs-6">{displayName}</div>
              <div className="text-muted small">
                <CountryFlag countryCode={profile.countryCode} size="14px" /> {profile.country || "—"}
                
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="badge bg-light text-dark">
              <i className={`fas ${isSupplier ? "fa-tractor" : "fa-store"}`}></i>{" "}
              {isSupplier ? "Supplier" : "Buyer"}
            </span>
            {isVerified && <span className="badge bg-success"><i className="fas fa-check-circle me-1"></i>Verified</span>}
          </div>
          <div className="mt-2 small text-muted">
            <i className="fas fa-box me-1"></i> {profile._count?.products || 0} products
            {!isSupplier && (
              <span className="ms-2">
                <i className="fas fa-shopping-cart me-1"></i> {profile._count?.buyingRequests || 0} requests
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}