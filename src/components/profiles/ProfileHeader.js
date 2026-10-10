// src/components/profiles/ProfileHeader.js
"use client";

import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import {
  AVATAR_PLACEHOLDER,
  COVER_PLACEHOLDER,
  handleImageError,
} from "@/lib/imageHelpers";

export default function ProfileHeader({ user, productCount = 0, galleryCount = 0 }) {
  const displayName = user.companyName || user.name || "User";

  const isSupplier = user.role === "SUPPLIER";
  const isVerified = user.plan === "GOLD" || user.plan === "SILVER";
  const isPremium = user.plan === "GOLD";
  const roleLabel = isSupplier ? "Supplier" : "Buyer";

  const joinYear = new Date(user.createdAt).getFullYear();
  const logo = user.logo || user.image;
  const coverImage = user.coverImage;

  const publicUrl =
    user.profileNumber && user.slug
      ? `/profiles/${user.profileNumber}/${user.slug}`
      : null;

  return (
    <>
      <div className="profile-header-wrapper">
        {/* ===== Cover ===== */}
        <div
          className={`profile-cover ${coverImage ? "has-image" : "default"}`}
        >
          <img
            src={coverImage || COVER_PLACEHOLDER}
            alt={displayName}
            onError={(e) => handleImageError(e, COVER_PLACEHOLDER)}
          />
        </div>

        {/* ===== Info Row ===== */}
        <div className="profile-info-row">
          {/* Avatar */}
          <div className={`profile-avatar ${isSupplier ? "supplier" : "buyer"}`}>
            <img
              src={logo || AVATAR_PLACEHOLDER}
              alt={displayName}
              onError={(e) => handleImageError(e, AVATAR_PLACEHOLDER)}
            />
          </div>

          {/* Details */}
          <div className="profile-details">
            <div className="profile-name-row">
              <h1 className="profile-name">{displayName}</h1>
              {isVerified && (
                <span className={`verified-badge ${isPremium ? "premium" : ""}`}>
                  <i className="fas fa-check-circle"></i>
                  {isPremium ? "Premium" : "Verified"}
                </span>
              )}
            </div>

            {user.name && user.companyName && user.name !== user.companyName && (
              <div className="profile-contact-person">
                <i className="fas fa-user"></i>
                {user.name}
              </div>
            )}

            <div className="profile-meta">
              <span className="meta-item">
                <CountryFlag countryCode={user.countryCode} size="16px" />
                <span>{user.country || "Location not specified"}</span>
              </span>

              {user.businessType && (
                <>
                  <span className="meta-divider"></span>
                  <span className="meta-item">
                    <i className="fas fa-briefcase"></i>
                    <span>{user.businessType}</span>
                  </span>
                </>
              )}

              {user.employeeCount && (
                <>
                  <span className="meta-divider"></span>
                  <span className="meta-item">
                    <i className="fas fa-users"></i>
                    <span>{user.employeeCount} employees</span>
                  </span>
                </>
              )}

              <span className="meta-divider"></span>
              <span className="meta-item">
                <i className="fas fa-calendar-alt"></i>
                <span>Member since {joinYear}</span>
              </span>
            </div>

            <div className="profile-role-row">
              <span className={`role-badge ${isSupplier ? "supplier" : "buyer"}`}>
                <i
                  className={`fas ${isSupplier ? "fa-tractor" : "fa-store"}`}
                ></i>
                {roleLabel}
              </span>

              <span className="plan-badge">
                <i className="fas fa-crown"></i>
                {user.plan || "FREE"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-box">
              <div className="stat-value">{productCount}</div>
              <div className="stat-label">
                <i className="fas fa-box"></i> Products
              </div>
            </div>
            {galleryCount > 0 && (
              <>
                <div className="stat-divider"></div>
                <div className="stat-box">
                  <div className="stat-value">{galleryCount}</div>
                  <div className="stat-label">
                    <i className="fas fa-images"></i> Gallery
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-header-wrapper {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        }

        /* ===== Cover ===== */
        .profile-cover {
          width: 100%;
          height: 200px;
          overflow: hidden;
          position: relative;
        }

        .profile-cover.has-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .profile-cover.default {
          background: linear-gradient(
            135deg,
            #e8f7f1 0%,
            #d1ede0 50%,
            #eaf7f1 100%
          );
        }

        .cover-default {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-size: 64px;
          color: rgba(19, 121, 91, 0.2);
        }

        /* ===== Info Row ===== */
        .profile-info-row {
          padding: 0 28px 24px;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-top: -50px;
          position: relative;
          flex-wrap: wrap;
        }

        /* ===== Avatar ===== */
        .profile-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          overflow: hidden;
          background: white;
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

        .avatar-initials {
          color: white;
          font-size: 34px;
          font-weight: 800;
          font-family: "Manrope", sans-serif;
          line-height: 1;
        }

        /* ===== Details ===== */
        .profile-details {
          flex: 1;
          min-width: 220px;
          padding-top: 54px;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .profile-name {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }

        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          background: #eaf7f1;
          color: #0b5b43;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .verified-badge.premium {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .verified-badge i {
          font-size: 10px;
        }

        .profile-contact-person {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .profile-contact-person i {
          font-size: 11px;
        }

        .profile-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .profile-meta .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .profile-meta .meta-item i {
          color: #13795b;
          font-size: 11px;
        }

        .meta-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #cbd5d1;
        }

        .profile-role-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .role-badge,
        .plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .role-badge.supplier {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .role-badge.buyer {
          background: #eef0ff;
          color: #4f46e5;
        }

        .role-badge i,
        .plan-badge i {
          font-size: 10px;
        }

        .plan-badge {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        /* ===== Stats ===== */
        .profile-stats {
          display: flex;
          align-items: center;
          gap: 0;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          border-radius: 14px;
          padding: 12px 20px;
          margin-top: 54px;
          flex-shrink: 0;
        }

        .stat-box {
          text-align: center;
          padding: 0 20px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          line-height: 1.1;
        }

        .stat-label {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-top: 4px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .stat-label i {
          font-size: 10px;
        }

        .stat-divider {
          width: 1px;
          height: 36px;
          background: #e2e8f0;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 900px) {
          .profile-info-row {
            padding: 0 20px 20px;
            margin-top: -40px;
            gap: 16px;
          }

          .profile-avatar {
            width: 88px;
            height: 88px;
          }

          .avatar-initials {
            font-size: 26px;
          }

          .profile-details {
            padding-top: 44px;
          }

          .profile-name {
            font-size: 20px;
          }

          .profile-stats {
            margin-top: 20px;
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 600px) {
          .profile-cover {
            height: 140px;
          }

          .cover-default {
            font-size: 44px;
          }

          .profile-info-row {
            padding: 0 16px 16px;
            margin-top: -32px;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }

          .profile-avatar {
            width: 76px;
            height: 76px;
            border-width: 3px;
          }

          .avatar-initials {
            font-size: 22px;
          }

          .profile-details {
            padding-top: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .profile-name-row {
            justify-content: center;
          }

          .profile-name {
            font-size: 18px;
          }

          .profile-meta {
            justify-content: center;
            font-size: 12px;
          }

          .profile-role-row {
            justify-content: center;
          }

          .profile-stats {
            margin-top: 8px;
            padding: 10px 16px;
          }

          .stat-box {
            padding: 0 14px;
          }

          .stat-value {
            font-size: 18px;
          }

          .stat-label {
            font-size: 9.5px;
          }
        }
      `}</style>
    </>
  );
}