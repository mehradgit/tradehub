// src/app/dashboard/edit-profile/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Layout from "@/components/layout/Layout";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    country: "",
    businessType: "",
    phone: "",
    bio: "",
    address: "",
    website: "",
    companyEmail: "",
    employeeCount: "",
    role: "BUYER",
    logo: null,
    coverImage: null,
  });

  const [existingLogo, setExistingLogo] = useState(null);
  const [existingCover, setExistingCover] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ logo: 0, coverImage: 0 });
  const [isUploading, setIsUploading] = useState({ logo: false, coverImage: false });

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // ====== دریافت اطلاعات کاربر ======
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
          businessType: user.businessType || "",
          phone: user.phone || "",
          bio: user.bio || "",
          address: user.address || "",
          website: user.website || "",
          companyEmail: user.companyEmail || "",
          employeeCount: user.employeeCount || "",
          role: user.role || "BUYER",
          logo: null,
          coverImage: null,
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

  // ====== تغییرات فیلدها ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ====== آپلود تصویر با پیشرفت ======
  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

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

      setFormData((prev) => ({
        ...prev,
        [fieldName]: result.path,
      }));

      toast.success(`Image uploaded! (${result.saved}% smaller)`);
    } catch (err) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setIsUploading((prev) => ({ ...prev, [fieldName]: false }));
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));
      }, 1000);
    }
  };

  // ====== حذف تصویر ======
  const removeImage = (fieldName, isExisting = false) => {
    if (isExisting) {
      if (fieldName === "logo") setExistingLogo(null);
      else setExistingCover(null);
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

  // ====== ارسال فرم ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        logo: formData.logo || existingLogo,
        coverImage: formData.coverImage || existingCover,
      };

      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      await update();
      setExistingLogo(payload.logo);
      setExistingCover(payload.coverImage);
      setFormData((prev) => ({ ...prev, logo: null, coverImage: null }));

      toast.success("Profile updated successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== نمایش تصویر ======
  const getImageSrc = (imageData) => {
    if (!imageData) return null;
    if (imageData.startsWith("data:image")) return imageData;
    if (imageData.startsWith("/9j/") || imageData.startsWith("iVBOR")) {
      return `data:image/jpeg;base64,${imageData}`;
    }
    return imageData;
  };

  if (status === "loading" || fetching) {
    return (
      <Layout>
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) return null;

  const hasLogo = formData.logo || existingLogo;
  const hasCover = formData.coverImage || existingCover;

  return (
    <Layout>
      <div className="container" style={{ maxWidth: "800px", marginTop: "40px", marginBottom: "60px" }}>
        <div className="card shadow border-0 rounded-4 p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Edit Profile</h2>
            <p className="text-muted">Update your personal and business information</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ====== نام کامل ====== */}
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

            {/* ====== کشور و نوع کسب‌وکار ====== */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Country <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select country</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Iran</option>
                  <option>Turkey</option>
                  <option>UAE</option>
                </select>
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

            {/* ====== تلفن و ایمیل شرکت ====== */}
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
              <label className="form-label fw-semibold">Company Bio / Description</label>
              <textarea
                className="form-control"
                rows="3"
                name="bio"
                placeholder="Tell us about your company..."
                value={formData.bio}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* ====== آدرس و تعداد کارکنان ====== */}
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
                <label className="form-label fw-semibold">Number of Employees</label>
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

            {/* ====== لوگو ====== */}
            <div className="form-group mb-3">
              <label className="form-label fw-semibold">Logo / Profile Image</label>
              <div className="d-flex align-items-start gap-3 flex-wrap">
                <div
                  className="border rounded-3 p-2 text-center"
                  style={{ width: "120px", height: "120px", cursor: "pointer" }}
                  onClick={() => logoInputRef.current.click()}
                >
                  {hasLogo ? (
                    <img
                      src={formData.logo || existingLogo}
                      alt="Logo preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                      <i className="fas fa-camera fa-2x"></i>
                      <small>Upload</small>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(e, "logo")}
                  />
                  {!hasLogo && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm mb-1"
                      onClick={() => logoInputRef.current.click()}
                      disabled={isUploading.logo}
                    >
                      {isUploading.logo ? "Uploading..." : "Choose Image"}
                    </button>
                  )}
                  <UploadProgress progress={uploadProgress.logo} label="Uploading logo..." />
                  {hasLogo && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger mt-1"
                      onClick={() => {
                        if (formData.logo) removeImage("logo", false);
                        else removeImage("logo", true);
                      }}
                    >
                      <i className="fas fa-trash"></i> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ====== تصویر کاور ====== */}
            <div className="form-group mb-3">
              <label className="form-label fw-semibold">Cover Image</label>
              <div className="d-flex align-items-start gap-3 flex-wrap">
                <div
                  className="border rounded-3 p-2 text-center"
                  style={{ width: "200px", height: "100px", cursor: "pointer" }}
                  onClick={() => coverInputRef.current.click()}
                >
                  {hasCover ? (
                    <img
                      src={formData.coverImage || existingCover}
                      alt="Cover preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                      <i className="fas fa-camera fa-2x"></i>
                      <small>Upload</small>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(e, "coverImage")}
                  />
                  {!hasCover && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm mb-1"
                      onClick={() => coverInputRef.current.click()}
                      disabled={isUploading.coverImage}
                    >
                      {isUploading.coverImage ? "Uploading..." : "Choose Image"}
                    </button>
                  )}
                  <UploadProgress progress={uploadProgress.coverImage} label="Uploading cover..." />
                  {hasCover && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger mt-1"
                      onClick={() => {
                        if (formData.coverImage) removeImage("coverImage", false);
                        else removeImage("coverImage", true);
                      }}
                    >
                      <i className="fas fa-trash"></i> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ====== نقش (غیرقابل تغییر) ====== */}
            <div className="form-group mt-3">
              <label className="form-label fw-semibold">Role</label>
              <input
                type="text"
                className="form-control"
                value={formData.role === "SUPPLIER" ? "Supplier" : "Buyer"}
                disabled
                style={{ background: "#f5f5f5" }}
              />
              <small className="text-muted">Role cannot be changed after registration</small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 mt-4"
              style={{
                background: "var(--color-primary, #e85d3a)",
                borderColor: "var(--color-primary, #e85d3a)",
                borderRadius: "50px",
              }}
              disabled={loading || isUploading.logo || isUploading.coverImage}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}