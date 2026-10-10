// src/app/complete-registration/page.js
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "react-toastify";
import Layout from "@/components/layout/Layout";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import CountrySelect from "@/components/ui/CountrySelect";
import { COVER_PLACEHOLDER } from "@/lib/imageHelpers";
import CategorySelect from "@/components/ui/CategorySelect";
import VocabularySelect from "@/components/ui/VocabularySelect";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { getCountryName } from "@/lib/countries";

const STORAGE_KEY = "complete-registration-form";

// ====== Helper: read from sessionStorage ======
function loadFromStorage() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// ====== Helper: write to sessionStorage ======
function saveToStorage(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function CompleteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const emailFromUrl = searchParams.get("email");
  const tokenFromUrl = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [hasRedirected, setHasRedirected] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);

  // ====== Form state ======
  const [formData, setFormData] = useState(() => {
    const saved = loadFromStorage();
    return (
      saved?.formData || {
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
      }
    );
  });

  const [existingLogo, setExistingLogo] = useState(() => {
    const saved = loadFromStorage();
    return saved?.existingLogo || null;
  });

  const [existingCover, setExistingCover] = useState(() => {
    const saved = loadFromStorage();
    return saved?.existingCover || null;
  });

  // ===== Gallery limit from user's plan =====
  // null = not loaded yet | -1 = unlimited | n = number
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
  const isInitialized = useRef(false);
  const autoLoginAttempted = useRef(false);

  // ============================================================
  // 1. Auto-login with the email verification token
  // ============================================================
  useEffect(() => {
    if (status === "loading") return;
    if (session) return;
    if (!tokenFromUrl || !emailFromUrl) return;
    if (autoLoginAttempted.current) return;

    autoLoginAttempted.current = true;
    setAutoLoggingIn(true);

    signIn("verify-token", {
      email: emailFromUrl,
      token: tokenFromUrl,
      redirect: false,
    })
      .then((result) => {
        if (result?.error) {
          toast.error("Session expired. Please login manually.");
          router.replace(
            `/login?verified=true&email=${encodeURIComponent(emailFromUrl)}`,
          );
        } else {
          // Clean up the URL (remove the token from the address)
          window.history.replaceState({}, "", "/complete-registration");
          // Give NextAuth a chance to refresh the session
          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      })
      .catch(() => {
        toast.error("Auto-login failed. Please login manually.");
        router.replace(
          `/login?verified=true&email=${encodeURIComponent(emailFromUrl)}`,
        );
      })
      .finally(() => {
        setAutoLoggingIn(false);
      });
  }, [status, session, tokenFromUrl, emailFromUrl, router]);

  // ============================================================
  // 2. Conditional redirects
  // ============================================================
  useEffect(() => {
    if (status === "loading" || hasRedirected) return;

    // If the user has already completed their registration
    if (session?.user?.registrationComplete === true) {
      router.replace("/dashboard");
      setHasRedirected(true);
      return;
    }

    // If there is no session and no link → go to login
    if (!session && !emailFromUrl && !tokenFromUrl) {
      router.replace("/login");
      setHasRedirected(true);
      return;
    }

    // If we have no session but do have email/token → wait for auto-login
    if (!session && (emailFromUrl || tokenFromUrl)) {
      return;
    }
  }, [session, status, emailFromUrl, tokenFromUrl, router, hasRedirected]);

  // ============================================================
  // 3. Fetch user information (only once)
  // ============================================================
  useEffect(() => {
    if (status === "loading") return;
    if (isInitialized.current) return;

    // If you have no session, wait (auto-login is in progress)
    if (!session) return;

    // From sessionStorage if we have something saved
    const saved = loadFromStorage();
    if (saved?.formData) {
      setFormData(saved.formData);
      setExistingLogo(saved.existingLogo || null);
      setExistingCover(saved.existingCover || null);
      setFetching(false);
      isInitialized.current = true;
      return;
    }

    // Otherwise fetch it from the API
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");

        if (res.status === 401 || res.status === 403) {
          router.replace("/login");
          setHasRedirected(true);
          return;
        }

        if (!res.ok) {
          throw new Error(`Server error (${res.status})`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response from server");
        }

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
        isInitialized.current = true;
      } catch (err) {
        toast.error(err.message);
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchUserProfile();
  }, [session, status, router]);

  // ============================================================
  // 4. Fetch gallery limit from user's plan
  // ============================================================
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
        // If it errors, assume the limit is unlimited (the server checks it on save)
        setGalleryLimit(-1);
      });
  }, [status]);

  // ============================================================
  // 5. Auto-save to sessionStorage
  // ============================================================
  useEffect(() => {
    if (isInitialized.current) {
      saveToStorage({
        formData,
        existingLogo,
        existingCover,
      });
    }
  }, [formData, existingLogo, existingCover]);

  // ============================================================
  // 6. Field changes
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleCategoryChange = (category, subCategory) => {
    setFormData((prev) => ({
      ...prev,
      primaryCategory: category,
      primarySubCategory: subCategory || "",
    }));
    if (error) setError("");
  };

  const handleBioChange = (value) => {
    setFormData((prev) => ({ ...prev, bio: value }));
  };

  // ============================================================
  // 7. Upload images
  // ============================================================
  const handleFileChange = async (e, fieldName) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Single file (logo, coverImage)
    if (fieldName !== "galleryImages") {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        toast.warning("Please select a valid image file.");
        e.target.value = "";
        return;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 3) {
        toast.error(
          `Image size (${sizeMB.toFixed(1)}MB) exceeds the 3MB limit.`,
        );
        e.target.value = "";
        return;
      }

      // ✅ Determine purpose based on fieldName
      const purpose = fieldName === "logo" ? "logo" : "cover";

      try {
        setIsUploading((prev) => ({ ...prev, [fieldName]: true }));
        setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));

        const result = await uploadFileWithProgress(
          file,
          "profiles",
          (percent) => {
            setUploadProgress((prev) => ({ ...prev, [fieldName]: percent }));
          },
          purpose                                  // ✅ new
        );

        setFormData((prev) => ({ ...prev, [fieldName]: result.path }));
        toast.success(`Image uploaded! (${result.saved}% smaller)`);
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

    // Gallery (multiple files)
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
          (percent) => {
            setUploadProgress((prev) => ({ ...prev, gallery: percent }));
          },
          "gallery"                                 // ✅ new
        );
        uploadedPaths.push(result.path);
      }

      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...uploadedPaths],
      }));

      toast.success(`${uploadedPaths.length} images uploaded for gallery!`);
    } catch (err) {
      toast.error(err.message || "Failed to upload gallery images.");
    } finally {
      setIsUploading((prev) => ({ ...prev, gallery: false }));
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, gallery: 0 }));
      }, 1000);
    }
  };

  // ============================================================
  // 8. Remove images
  // ============================================================
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
      if (fieldName === "logo" && logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      if (fieldName === "coverImage" && coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  // ============================================================
  // 9. Submit form
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const email = session?.user?.email || emailFromUrl;
      if (!email) {
        throw new Error("Email is required");
      }

      const payload = {
        email,
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
        role: formData.role || "BUYER",
        logo: formData.logo || existingLogo,
        coverImage: formData.coverImage || existingCover,
        primaryCategory: formData.primaryCategory || null,
        primarySubCategory: formData.primarySubCategory || null,
        galleryImages: formData.galleryImages,
      };

      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to complete registration");
      }

      // Clear the draft
      sessionStorage.removeItem(STORAGE_KEY);

      // ✅ Update the JWT
      await update({ registrationComplete: true });

      toast.success("Registration completed successfully!");

      // ✅ Wait a moment for the JWT to actually update, then go to the dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 400);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      setLoading(false);
    }
  };

  // ============================================================
  // 10. Loading states
  // ============================================================
  if (status === "loading" || autoLoggingIn || fetching) {
    return (
      <Layout>
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">
            {autoLoggingIn
              ? "Signing you in..."
              : "Loading your information..."}
          </p>
        </div>
      </Layout>
    );
  }

  if (hasRedirected) return null;
  if (!session && !emailFromUrl) return null;

  // ===== Gallery limit calculations =====
  const currentGalleryCount = formData.galleryImages.length;
  const isUnlimited = galleryLimit === -1;
  const isLimitKnown = galleryLimit !== null && galleryLimit !== -1;
  const remainingSlots = isLimitKnown
    ? Math.max(0, galleryLimit - currentGalleryCount)
    : Infinity;
  const isGalleryFull = isLimitKnown && currentGalleryCount >= galleryLimit;

  // ============================================================
  // 11. Render form
  // ============================================================
  return (
    <Layout>
      <div
        className="container"
        style={{ maxWidth: "800px", marginTop: "40px", marginBottom: "60px" }}
      >
        <div className="card shadow border-0 rounded-4 p-4 p-md-5">
          {/* ====== Header ====== */}
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: "64px",
                height: "64px",
                background: "var(--color-primary, #13795b)",
                borderRadius: "16px",
              }}
            >
              <i className="fas fa-check-circle text-white fs-2"></i>
            </div>
            <h2 className="fw-bold">Complete Your Registration</h2>
            <p className="text-muted">
              Please provide your business information to continue
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2"
              role="alert"
            >
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ====== Email ====== */}
            <div className="form-group mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={session?.user?.email || emailFromUrl || ""}
                disabled
                style={{ background: "#f5f5f5" }}
              />
              <small className="text-muted">
                This email is verified and cannot be changed
              </small>
            </div>

            {/* ====== Name ====== */}
            <div className="form-group mb-3">
              <label className="form-label fw-semibold">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* ====== Company name ====== */}
            <div className="form-group mb-3">
              <label className="form-label fw-semibold">
                Company Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="companyName"
                placeholder="Anderson Foods LLC"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            {/* ====== Country + business type ====== */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Country <span className="text-danger">*</span>
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
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Business Type</label>
                <VocabularySelect
                  vocabKey="businessTypes"
                  value={formData.businessType}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, businessType: v }))
                  }
                  allowCustom
                  placeholder="Select business type…"
                />
              </div>
            </div>

            {/* ====== Category ====== */}
            <div className="form-group mt-3">
              <label className="form-label fw-semibold">Product Category</label>
              <CategorySelect
                categoryValue={formData.primaryCategory}
                subCategoryValue={formData.primarySubCategory}
                onCategoryChange={(cat) => {
                  setFormData((prev) => ({
                    ...prev,
                    primaryCategory: cat,
                    primarySubCategory: "",
                  }));
                  if (error) setError("");
                }}
                onSubCategoryChange={(sub) => {
                  setFormData((prev) => ({
                    ...prev,
                    primarySubCategory: sub,
                  }));
                  if (error) setError("");
                }}
                categoryRequired={false}
              />
            </div>

            {/* ====== Phone + company email ====== */}
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  placeholder="+1 234 567 890"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Company Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="companyEmail"
                  placeholder="info@company.com"
                  value={formData.companyEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ====== Website ====== */}
            <div className="form-group mt-3">
              <label className="form-label fw-semibold">Company Website</label>
              <input
                type="url"
                className="form-control"
                name="website"
                placeholder="https://www.example.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            {/* ====== Biography ====== */}
            <div className="form-group mt-3">
              <label className="form-label fw-semibold">
                Company Bio / Description
              </label>
              <RichTextEditor
                value={formData.bio}
                onChange={handleBioChange}
                placeholder="Tell us about your company..."
                height={200}
              />
            </div>

            {/* ====== Address, city, postal code, number of employees ====== */}
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">City</label>
                <input
                  type="text"
                  className="form-control"
                  name="city"
                  placeholder="e.g., Tehran"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Postal Code</label>
                <input
                  type="text"
                  className="form-control"
                  name="postalCode"
                  placeholder="e.g., 1234567890"
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Number of Employees
                </label>
                <select
                  className="form-select"
                  name="employeeCount"
                  value={formData.employeeCount}
                  onChange={handleChange}
                >
                  <option value="">Select range</option>
                  <option>1-10</option>
                  <option>11-50</option>
                  <option>51-200</option>
                  <option>201-500</option>
                  <option>501-1000</option>
                  <option>1000+</option>
                </select>
              </div>
            </div>

            {/* ====== Images ====== */}
            <h5 className="fw-bold mt-4 mb-3">Company Images</h5>
            <p className="text-muted small">
              <i className="fas fa-info-circle me-1"></i>
              Maximum file size: 3MB · Supported formats: JPG, PNG, WEBP
            </p>

            {/* Combined preview */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Profile Preview</label>
              <div
                className="border rounded-3 position-relative overflow-hidden"
                style={{
                  width: "100%",
                  height: "120px",
                  background: "var(--light)",
                }}
              >
                {formData.coverImage || existingCover ? (
                  <img
                    src={formData.coverImage || existingCover}
                    alt="Cover preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <img
                    src={COVER_PLACEHOLDER}
                    alt="Default cover preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {formData.logo || existingLogo ? (
                  <img
                    src={formData.logo || existingLogo}
                    alt="Logo preview"
                    style={{
                      position: "absolute",
                      bottom: "-20px",
                      left: "20px",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      border: "3px solid white",
                      objectFit: "cover",
                      background: "var(--gray-light)",
                    }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-20px",
                      left: "20px",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      border: "3px solid white",
                      background: "var(--gray-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gray)",
                      fontSize: "20px",
                    }}
                  >
                    <i className="fas fa-camera"></i>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mt-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => coverInputRef.current.click()}
                  disabled={isUploading.coverImage}
                >
                  {isUploading.coverImage ? "Uploading..." : "Upload Cover"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => logoInputRef.current.click()}
                  disabled={isUploading.logo}
                >
                  {isUploading.logo ? "Uploading..." : "Upload Logo"}
                </button>
                {(formData.coverImage || formData.logo) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        logo: null,
                        coverImage: null,
                      }));
                      if (logoInputRef.current) logoInputRef.current.value = "";
                      if (coverInputRef.current)
                        coverInputRef.current.value = "";
                    }}
                  >
                    <i className="fas fa-trash"></i> Reset
                  </button>
                )}
              </div>

              <UploadProgress
                progress={uploadProgress.coverImage}
                label="Uploading cover..."
              />
              <UploadProgress
                progress={uploadProgress.logo}
                label="Uploading logo..."
              />
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

            {/* Gallery */}
            <div className="form-group mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  Gallery Images
                </label>
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
                        {galleryLimit !== 1 ? "s" : ""} on the free plan.
                        Remove an image or{" "}
                        <a
                          href="/plans"
                          style={{
                            color: "inherit",
                            textDecoration: "underline",
                          }}
                        >
                          upgrade your plan
                        </a>{" "}
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

              <div
                className="image-upload-area"
                onClick={() => {
                  if (!isGalleryFull && !isUploading.gallery) {
                    galleryInputRef.current.click();
                  }
                }}
                style={{
                  cursor: isGalleryFull ? "not-allowed" : "pointer",
                  opacity: isGalleryFull ? 0.6 : 1,
                }}
              >
                <i className="fas fa-images fa-2x text-muted"></i>
                <p className="mt-2">
                  {isGalleryFull
                    ? "Gallery limit reached"
                    : "Click or drag to upload multiple images"}
                </p>
                <button
                  type="button"
                  className={`btn btn-sm ${isGalleryFull
                      ? "btn-secondary"
                      : "btn-secondary"
                    }`}
                  disabled={isGalleryFull}
                >
                  {isGalleryFull ? (
                    <>
                      <i className="fas fa-lock me-1"></i> Limit Reached
                    </>
                  ) : (
                    "Choose Images"
                  )}
                </button>
              </div>
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, "galleryImages")}
                disabled={isGalleryFull}
              />
              <UploadProgress
                progress={uploadProgress.gallery}
                label="Uploading gallery..."
              />

              <div className="d-flex flex-wrap gap-2 mt-2">
                {formData.galleryImages.map((img, index) => (
                  <div key={index} className="position-relative">
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--gray-light)",
                      }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                      style={{
                        width: "20px",
                        height: "20px",
                        fontSize: "10px",
                        padding: 0,
                      }}
                      onClick={() => removeImage("galleryImages", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ====== Role ====== */}
            <div className="form-group mt-3">
              <label className="form-label fw-semibold">
                I want to register as <span className="text-danger">*</span>
              </label>
              <div className="row g-3">
                <div className="col-6">
                  <div
                    className={`p-3 text-center border rounded-3 cursor-pointer ${formData.role === "BUYER" ? "border-primary bg-light" : ""
                      }`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "BUYER" }))
                    }
                  >
                    <i
                      className="fas fa-shopping-cart fs-2"
                      style={{ color: "var(--primary)" }}
                    ></i>
                    <h5 className="mt-2 mb-0">Buyer</h5>
                    <small className="text-muted">Find the best products</small>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className={`p-3 text-center border rounded-3 cursor-pointer ${formData.role === "SUPPLIER"
                        ? "border-primary bg-light"
                        : ""
                      }`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "SUPPLIER" }))
                    }
                  >
                    <i
                      className="fas fa-store fs-2"
                      style={{ color: "var(--primary)" }}
                    ></i>
                    <h5 className="mt-2 mb-0">Supplier</h5>
                    <small className="text-muted">Sell products globally</small>
                  </div>
                </div>
              </div>
            </div>

            {/* ====== Submit button ====== */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 mt-4"
              style={{
                background: "var(--color-primary, #13795b)",
                borderColor: "var(--color-primary, #13795b)",
                borderRadius: "50px",
              }}
              disabled={
                loading ||
                isUploading.logo ||
                isUploading.coverImage ||
                isUploading.gallery
              }
            >
              {loading ? "Submitting..." : "Complete Registration"}
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        /* ===== Count badge ===== */
        .ep-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 8px;
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

        /* ===== Limit info message ===== */
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
          margin-bottom: 12px;
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
      `}</style>
    </Layout>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="container text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading...</p>
          </div>
        </Layout>
      }
    >
      <CompleteRegistrationContent />
    </Suspense>
  );
}