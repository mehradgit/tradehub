// src/components/profiles/ProfileCard.js
"use client"
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";

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
  const isPremium = profile.plan === "GOLD";

  const productCount = profile._count?.products || 0;
  const requestCount = profile._count?.buyingRequests || 0;

  return (
    <>
      <Link
        href={`/profiles/${profile.profileNumber}/${profile.slug}`}
        className="profile-card-link"
      >
        <div className="profile-card">
          {/* Header: Avatar + Name + Country */}
          <div className="profile-card-header">
            <div className={`profile-avatar ${isSupplier ? "supplier" : "buyer"}`}>
              {profile.logo || profile.image ? (
                <img
                  src={profile.logo || profile.image}
                  alt={displayName}
                  loading="lazy"
                />
              ) : (
                <span className="profile-initials">{initials}</span>
              )}
            </div>

            <div className="profile-info">
              <h3 className="profile-name" title={displayName}>
                {displayName}
              </h3>
              <div className="profile-location">
                <CountryFlag countryCode={profile.countryCode} size="14px" />
                <span>{profile.country || "Location not specified"}</span>
              </div>
            </div>
          </div>

          {/* Badges: Role + Verified */}
          <div className="profile-badges">
            <span className={`role-badge ${isSupplier ? "supplier" : "buyer"}`}>
              <i
                className={`fas ${isSupplier ? "fa-tractor" : "fa-store"}`}
              ></i>
              {isSupplier ? "Supplier" : "Buyer"}
            </span>

            {isVerified && (
              <span className="verified-badge">
                <i className="fas fa-check-circle"></i>
                {isPremium ? "Premium" : "Verified"}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="stat-value">{productCount}</div>
              <div className="stat-label">
                <i className="fas fa-box"></i> Products
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="profile-stat">
              <div className="stat-value">{requestCount}</div>
              <div className="stat-label">
                <i className="fas fa-shopping-cart"></i> Requests
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="profile-footer">
            <span className="view-profile-text">
              View Profile
              <i className="fas fa-arrow-right"></i>
            </span>
          </div>
        </div>
      </Link>

      <style jsx>{`
        .profile-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
          min-width: 0;
        }

        .profile-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 18px;
          padding: 18px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
          min-width: 0;
          overflow: hidden;
        }

        .profile-card-link:hover .profile-card {
          transform: translateY(-3px);
          border-color: #13795b;
          box-shadow: 0 12px 32px rgba(19, 121, 91, 0.12);
        }

        /* ============================================================
           Header
           ============================================================ */
        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .profile-avatar {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
          overflow: hidden;
          font-family: "Manrope", sans-serif;
        }

        .profile-avatar.supplier {
          background: linear-gradient(135deg, #13795b, #0d9469);
        }

        .profile-avatar.buyer {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-initials {
          display: block;
          line-height: 1;
        }

        .profile-info {
          flex: 1;
          min-width: 0;
        }

        .profile-name {
          font-size: 15px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          line-height: 1.3;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-location {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 12.5px;
          color: #64748b;
          min-width: 0;
        }

        .profile-location span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        /* ============================================================
           Badges
           ============================================================ */
        .profile-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .role-badge,
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .role-badge.supplier {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .role-badge.buyer {
          background: #eef0ff;
          color: #4f46e5;
        }

        .role-badge i {
          font-size: 9px;
        }

        .verified-badge {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .verified-badge i {
          font-size: 10px;
        }

        /* ============================================================
           Stats
           ============================================================ */
        .profile-stats {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f7;
          margin-top: auto;
        }

        .profile-stat {
          flex: 1;
          text-align: center;
          min-width: 0;
        }

        .stat-value {
          font-size: 17px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          line-height: 1.1;
        }

        .stat-label {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
          margin-top: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .stat-label i {
          font-size: 9px;
        }

        .stat-divider {
          width: 1px;
          height: 28px;
          background: #e2e8f0;
          flex-shrink: 0;
        }

        /* ============================================================
           Footer
           ============================================================ */
        .profile-footer {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }

        .view-profile-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #13795b;
          font-size: 12.5px;
          font-weight: 700;
          transition: gap 0.2s ease;
        }

        .profile-card-link:hover .view-profile-text {
          gap: 10px;
        }

        .view-profile-text i {
          font-size: 10px;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 768px) {
          .profile-card {
            padding: 14px;
            border-radius: 16px;
            gap: 12px;
          }

          .profile-avatar {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            font-size: 15px;
          }

          .profile-name {
            font-size: 14px;
          }

          .profile-location {
            font-size: 11.5px;
          }

          .stat-value {
            font-size: 15px;
          }

          .stat-label {
            font-size: 10px;
          }
        }

        @media (max-width: 500px) {
          .profile-card {
            padding: 12px;
            border-radius: 14px;
            gap: 10px;
          }

          .profile-avatar {
            width: 44px;
            height: 44px;
            border-radius: 11px;
            font-size: 14px;
          }

          .profile-name {
            font-size: 13.5px;
          }

          .role-badge,
          .verified-badge {
            font-size: 10px;
            padding: 3px 8px;
          }

          .profile-stats {
            padding: 8px 10px;
          }

          .stat-value {
            font-size: 14px;
          }

          .stat-label {
            font-size: 9.5px;
          }

          .view-profile-text {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}