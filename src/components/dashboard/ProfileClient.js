// src/components/dashboard/ProfileClient.js
"use client";

import Link from "next/link";
import DOMPurify from "dompurify";
import { useMemo, useState } from "react";

export default function ProfileClient({ user }) {
    const [lightboxImage, setLightboxImage] = useState(null);

    // ===== Derived =====
    const displayName = user.companyName || user.name || "User";
    const initials = (user.name || user.email || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const isSupplier = user.role === "SUPPLIER";
    const isVerified = user.plan === "GOLD" || user.plan === "SILVER";
    const isPremium = user.plan === "GOLD";
    const avatarUrl = user.logo || user.image;

    const joinYear = new Date(user.createdAt).getFullYear();
    const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
    });

    const publicUrl =
        user.profileNumber && user.slug
            ? `/profiles/${user.profileNumber}/${user.slug}`
            : null;

    // ===== Sanitized Bio =====
    const sanitizedBio = useMemo(() => {
        if (typeof window === "undefined") return "";
        return DOMPurify.sanitize(user.bio || "");
    }, [user.bio]);

    // ===== Info items =====
    const contactItems = [
        { label: "Personal Email", value: user.email, icon: "fa-envelope" },
        user.companyEmail && {
            label: "Company Email",
            value: user.companyEmail,
            icon: "fa-at",
        },
        user.phone && { label: "Phone", value: user.phone, icon: "fa-phone" },
        user.website && {
            label: "Website",
            value: user.website.replace(/^https?:\/\//, ""),
            href: user.website,
            icon: "fa-globe",
        },
    ].filter(Boolean);

    const businessItems = [
        user.companyName && {
            label: "Company Name",
            value: user.companyName,
            icon: "fa-building",
        },
        user.businessType && {
            label: "Business Type",
            value: user.businessType,
            icon: "fa-briefcase",
        },
        user.employeeCount && {
            label: "Team Size",
            value: user.employeeCount,
            icon: "fa-users",
        },
        user.primaryCategory && {
            label: "Primary Category",
            value: user.primaryCategory,
            icon: "fa-tag",
        },
        user.primarySubCategory && {
            label: "Sub-Category",
            value: user.primarySubCategory,
            icon: "fa-tags",
        },
    ].filter(Boolean);

    const locationItems = [
        user.country && {
            label: "Country",
            value: user.country,
            icon: "fa-flag",
            flag: user.countryCode,
        },
        user.city && { label: "City", value: user.city, icon: "fa-city" },
        user.address && {
            label: "Address",
            value: user.address,
            icon: "fa-map-marker-alt",
        },
        user.postalCode && {
            label: "Postal Code",
            value: user.postalCode,
            icon: "fa-mail-bulk",
        },
    ].filter(Boolean);

    // ===== Social links =====
    const socialEntries = Object.entries(user.socialLinks || {}).filter(
        ([, v]) => typeof v === "string" && v.trim().length > 0
    );

    const socialIcons = {
        website: "fa-globe",
        twitter: "fa-twitter",
        linkedin: "fa-linkedin-in",
        instagram: "fa-instagram",
        facebook: "fa-facebook-f",
        youtube: "fa-youtube",
        whatsapp: "fa-whatsapp",
        telegram: "fa-telegram-plane",
        github: "fa-github",
        tiktok: "fa-tiktok",
    };

    return (
        <>
            <div className="pp-page">
                {/* ============================================================
           Page Header
           ============================================================ */}
                <div className="pp-header">
                    <div className="pp-header-left">
                        <h1>
                            <i className="fas fa-building"></i>
                            Company Profile
                        </h1>
                        <p>This is how your profile appears to other users</p>
                    </div>

                    <div className="pp-header-actions">
                        {publicUrl && (
                            <Link
                                href={publicUrl}
                                target="_blank"
                                className="pp-btn pp-btn-ghost"
                            >
                                <i className="fas fa-external-link-alt"></i>
                                <span>View Public</span>
                            </Link>
                        )}
                        <Link href="/dashboard/edit-profile" className="pp-btn pp-btn-primary">
                            <i className="fas fa-pen"></i>
                            <span>Edit Profile</span>
                        </Link>
                    </div>
                </div>

                {/* ============================================================
           Hero Card
           ============================================================ */}
                <div className="pp-hero">
                    {/* Cover */}
                    <div
                        className={`pp-cover ${user.coverImage ? "has-image" : "default"}`}
                    >
                        {user.coverImage ? (
                            <img src={user.coverImage} alt={displayName} />
                        ) : (
                            <div className="pp-cover-placeholder">
                                <i
                                    className={
                                        isSupplier ? "fas fa-store" : "fas fa-shopping-bag"
                                    }
                                ></i>
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="pp-hero-body">
                        <div className="pp-avatar-wrap">
                            <div
                                className={`pp-avatar ${avatarUrl ? "has-image" : isSupplier ? "supplier" : "buyer"
                                    }`}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={displayName} />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                        </div>

                        <div className="pp-hero-info">
                            <div className="pp-name-row">
                                <h2 className="pp-name">{displayName}</h2>
                                {isVerified && (
                                    <span
                                        className={`pp-verified ${isPremium ? "premium" : ""
                                            }`}
                                    >
                                        <i className="fas fa-check-circle"></i>
                                        {isPremium ? "Premium" : "Verified"}
                                    </span>
                                )}
                            </div>

                            {user.name && user.companyName && user.name !== user.companyName && (
                                <div className="pp-contact-person">
                                    <i className="fas fa-user"></i>
                                    {user.name}
                                </div>
                            )}

                            <div className="pp-meta">
                                {user.country && (
                                    <span className="pp-meta-item">
                                        {user.countryCode && (
                                            <span
                                                className={`fi fi-${user.countryCode.toLowerCase()}`}
                                            ></span>
                                        )}
                                        <span>{user.country}</span>
                                    </span>
                                )}

                                {user.businessType && (
                                    <>
                                        <span className="pp-meta-divider" />
                                        <span className="pp-meta-item">
                                            <i className="fas fa-briefcase"></i>
                                            <span>{user.businessType}</span>
                                        </span>
                                    </>
                                )}

                                <span className="pp-meta-divider" />
                                <span className="pp-meta-item">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>Member since {memberSince}</span>
                                </span>
                            </div>

                            <div className="pp-badges">
                                <span
                                    className={`pp-badge ${isSupplier ? "supplier" : "buyer"
                                        }`}
                                >
                                    <i
                                        className={`fas ${isSupplier ? "fa-tractor" : "fa-store"
                                            }`}
                                    ></i>
                                    {isSupplier ? "Supplier" : "Buyer"}
                                </span>
                                <span className="pp-badge plan">
                                    <i className="fas fa-crown"></i>
                                    {user.plan || "FREE"} Plan
                                </span>
                                {user.profileNumber && (
                                    <span className="pp-badge id" data-3cx-ignore="true">
                                        <i className="fas fa-hashtag"></i>
                                        <span
                                            className="pp-safe-text"
                                            data-text={String(user.profileNumber)}
                                            suppressHydrationWarning
                                        />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================
           Info Grid
           ============================================================ */}
                <div className="pp-info-grid">
                    <InfoCard
                        title="Contact Information"
                        icon="fa-address-book"
                        items={contactItems}
                    />
                    <InfoCard
                        title="Business Information"
                        icon="fa-briefcase"
                        items={businessItems}
                    />
                    <InfoCard
                        title="Location & Address"
                        icon="fa-map-marked-alt"
                        items={locationItems}
                    />
                </div>

                {/* ============================================================
           About / Bio
           ============================================================ */}
                {sanitizedBio ? (
                    <div className="pp-card pp-about">
                        <div className="pp-card-head">
                            <h3 className="pp-card-title">
                                <i className="fas fa-align-left"></i>
                                About {user.companyName || user.name}
                            </h3>
                        </div>
                        <div
                            className="pp-bio-content"
                            dangerouslySetInnerHTML={{ __html: sanitizedBio }}
                        />
                    </div>
                ) : (
                    <div className="pp-card pp-about-empty">
                        <i className="fas fa-align-left"></i>
                        <h3>No description yet</h3>
                        <p>
                            Add a company bio to tell buyers and suppliers about your
                            business.
                        </p>
                        <Link
                            href="/dashboard/edit-profile"
                            className="pp-btn pp-btn-primary"
                        >
                            <i className="fas fa-pen"></i>
                            <span>Add Bio</span>
                        </Link>
                    </div>
                )}

                {/* ============================================================
           Gallery
           ============================================================ */}
                {user.galleryImages.length > 0 && (
                    <div className="pp-card">
                        <div className="pp-card-head">
                            <h3 className="pp-card-title">
                                <i className="fas fa-images"></i>
                                Gallery
                            </h3>
                            <span className="pp-card-sub">
                                {user.galleryImages.length} image
                                {user.galleryImages.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="pp-gallery-grid">
                            {user.galleryImages.map((img, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="pp-gallery-item"
                                    onClick={() => setLightboxImage(img)}
                                    aria-label={`View image ${i + 1}`}
                                >
                                    <img src={img} alt={`Gallery ${i + 1}`} loading="lazy" />
                                    <div className="pp-gallery-overlay">
                                        <i className="fas fa-expand"></i>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ============================================================
           Social Links
           ============================================================ */}
                {socialEntries.length > 0 && (
                    <div className="pp-card">
                        <div className="pp-card-head">
                            <h3 className="pp-card-title">
                                <i className="fas fa-share-alt"></i>
                                Connect
                            </h3>
                        </div>
                        <div className="pp-social-grid">
                            {socialEntries.map(([key, url]) => (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pp-social-item"
                                >
                                    <span className="pp-social-icon">
                                        <i
                                            className={`fab ${socialIcons[key] || "fa-link"}`}
                                        ></i>
                                    </span>
                                    <span className="pp-social-label">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </span>
                                    <i className="fas fa-arrow-right pp-social-arrow"></i>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
         Lightbox
         ============================================================ */}
            {lightboxImage && (
                <div
                    className="pp-lightbox"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        type="button"
                        className="pp-lightbox-close"
                        onClick={() => setLightboxImage(null)}
                        aria-label="Close"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Gallery"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* ============================================================
         Styles
         ============================================================ */}
            <style jsx>{`
        .pp-page {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ============================================================
           Page Header
           ============================================================ */
        .pp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pp-header-left {
          min-width: 0;
        }

        .pp-header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pp-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .pp-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .pp-header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        :global(.pp-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
          border: 1px solid transparent;
          cursor: pointer;
        }

        :global(.pp-btn i) {
          font-size: 12px;
        }

        :global(.pp-btn-primary) {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
        }

        :global(.pp-btn-primary:hover) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
          color: white;
        }

        :global(.pp-btn-ghost) {
          background: white;
          color: #334155;
          border-color: #e8edf0;
        }

        :global(.pp-btn-ghost:hover) {
          border-color: #13795b;
          color: #13795b;
          background: #f0faf6;
        }

        /* ============================================================
           Hero Card
           ============================================================ */
        .pp-hero {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        }

        .pp-cover {
          width: 100%;
          height: 180px;
          overflow: hidden;
          position: relative;
        }

        .pp-cover.has-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pp-cover.default {
          background: linear-gradient(
            135deg,
            #e8f7f1 0%,
            #d1ede0 50%,
            #eaf7f1 100%
          );
        }

        .pp-cover-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-size: 60px;
          color: rgba(19, 121, 91, 0.2);
        }

        .pp-hero-body {
          padding: 0 24px 24px;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-top: -48px;
          position: relative;
          flex-wrap: wrap;
        }

        /* Avatar */
        .pp-avatar-wrap {
          flex-shrink: 0;
        }

        .pp-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
          display: grid;
          place-items: center;
          overflow: hidden;
          background: white;
        }

        .pp-avatar.has-image {
          background: white;
        }

        .pp-avatar.supplier {
          background: linear-gradient(135deg, #13795b, #0d9469);
        }

        .pp-avatar.buyer {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
        }

        .pp-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pp-avatar span {
          color: white;
          font-size: 34px;
          font-weight: 800;
          font-family: "Manrope", sans-serif;
          line-height: 1;
        }

        /* Hero info */
        .pp-hero-info {
          flex: 1;
          min-width: 220px;
          padding-top: 52px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pp-name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pp-name {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          line-height: 1.25;
          word-wrap: break-word;
        }

        .pp-verified {
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
          white-space: nowrap;
        }

        .pp-verified.premium {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .pp-verified i {
          font-size: 10px;
        }

        .pp-contact-person {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .pp-contact-person i {
          font-size: 11px;
          color: #13795b;
        }

        .pp-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }

        .pp-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .pp-meta-item i {
          color: #13795b;
          font-size: 11px;
        }

        .pp-meta-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #cbd5d1;
          flex-shrink: 0;
        }

        .pp-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .pp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .pp-badge i {
          font-size: 10px;
        }

        .pp-badge.supplier {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .pp-badge.buyer {
          background: #eef0ff;
          color: #4f46e5;
        }

        .pp-badge.plan {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .pp-badge.id {
          background: #f1f5f7;
          color: #475569;
        }

        /* ============================================================
           Info Grid
           ============================================================ */
        .pp-info-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        /* ============================================================
           Card
           ============================================================ */
        .pp-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 0;
        }

        .pp-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f5f7;
          flex-wrap: wrap;
        }

        .pp-card-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pp-card-title i {
          color: #13795b;
          background: #eaf7f1;
          padding: 6px;
          border-radius: 8px;
          font-size: 12px;
        }

        .pp-card-sub {
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 600;
        }

        /* ============================================================
           Bio
           ============================================================ */
        .pp-bio-content {
          font-size: 14px;
          line-height: 1.8;
          color: #334155;
          word-wrap: break-word;
        }

        .pp-bio-content :global(p) {
          margin: 0 0 12px 0;
        }

        .pp-bio-content :global(p:last-child) {
          margin-bottom: 0;
        }

        .pp-bio-content :global(ul),
        .pp-bio-content :global(ol) {
          padding-left: 22px;
          margin: 8px 0;
        }

        .pp-bio-content :global(h1),
        .pp-bio-content :global(h2),
        .pp-bio-content :global(h3) {
          margin: 14px 0 8px;
          font-family: "Manrope", sans-serif;
          color: #0b1f18;
        }

        .pp-bio-content :global(a) {
          color: #13795b;
          text-decoration: none;
        }

        .pp-bio-content :global(a:hover) {
          text-decoration: underline;
        }

        .pp-about-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          gap: 10px;
        }

        .pp-about-empty > i {
          font-size: 40px;
          color: #cbd5d1;
          margin-bottom: 4px;
        }

        .pp-about-empty h3 {
          font-size: 15px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .pp-about-empty p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 8px 0;
          max-width: 360px;
          line-height: 1.55;
        }

        /* ============================================================
           Gallery
           ============================================================ */
        .pp-gallery-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .pp-gallery-item {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          padding: 0;
          border: 1px solid #e8edf0;
          background: #f5f8f6;
          transition: all 0.25s ease;
        }

        .pp-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .pp-gallery-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: grid;
          place-items: center;
          color: white;
          font-size: 18px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .pp-gallery-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          border-color: #13795b;
        }

        .pp-gallery-item:hover img {
          transform: scale(1.08);
        }

        .pp-gallery-item:hover .pp-gallery-overlay {
          opacity: 1;
        }

        /* ============================================================
           Social Grid
           ============================================================ */
        .pp-social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }

        .pp-social-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          border-radius: 12px;
          text-decoration: none;
          color: #334155;
          transition: all 0.2s ease;
          min-width: 0;
        }

        .pp-social-item:hover {
          background: #f0faf6;
          border-color: #13795b;
          color: #13795b;
          transform: translateY(-2px);
        }

        .pp-social-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: white;
          display: grid;
          place-items: center;
          color: #13795b;
          font-size: 14px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(19, 121, 91, 0.08);
        }

        .pp-social-label {
          flex: 1;
          font-size: 13px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .pp-social-arrow {
          font-size: 11px;
          color: #94a3b8;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .pp-social-item:hover .pp-social-arrow {
          transform: translateX(3px);
          color: #13795b;
        }

        /* ============================================================
           Lightbox
           ============================================================ */
        .pp-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: ppFade 0.25s ease;
        }

        @keyframes ppFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .pp-lightbox img {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .pp-lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 18px;
          display: grid;
          place-items: center;
          transition: all 0.2s ease;
        }

        .pp-lightbox-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 1100px) {
          .pp-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .pp-header-left h1 {
            font-size: 20px;
          }

          .pp-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          .pp-cover {
            height: 140px;
          }

          .pp-cover-placeholder {
            font-size: 44px;
          }

          .pp-hero-body {
            padding: 0 20px 20px;
            margin-top: -40px;
          }

          .pp-avatar {
            width: 88px;
            height: 88px;
          }

          .pp-avatar span {
            font-size: 26px;
          }

          .pp-hero-info {
            padding-top: 44px;
          }

          .pp-name {
            font-size: 20px;
          }

          .pp-info-grid {
            grid-template-columns: 1fr;
          }

          .pp-gallery-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .pp-page {
            gap: 16px;
          }

          .pp-header-left h1 {
            font-size: 18px;
          }

          .pp-header-left p {
            font-size: 12.5px;
          }

          .pp-header-actions {
            width: 100%;
          }

          :global(.pp-btn) {
            flex: 1;
            justify-content: center;
            padding: 10px 14px;
            font-size: 12.5px;
          }

          .pp-cover {
            height: 120px;
          }

          .pp-hero-body {
            padding: 0 16px 18px;
            margin-top: -32px;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }

          .pp-avatar {
            width: 78px;
            height: 78px;
            border-width: 3px;
          }

          .pp-avatar span {
            font-size: 22px;
          }

          .pp-hero-info {
            padding-top: 0;
            width: 100%;
            align-items: center;
          }

          .pp-name-row {
            justify-content: center;
          }

          .pp-name {
            font-size: 18px;
          }

          .pp-meta {
            justify-content: center;
            font-size: 12px;
          }

          .pp-badges {
            justify-content: center;
          }

          .pp-card {
            padding: 18px;
          }

          .pp-card-title {
            font-size: 13.5px;
          }

          .pp-gallery-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }

          .pp-social-grid {
            grid-template-columns: 1fr;
          }

          .pp-bio-content {
            font-size: 13.5px;
            line-height: 1.7;
          }
        }

        @media (max-width: 400px) {
          .pp-gallery-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pp-badge {
            font-size: 10px;
            padding: 4px 10px;
          }
        }
      `}</style>
        </>
    );
}

// ============================================================
// InfoCard
// ============================================================
function InfoCard({ title, icon, items }) {
    if (!items || items.length === 0) return null;

    return (
        <>
            <div className="info-card">
                <div className="info-card-head">
                    <h3 className="info-card-title">
                        <i className={`fas ${icon}`}></i>
                        {title}
                    </h3>
                </div>

                <div className="info-card-list">
                    {items.map((item, i) => (
                        <div key={i} className="info-item">
                            <div className="info-item-icon">
                                {item.flag ? (
                                    <span
                                        className={`fi fi-${item.flag.toLowerCase()}`}
                                    ></span>
                                ) : (
                                    <i className={`fas ${item.icon}`}></i>
                                )}
                            </div>
                            <div className="info-item-content">
                                <div className="info-item-label">{item.label}</div>
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="info-item-value link"
                                    >
                                        {item.value}
                                    </a>
                                ) : (
                                    <div className="info-item-value">{item.value}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        .info-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 0;
        }

        .info-card-head {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f5f7;
        }

        .info-card-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .info-card-title i {
          color: #13795b;
          background: #eaf7f1;
          padding: 6px;
          border-radius: 8px;
          font-size: 12px;
        }

        .info-card-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .info-item-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: #13795b;
          font-size: 12px;
          overflow: hidden;
        }

        .info-item-icon .fi {
          width: 18px;
          height: 14px;
          border-radius: 3px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .info-item-content {
          flex: 1;
          min-width: 0;
          padding-top: 2px;
        }

        .info-item-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
        }

        .info-item-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #0b1f18;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .info-item-value.link {
          color: #13795b;
          text-decoration: none;
          word-break: break-all;
        }

        .info-item-value.link:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .info-card {
            padding: 18px;
          }

          .info-card-title {
            font-size: 13.5px;
          }

          .info-item-value {
            font-size: 13px;
          }
        }
      `}</style>
        </>
    );
}