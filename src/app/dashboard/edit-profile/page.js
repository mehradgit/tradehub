// src/app/dashboard/edit-profile/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

  // ====== فرم دیتا ======
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    country: "",
    countryCode: "",
    businessType: "",
    phone: "",
    bio: "",
    address: "",
    city: "",          // ← جدید
    postalCode: "",    // ← جدید
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
          countryCode: user.countryCode || "",
          businessType: user.businessType || "",
          phone: user.phone || "",
          bio: user.bio || "",
          address: user.address || "",
          city: user.city || "",              // ← جدید
          postalCode: user.postalCode || "",  // ← جدید
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

  // ====== تغییرات فیلدها ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // ====== تغییرات دسته‌بندی ======
  const handleCategoryChange = (category, subCategory) => {
    setFormData((prev) => ({
      ...prev,
      primaryCategory: category,
      primarySubCategory: subCategory || "",
    }));
    if (error) setError("");
  };

  // ====== تغییرات توضیحات (Rich Text) ======
  const handleBioChange = (value) => {
    setFormData((prev) => ({ ...prev, bio: value }));
  };

  // ====== آپلود فایل‌ها ======
  const handleFileChange = async (e, fieldName) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

      try {
        setIsUploading((prev) => ({ ...prev, [fieldName]: true }));
        setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));

        const result = await uploadFileWithProgress(
          file,
          "profiles",
          (percent) => {
            setUploadProgress((prev) => ({ ...prev, [fieldName]: percent }));
          },
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
      return;
    }

    // ====== آپلود گالری (چند فایل) ======
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

  // ====== حذف تصاویر ======
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

  // ====== ارسال فرم ======
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
        city: formData.city || null,              // ✅ مطمئن شو هست
        postalCode: formData.postalCode || null,  // ✅ مطمئن شو هست
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
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      await update();
      setExistingLogo(payload.logo);
      setExistingCover(payload.coverImage);
      setFormData((prev) => ({ ...prev, logo: null, coverImage: null }));

      toast.success("Profile updated successfully!");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== وضعیت بارگذاری ======
  if (status === "loading" || fetching) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;
  console.log("Gallery Images:", formData.galleryImages);
  return (
    <div
      className="container"
      style={{ maxWidth: "800px", marginTop: "40px", marginBottom: "60px" }}
    >
      <div className="card shadow border-0 rounded-4 p-4 p-md-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold">Edit Profile</h2>
          <p className="text-muted">
            Update your personal and business information
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

          {/* ====== کشور ====== */}
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

          {/* ====== دسته‌بندی محصولات ====== */}
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
                setFormData((prev) => ({ ...prev, primarySubCategory: sub }));
                if (error) setError("");
              }}
              categoryRequired={false}
            />
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

          {/* ====== توضیحات شرکت (Rich Text Editor) ====== */}
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

          {/* ====== آدرس و تعداد کارکنان ====== */}
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
                placeholder="Tehran"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Postal Code + Employee Count */}
          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Postal Code</label>
              <input
                type="text"
                className="form-control"
                name="postalCode"
                placeholder="1234567890"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </div>            <div className="col-md-6">
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

          {/* ====== بخش تصاویر ====== */}
          <h5 className="fw-bold mt-4 mb-3">Company Images</h5>
          <p className="text-muted small">
            <i className="fas fa-info-circle me-1"></i>
            Maximum file size: 3MB · Supported formats: JPG, PNG, WEBP
          </p>

          {/* ====== پیش‌نمایش ترکیبی (کاور + لوگو) ====== */}
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
              {/* کاور */}
              {formData.coverImage || existingCover ? (
                <img
                  src={formData.coverImage || existingCover}
                  alt="Cover preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
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

              {/* لوگو */}
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
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
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
                    fontWeight: "bold",
                  }}
                >
                  <i className="fas fa-camera"></i>
                </div>
              )}
            </div>{" "}
            <div className="d-flex gap-2 mt-2">
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
                    if (coverInputRef.current) coverInputRef.current.value = "";
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

          {/* inputهای مخفی */}
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

          {/* ====== گالری تصاویر ====== */}
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

            {/* پیش‌نمایش تصاویر گالری */}
            <div className="d-flex flex-wrap gap-2 mt-2">
              {formData.galleryImages.map((img, index) => (
                <div key={index} className="position-relative">
                  {img ? (
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
                      onError={(e) => {
                        e.target.style.display = "none";
                        // نمایش پل‌هولدر به جای مخفی کردن کامل
                        e.target.parentElement.innerHTML = `
              <div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-image" style="color:#ccc;"></i>
              </div>`;
                      }}
                    />
                  ) : null}
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
            <small className="text-muted">
              Role cannot be changed after registration
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 mt-4"
            style={{
              background: "var(--color-primary, #e85d3a)",
              borderColor: "var(--color-primary, #e85d3a)",
              borderRadius: "50px",
            }}
            disabled={
              loading ||
              isUploading.logo ||
              isUploading.coverImage ||
              isUploading.gallery
            }
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
