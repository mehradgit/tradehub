// src/app/dashboard/edit-profile/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import CountrySelect from "@/components/ui/CountrySelect";
import CategorySelect from "@/components/ui/CategorySelect";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { getCountryName } from "@/lib/countries";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  // ===== Form State =====
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    country: "",
    countryCode: "",
    businessType: "",
    phone: "",
    bio: "",
    address: "",
    city: "",
    postalCode: "",
    website: "",
    companyEmail: "",
    employeeCount: "",
    role: "BUYER",
    primaryCategory: "",
    primarySubCategory: "",
    logo: null,
    coverImage: null,
    galleryImages: [],
  });

  const [existingLogo, setExistingLogo] = useState(null);
  const [existingCover, setExistingCover] = useState(null);

  // ===== Gallery limit from user's plan =====
  // null = هنوز لود نشده | -1 = نامحدود | n = عدد
  const [galleryLimit, setGalleryLimit] = useState(null);

  const [uploadProgress, setUploadProgress] = useState({
    logo: 0,
    coverImage: 0,
    gallery: 0,
  });
  const [isUploading, setIsUploading] = useState({
    logo: false,
    coverImage: false,
    gallery: false,
  });

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // ===== Fetch Profile =====
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const user = await res.json();

        setFormData({
          name: user.name || "",
          companyName: user.companyName || "",
          country: user.country || "",
          countryCode: user.countryCode || "",
          businessType: user.businessType || "",
          phone: user.phone || "",
          bio: user.bio || "",
          address: user.address || "",
          city: user.city || "",
          postalCode: user.postalCode || "",
          website: user.website || "",
          companyEmail: user.companyEmail || "",
          employeeCount: user.employeeCount || "",
          role: user.role || "BUYER",
          primaryCategory: user.primaryCategory || "",
          primarySubCategory: user.primarySubCategory || "",
          logo: null,
          coverImage: null,
          galleryImages: user.galleryImages || [],
        });

        setExistingLogo(user.logo || user.image || null);
        setExistingCover(user.coverImage || null);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setFetching(false);
      }
    };

    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetchUserProfile();
  }, [session, status, router]);

  // ===== Fetch gallery limit from user's plan =====
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user/subscription")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const limit = data?.plan?.maxProfileImages;
        if (typeof limit === "number") {
          setGalleryLimit(limit);
        }
      })
      .catch(() => {
        // اگه خطا داد، محدودیت رو نامحدود فرض کن (سرور موقع Save چک می‌کنه)
        setGalleryLimit(-1);
      });
  }, [status]);

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleFileChange = async (e, fieldName) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // ==================== SINGLE FILE (logo / cover) ====================
    if (fieldName !== "galleryImages") {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        toast.warning("Please select a valid image file.");
        e.target.value = "";
        return;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 3) {
        toast.error(`Image size (${sizeMB.toFixed(1)}MB) exceeds 3MB limit.`);
        e.target.value = "";
        return;
      }

      // ✅ تعیین purpose بر اساس fieldName
      const purpose = fieldName === "logo" ? "logo" : "cover";

      try {
        setIsUploading((prev) => ({ ...prev, [fieldName]: true }));
        setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));

        const result = await uploadFileWithProgress(
          file,
          "profiles",
          (percent) =>
            setUploadProgress((prev) => ({ ...prev, [fieldName]: percent })),
          purpose                                  // ✅ جدید
        );

        setFormData((prev) => ({ ...prev, [fieldName]: result.path }));
        toast.success("Image uploaded successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to upload image.");
      } finally {
        setIsUploading((prev) => ({ ...prev, [fieldName]: false }));
        setTimeout(() => {
          setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));
        }, 1000);
      }
      return;
    }

    // ==================== GALLERY (multiple) ====================
    setIsUploading((prev) => ({ ...prev, gallery: true }));
    setUploadProgress((prev) => ({ ...prev, gallery: 0 }));

    try {
      const uploadedPaths = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.warning(`Skipping ${file.name}: not an image.`);
          continue;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 3) {
          toast.warning(`Skipping ${file.name}: size exceeds 3MB.`);
          continue;
        }
        const result = await uploadFileWithProgress(
          file,
          "profiles",
          (percent) =>
            setUploadProgress((prev) => ({ ...prev, gallery: percent })),
          "gallery"                                 // ✅ جدید
        );
        uploadedPaths.push(result.path);
      }

      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...uploadedPaths],
      }));

      toast.success(`${uploadedPaths.length} images uploaded!`);
    } catch (err) {
      toast.error(err.message || "Failed to upload images.");
    } finally {
      setIsUploading((prev) => ({ ...prev, gallery: false }));
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, gallery: 0 }));
      }, 1000);
    }
  };

  const removeImage = (fieldName, index = null, isExisting = false) => {
    if (fieldName === "galleryImages" && index !== null) {
      setFormData((prev) => ({
        ...prev,
        galleryImages: prev.galleryImages.filter((_, i) => i !== index),
      }));
      return;
    }

    if (isExisting) {
      if (fieldName === "logo") setExistingLogo(null);
      else if (fieldName === "coverImage") setExistingCover(null);
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: null }));
      if (fieldName === "logo" && logoInputRef.current)
        logoInputRef.current.value = "";
      if (fieldName === "coverImage" && coverInputRef.current)
        coverInputRef.current.value = "";
    }
  };

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        companyName: formData.companyName,
        countryCode: formData.countryCode,
        country: formData.country,
        businessType: formData.businessType || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        address: formData.address || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        website: formData.website || null,
        companyEmail: formData.companyEmail || null,
        employeeCount: formData.employeeCount || null,
        logo: formData.logo || existingLogo,
        coverImage: formData.coverImage || existingCover,
        primaryCategory: formData.primaryCategory || null,
        primarySubCategory: formData.primarySubCategory || null,
        galleryImages: formData.galleryImages,
      };

      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      await update();
      setExistingLogo(payload.logo);
      setExistingCover(payload.coverImage);
      setFormData((prev) => ({ ...prev, logo: null, coverImage: null }));

      toast.success("Profile updated successfully!");
      router.push("/dashboard/profile");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Loading =====
  if (status === "loading" || fetching) {
    return (
      <div className="ep-loading">
        <div className="ep-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!session) return null;

  const currentCover = formData.coverImage || existingCover;
  const currentLogo = formData.logo || existingLogo;

  // ===== Gallery limit calculations =====
  const currentGalleryCount = formData.galleryImages.length;
  const isUnlimited = galleryLimit === -1;
  const isLimitKnown = galleryLimit !== null && galleryLimit !== -1;
  const remainingSlots = isLimitKnown
    ? Math.max(0, galleryLimit - currentGalleryCount)
    : Infinity;
  const isGalleryFull = isLimitKnown && currentGalleryCount >= galleryLimit;

  return (
    <>
      <div className="ep-page">
        {/* ===== Header ===== */}
        <div className="ep-header">
          <div className="ep-header-left">
            <h1>
              <i className="fas fa-pen"></i>
              Edit Profile
            </h1>
            <p>Update your personal and business information</p>
          </div>
        </div>

        {/* ===== Error ===== */}
        {error && (
          <div className="ep-alert">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ep-form">
          {/* ============================================================
             SECTION 1: Cover & Logo Preview
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-image"></i>
                Cover & Logo
              </h3>
              <p className="ep-card-sub">
                These will be shown on your public profile
              </p>
            </div>

            <div className="ep-hero-preview">
              {/* Cover */}
              <div
                className={`ep-cover ${currentCover ? "has-image" : "placeholder"
                  }`}
                onClick={() => coverInputRef.current.click()}
              >
                {currentCover ? (
                  <img src={currentCover} alt="Cover" />
                ) : (
                  <div className="ep-cover-placeholder">
                    <i className="fas fa-image"></i>
                    <span>Click to upload cover</span>
                  </div>
                )}
                <div className="ep-cover-overlay">
                  <i className="fas fa-camera"></i>
                  <span>Change Cover</span>
                </div>
                {isUploading.coverImage && (
                  <div className="ep-upload-spinner">
                    <div className="ep-spinner-small" />
                  </div>
                )}
              </div>

              {/* Logo */}
              <div
                className={`ep-avatar ${currentLogo ? "has-image" : "placeholder"}`}
                onClick={() => logoInputRef.current.click()}
              >
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo" />
                ) : (
                  <div className="ep-avatar-placeholder">
                    <i className="fas fa-camera"></i>
                  </div>
                )}
                <div className="ep-avatar-overlay">
                  <i className="fas fa-camera"></i>
                </div>
                {isUploading.logo && (
                  <div className="ep-upload-spinner">
                    <div className="ep-spinner-small" />
                  </div>
                )}
              </div>
            </div>

            {/* Progress & reset */}
            <div className="ep-hero-actions">
              <UploadProgress
                progress={uploadProgress.coverImage}
                label="Uploading cover..."
              />
              <UploadProgress
                progress={uploadProgress.logo}
                label="Uploading logo..."
              />
              {(currentCover || currentLogo) && (
                <button
                  type="button"
                  className="ep-btn ep-btn-ghost ep-btn-sm"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      logo: null,
                      coverImage: null,
                    }));
                    setExistingLogo(null);
                    setExistingCover(null);
                    if (logoInputRef.current)
                      logoInputRef.current.value = "";
                    if (coverInputRef.current)
                      coverInputRef.current.value = "";
                  }}
                >
                  <i className="fas fa-trash"></i>
                  Reset Images
                </button>
              )}
            </div>

            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, "coverImage")}
            />
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, "logo")}
            />
          </section>

          {/* ============================================================
             SECTION 2: Basic Information
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-user"></i>
                Basic Information
              </h3>
            </div>

            <div className="ep-grid-2">
              <Field
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                icon="fa-user"
              />
              <Field
                label="Personal Email"
                value={session.user.email}
                disabled
                icon="fa-envelope"
                hint="Cannot be changed"
              />
            </div>
          </section>

          {/* ============================================================
             SECTION 3: Company Information
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-building"></i>
                Company Information
              </h3>
            </div>

            <div className="ep-grid-2">
              <Field
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Anderson Foods LLC"
                required
                icon="fa-building"
              />
              <Field
                label="Business Type"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                type="select"
                icon="fa-briefcase"
                options={[
                  "Manufacturer",
                  "Distributor",
                  "Wholesaler",
                  "Retailer",
                  "Exporter",
                  "Importer",
                  "Processor",
                ]}
              />
              <Field
                label="Number of Employees"
                name="employeeCount"
                value={formData.employeeCount}
                onChange={handleChange}
                type="select"
                icon="fa-users"
                options={[
                  "1-10",
                  "11-50",
                  "51-200",
                  "201-500",
                  "501-1000",
                  "1000+",
                ]}
              />
              <div className="ep-field">
                <label className="ep-label">
                  <i className="fas fa-globe"></i>
                  Country
                </label>
                <CountrySelect
                  value={formData.countryCode}
                  onChange={(code) => {
                    const name = getCountryName(code);
                    setFormData((prev) => ({
                      ...prev,
                      countryCode: code,
                      country: name,
                    }));
                  }}
                  placeholder="Select country"
                />
              </div>
            </div>

            <div className="ep-divider" />

            <div className="ep-field">
              <label className="ep-label">
                <i className="fas fa-tags"></i>
                Primary Category
              </label>
              <CategorySelect
                categoryValue={formData.primaryCategory}
                subCategoryValue={formData.primarySubCategory}
                onCategoryChange={(cat) => {
                  setFormData((prev) => ({
                    ...prev,
                    primaryCategory: cat,
                    primarySubCategory: "",
                  }));
                }}
                onSubCategoryChange={(sub) => {
                  setFormData((prev) => ({ ...prev, primarySubCategory: sub }));
                }}
                categoryRequired={false}
              />
            </div>
          </section>

          {/* ============================================================
             SECTION 4: Contact Information
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-address-book"></i>
                Contact Information
              </h3>
            </div>

            <div className="ep-grid-2">
              <Field
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                type="tel"
                icon="fa-phone"
              />
              <Field
                label="Company Email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleChange}
                placeholder="info@company.com"
                type="email"
                icon="fa-at"
              />
              <div className="ep-field ep-col-full">
                <label className="ep-label">
                  <i className="fas fa-globe"></i>
                  Website
                </label>
                <input
                  type="url"
                  className="ep-input"
                  name="website"
                  placeholder="https://www.example.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* ============================================================
             SECTION 5: Address
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-map-marker-alt"></i>
                Address
              </h3>
            </div>

            <div className="ep-grid-2">
              <Field
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St"
                icon="fa-home"
              />
              <Field
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Tehran"
                icon="fa-city"
              />
              <Field
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="1234567890"
                icon="fa-mail-bulk"
              />
            </div>
          </section>

          {/* ============================================================
             SECTION 6: Bio
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-align-left"></i>
                Company Bio / Description
              </h3>
              <p className="ep-card-sub">
                Tell buyers and suppliers about your business
              </p>
            </div>

            <RichTextEditor
              value={formData.bio}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, bio: value }))
              }
              placeholder="Tell us about your company..."
              height={220}
            />
          </section>

          {/* ============================================================
             SECTION 7: Gallery
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-images"></i>
                Gallery Images
                {isUnlimited && (
                  <span className="ep-count-badge">Unlimited</span>
                )}
                {isLimitKnown && (
                  <span
                    className={`ep-count-badge ${isGalleryFull ? "is-full" : ""}`}
                  >
                    {currentGalleryCount}/{galleryLimit}
                  </span>
                )}
              </h3>
              <p className="ep-card-sub">
                Showcase your facilities, products, and team
              </p>
            </div>

            {/* ===== Limit Info ===== */}
            {isLimitKnown && (
              <div
                className={`ep-limit-info ${isGalleryFull ? "warning" : ""}`}
              >
                <i
                  className={`fas ${isGalleryFull
                      ? "fa-exclamation-triangle"
                      : "fa-info-circle"
                    }`}
                ></i>
                <span>
                  {isGalleryFull ? (
                    <>
                      You&apos;ve reached the maximum of{" "}
                      <strong>{galleryLimit}</strong> gallery image
                      {galleryLimit !== 1 ? "s" : ""} on your plan. Remove an
                      image or{" "}
                      <Link
                        href="/plans"
                        style={{ color: "inherit", textDecoration: "underline" }}
                      >
                        upgrade your plan
                      </Link>{" "}
                      to add more.
                    </>
                  ) : (
                    <>
                      You can add <strong>{remainingSlots}</strong> more image
                      {remainingSlots !== 1 ? "s" : ""} (
                      {currentGalleryCount} of {galleryLimit} used).
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="ep-gallery-grid">
              {formData.galleryImages.map((img, index) => (
                <div key={index} className="ep-gallery-item">
                  <img src={img} alt={`Gallery ${index + 1}`} />
                  <button
                    type="button"
                    className="ep-gallery-remove"
                    onClick={() => removeImage("galleryImages", index)}
                    aria-label="Remove image"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}

              {/* Add button */}
              <button
                type="button"
                className={`ep-gallery-add ${isGalleryFull ? "is-full" : ""}`}
                onClick={() => galleryInputRef.current.click()}
                disabled={isUploading.gallery || isGalleryFull}
                title={
                  isGalleryFull
                    ? `Gallery limit reached (${galleryLimit} images)`
                    : "Add more images"
                }
              >
                {isUploading.gallery ? (
                  <div className="ep-spinner-small" />
                ) : isGalleryFull ? (
                  <>
                    <i className="fas fa-lock"></i>
                    <span>Limit Reached</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    <span>Add Images</span>
                  </>
                )}
              </button>
            </div>

            <UploadProgress
              progress={uploadProgress.gallery}
              label="Uploading gallery..."
            />

            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, "galleryImages")}
            />
          </section>

          {/* ============================================================
             Sticky Save Bar
             ============================================================ */}
          <div className="ep-save-bar">
            <div className="ep-save-info">
              <i className="fas fa-info-circle"></i>
              <span>Changes will be saved to your profile</span>
            </div>
            <div className="ep-save-actions">
              <Link href="/dashboard/profile" className="ep-btn ep-btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="ep-btn ep-btn-primary"
                disabled={
                  loading ||
                  isUploading.logo ||
                  isUploading.coverImage ||
                  isUploading.gallery
                }
              >
                {loading ? (
                  <>
                    <span className="ep-spinner-small" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .ep-page {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ============================================================
           Loading
           ============================================================ */
        .ep-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
          color: #64748b;
          font-size: 14px;
        }

        .ep-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e8edf0;
          border-top-color: #13795b;
          border-radius: 50%;
          animation: epSpin 0.8s linear infinite;
        }

        .ep-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: epSpin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes epSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ============================================================
           Header
           ============================================================ */
        .ep-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ep-header-left h1 {
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

        .ep-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .ep-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        /* ============================================================
           Alert
           ============================================================ */
        .ep-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #991b1b;
          font-size: 13.5px;
          font-weight: 600;
        }

        .ep-alert i {
          font-size: 16px;
          flex-shrink: 0;
        }

        /* ============================================================
           Form
           ============================================================ */
        .ep-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ============================================================
           Card
           ============================================================ */
        .ep-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ep-card-head {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f5f7;
        }

        .ep-card-title {
          font-size: 15px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ep-card-title i {
          color: #13795b;
          background: #eaf7f1;
          padding: 6px;
          border-radius: 8px;
          font-size: 12px;
        }

        .ep-card-sub {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0;
          padding-left: 36px;
        }

        .ep-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 8px;
          margin-left: auto;
          background: #eaf7f1;
          color: #0b5b43;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
        }

        .ep-count-badge.is-full {
          background: #fef2f2;
          color: #dc2626;
        }

        /* ============================================================
           Limit info message
           ============================================================ */
        .ep-limit-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: #eaf7f1;
          border: 1px solid #a7f3d0;
          border-radius: 10px;
          font-size: 12.5px;
          line-height: 1.55;
          color: #0b5b43;
          margin-top: -4px;
        }

        .ep-limit-info i {
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 13px;
        }

        .ep-limit-info strong {
          font-weight: 800;
          color: #0b1b18;
        }

        .ep-limit-info.warning {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .ep-limit-info.warning strong {
          color: #7f1d1d;
        }

        /* ============================================================
           Hero Preview (Cover + Logo)
           ============================================================ */
        .ep-hero-preview {
          position: relative;
          width: 100%;
          height: 180px;
          border-radius: 14px;
          overflow: visible;
        }

        .ep-cover {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          background: linear-gradient(
            135deg,
            #e8f7f1 0%,
            #d1ede0 50%,
            #eaf7f1 100%
          );
          transition: all 0.2s ease;
        }

        .ep-cover.has-image {
          background: #f5f8f6;
        }

        .ep-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ep-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(19, 121, 91, 0.5);
        }

        .ep-cover-placeholder i {
          font-size: 32px;
        }

        .ep-cover-placeholder span {
          font-size: 12.5px;
          font-weight: 700;
        }

        .ep-cover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: white;
          font-size: 12.5px;
          font-weight: 700;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .ep-cover-overlay i {
          font-size: 22px;
        }

        .ep-cover:hover .ep-cover-overlay {
          opacity: 1;
        }

        /* Avatar */
        .ep-avatar {
          position: absolute;
          bottom: -20px;
          left: 24px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 4px solid white;
          overflow: hidden;
          cursor: pointer;
          background: linear-gradient(135deg, #13795b, #0d9469);
          display: grid;
          place-items: center;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
          transition: all 0.2s ease;
          z-index: 2;
        }

        .ep-avatar.has-image {
          background: #f5f8f6;
        }

        .ep-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ep-avatar-placeholder {
          color: white;
          font-size: 26px;
        }

        .ep-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: grid;
          place-items: center;
          color: white;
          font-size: 20px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .ep-avatar:hover .ep-avatar-overlay {
          opacity: 1;
        }

        .ep-upload-spinner {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          display: grid;
          place-items: center;
          color: white;
          z-index: 3;
        }

        /* Hero actions */
        .ep-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        /* ============================================================
           Grid & Fields
           ============================================================ */
        .ep-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .ep-col-full {
          grid-column: 1 / -1;
        }

        :global(.ep-field) {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        :global(.ep-label) {
          font-size: 12.5px;
          font-weight: 700;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        :global(.ep-label i) {
          color: #13795b;
          font-size: 11px;
          width: 14px;
          text-align: center;
        }

        :global(.ep-input) {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e8edf0;
          border-radius: 12px;
          font-size: 13.5px;
          font-family: inherit;
          color: #0b1f18;
          background: white;
          transition: all 0.2s ease;
          outline: none;
          min-height: 44px;
        }

        :global(.ep-input:focus) {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }

        :global(.ep-input::placeholder) {
          color: #94a3b8;
        }

        :global(.ep-input:disabled) {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }

        :global(.ep-hint) {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .ep-divider {
          height: 1px;
          background: #f1f5f7;
          margin: 4px 0;
        }

        /* ============================================================
           Gallery
           ============================================================ */
        .ep-gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .ep-gallery-item {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e8edf0;
          background: #f5f8f6;
          transition: all 0.2s ease;
        }

        .ep-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ep-gallery-item:hover {
          border-color: #13795b;
          box-shadow: 0 8px 20px rgba(19, 121, 91, 0.12);
        }

        .ep-gallery-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.9);
          color: white;
          border: none;
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 11px;
          opacity: 0;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }

        .ep-gallery-item:hover .ep-gallery-remove {
          opacity: 1;
        }

        .ep-gallery-remove:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .ep-gallery-add {
          aspect-ratio: 1 / 1;
          border: 2px dashed #cbd5d1;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          transition: all 0.2s ease;
          padding: 0;
        }

        .ep-gallery-add:hover:not(:disabled) {
          border-color: #13795b;
          background: #f0faf6;
          color: #13795b;
        }

        .ep-gallery-add:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ep-gallery-add i {
          font-size: 22px;
        }

        /* ✅ Add button - full state */
        .ep-gallery-add.is-full {
          border-color: #fecaca;
          background: #fef2f2;
          color: #dc2626;
          cursor: not-allowed;
          opacity: 1;
        }

        .ep-gallery-add.is-full:hover {
          border-color: #fecaca;
          background: #fef2f2;
          color: #dc2626;
        }

        /* ============================================================
           Buttons
           ============================================================ */
        :global(.ep-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
          border: 1.5px solid transparent;
          cursor: pointer;
          min-height: 44px;
        }

        :global(.ep-btn:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }

        :global(.ep-btn-primary) {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
        }

        :global(.ep-btn-primary:hover:not(:disabled)) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        :global(.ep-btn-ghost) {
          background: white;
          color: #334155;
          border-color: #e8edf0;
        }

        :global(.ep-btn-ghost:hover:not(:disabled)) {
          border-color: #13795b;
          color: #13795b;
          background: #f0faf6;
        }

        :global(.ep-btn-sm) {
          padding: 8px 14px;
          font-size: 12px;
          min-height: 36px;
        }

        /* ============================================================
           Sticky Save Bar
           ============================================================ */
        .ep-save-bar {
          position: sticky;
          bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid #e8edf0;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
          z-index: 20;
          flex-wrap: wrap;
        }

        .ep-save-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #64748b;
          font-weight: 600;
        }

        .ep-save-info i {
          color: #13795b;
          font-size: 14px;
        }

        .ep-save-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 768px) {
          .ep-header-left h1 {
            font-size: 20px;
          }

          .ep-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          .ep-card {
            padding: 18px;
            border-radius: 16px;
          }

          .ep-gallery-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .ep-hero-preview {
            height: 140px;
          }

          .ep-avatar {
            width: 74px;
            height: 74px;
            border-width: 3px;
          }

          .ep-avatar-placeholder {
            font-size: 22px;
          }

          .ep-save-bar {
            padding: 12px 16px;
            bottom: 8px;
          }

          .ep-save-info {
            display: none;
          }

          .ep-save-actions {
            width: 100%;
          }

          :global(.ep-save-actions .ep-btn) {
            flex: 1;
          }
        }

        @media (max-width: 600px) {
          .ep-grid-2 {
            grid-template-columns: 1fr;
          }

          .ep-gallery-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ep-hero-preview {
            height: 120px;
          }

          .ep-avatar {
            width: 66px;
            height: 66px;
            left: 16px;
          }

          .ep-hero-actions {
            margin-top: 22px;
          }

          .ep-cover-placeholder i {
            font-size: 24px;
          }

          .ep-cover-placeholder span {
            font-size: 11.5px;
          }

          .ep-card-title {
            font-size: 14px;
          }

          .ep-card-sub {
            font-size: 11.5px;
            padding-left: 0;
          }

          .ep-limit-info {
            font-size: 12px;
            padding: 10px 12px;
          }
        }

        @media (max-width: 400px) {
          .ep-page {
            gap: 16px;
          }

          .ep-header-left h1 {
            font-size: 18px;
          }

          .ep-card {
            padding: 16px;
          }

          .ep-gallery-grid {
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
}

// ============================================================
// Field Component
// ============================================================
function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  icon,
  hint,
  options = [],
}) {
  return (
    <div className="ep-field">
      <label className="ep-label">
        {icon && <i className={`fas ${icon}`}></i>}
        {label}
        {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="ep-input"
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="ep-input"
        />
      )}

      {hint && <div className="ep-hint">{hint}</div>}
    </div>
  );
}