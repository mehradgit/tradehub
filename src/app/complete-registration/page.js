// src/app/complete-registration/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "react-toastify";
import Layout from "@/components/layout/Layout";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import CountrySelect from "@/components/ui/CountrySelect";
import CategorySelect from "@/components/ui/CategorySelect";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { getCountryName } from "@/lib/countries";

const STORAGE_KEY = "complete-registration-form";

// ====== Helper: خواندن از sessionStorage ======
function loadFromStorage() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// ====== Helper: نوشتن در sessionStorage ======
function saveToStorage(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export default function CompleteRegistrationPage() {
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

  // ====== State فرم ======
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
  // ۱. Auto-login با توکن تأیید ایمیل
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
            `/login?verified=true&email=${encodeURIComponent(emailFromUrl)}`
          );
        } else {
          // URL رو تمیز کن (توکن رو از آدرس حذف کن)
          window.history.replaceState({}, "", "/complete-registration");
          // به NextAuth فرصت بده تا session رو رفرش کنه
          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      })
      .catch(() => {
        toast.error("Auto-login failed. Please login manually.");
        router.replace(
          `/login?verified=true&email=${encodeURIComponent(emailFromUrl)}`
        );
      })
      .finally(() => {
        setAutoLoggingIn(false);
      });
  }, [status, session, tokenFromUrl, emailFromUrl, router]);

  // ============================================================
  // ۲. هدایت‌های شرطی
  // ============================================================
  useEffect(() => {
    if (status === "loading" || hasRedirected) return;

    // اگر کاربر قبلاً ثبت‌نامش را تکمیل کرده
    if (session?.user?.registrationComplete === true) {
      router.replace("/dashboard");
      setHasRedirected(true);
      return;
    }

    // اگر هیچ session و هیچ لینکی نیست → برو لاگین
    if (!session && !emailFromUrl && !tokenFromUrl) {
      router.replace("/login");
      setHasRedirected(true);
      return;
    }

    // اگر session نداری ولی email/token داری → منتظر auto-login بمون
    if (!session && (emailFromUrl || tokenFromUrl)) {
      return;
    }
  }, [session, status, emailFromUrl, tokenFromUrl, router, hasRedirected]);

  // ============================================================
  // ۳. دریافت اطلاعات کاربر (فقط یک‌بار)
  // ============================================================
  useEffect(() => {
    if (status === "loading") return;
    if (isInitialized.current) return;

    // اگر session نداری، صبر کن (auto-login در جریانه)
    if (!session) return;

    // از sessionStorage اگه چیز ذخیره‌شده داریم
    const saved = loadFromStorage();
    if (saved?.formData) {
      setFormData(saved.formData);
      setExistingLogo(saved.existingLogo || null);
      setExistingCover(saved.existingCover || null);
      setFetching(false);
      isInitialized.current = true;
      return;
    }

    // در غیر این صورت از API دریافت کن
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
  // ۴. ذخیره خودکار در sessionStorage
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
  // ۵. تغییرات فیلدها
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
  // ۶. آپلود تصاویر
  // ============================================================
  const handleFileChange = async (e, fieldName) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // فایل تکی (logo, coverImage)
    if (fieldName !== "galleryImages") {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        toast.warning("Please select a valid image file.");
        e.target.value = "";
        return;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 3) {
        toast.error(`Image size (${sizeMB.toFixed(1)}MB) exceeds the 3MB limit.`);
        e.target.value = "";
        return;
      }

      try {
        setIsUploading((prev) => ({ ...prev, [fieldName]: true }));
        setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));

        const result = await uploadFileWithProgress(
          file,
          "profiles",
          (percent) => {
            setUploadProgress((prev) => ({ ...prev, [fieldName]: percent }));
          }
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

    // گالری (چند فایل)
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
          }
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
  // ۷. حذف تصاویر
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
  // ۸. ارسال فرم
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

      // پاک کردن draft
      sessionStorage.removeItem(STORAGE_KEY);

      // ✅ JWT رو آپدیت کن
      await update({ registrationComplete: true });

      toast.success("Registration completed successfully!");

      // ✅ کمی صبر کن تا JWT واقعاً آپدیت بشه، بعد برو داشبورد
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
  // ۹. حالت‌های بارگذاری
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

  // ============================================================
  // ۱۰. رندر فرم
  // ============================================================
  return (
    <Layout>
      <div
        className="container"
        style={{ maxWidth: "800px", marginTop: "40px", marginBottom: "60px" }}
      >
        <div className="card shadow border-0 rounded-4 p-4 p-md-5">
          {/* ====== هدر ====== */}
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
            {/* ====== ایمیل ====== */}
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

            {/* ====== نام ====== */}
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

            {/* ====== نام شرکت ====== */}
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

            {/* ====== کشور + نوع کسب‌وکار ====== */}
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
                <select
                  className="form-select"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                >
                  <option value="">Select business type</option>
                  <option>Manufacturer</option>
                  <option>Distributor</option>
                  <option>Wholesaler</option>
                  <option>Retailer</option>
                  <option>Exporter</option>
                  <option>Importer</option>
                  <option>Processor</option>
                </select>
              </div>
            </div>

            {/* ====== دسته‌بندی ====== */}
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

            {/* ====== تلفن + ایمیل شرکت ====== */}
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

            {/* ====== وب‌سایت ====== */}
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

            {/* ====== بیوگرافی ====== */}
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

            {/* ====== آدرس + تعداد کارکنان ====== */}
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
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

            {/* ====== تصاویر ====== */}
            <h5 className="fw-bold mt-4 mb-3">Company Images</h5>
            <p className="text-muted small">
              <i className="fas fa-info-circle me-1"></i>
              Maximum file size: 3MB · Supported formats: JPG, PNG, WEBP
            </p>

            {/* پیش‌نمایش ترکیبی */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Profile Preview</label>
              <div
                className="border rounded-3 position-relative overflow-hidden"
                style={{ width: "100%", height: "120px", background: "var(--light)" }}
              >
                {formData.coverImage || existingCover ? (
                  <img
                    src={formData.coverImage || existingCover}
                    alt="Cover preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--gray-light)",
                      color: "var(--gray)",
                    }}
                  >
                    <i className="fas fa-image fa-2x"></i>
                  </div>
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

            {/* گالری */}
            <div className="form-group mb-3">
              <label className="form-label fw-semibold">Gallery Images</label>
              <div
                className="image-upload-area"
                onClick={() => galleryInputRef.current.click()}
              >
                <i className="fas fa-images fa-2x text-muted"></i>
                <p className="mt-2">Click or drag to upload multiple images</p>
                <button type="button" className="btn btn-secondary btn-sm">
                  Choose Images
                </button>
              </div>
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, "galleryImages")}
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
                      style={{ width: "20px", height: "20px", fontSize: "10px", padding: 0 }}
                      onClick={() => removeImage("galleryImages", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ====== نقش ====== */}
            <div className="form-group mt-3">
              <label className="form-label fw-semibold">
                I want to register as <span className="text-danger">*</span>
              </label>
              <div className="row g-3">
                <div className="col-6">
                  <div
                    className={`p-3 text-center border rounded-3 cursor-pointer ${
                      formData.role === "BUYER" ? "border-primary bg-light" : ""
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
                    className={`p-3 text-center border rounded-3 cursor-pointer ${
                      formData.role === "SUPPLIER" ? "border-primary bg-light" : ""
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

            {/* ====== دکمه ارسال ====== */}
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
    </Layout>
  );
}