// src/components/dashboard/EditProductForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import RichTextEditor from "@/components/ui/RichTextEditor";
import CategorySelect from "@/components/ui/CategorySelect";
import CountrySelect from "@/components/ui/CountrySelect";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import { getCountryName } from "@/lib/countries";

export default function EditProductForm({ product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // ===== Image limit from plan =====
  // null = هنوز لود نشده | -1 = نامحدود | n = عدد
  const [imageLimit, setImageLimit] = useState(null);

  // ===== Form State =====
  const [formData, setFormData] = useState({
    name: product.name || "",
    category: product.category || "",
    subCategory: product.subCategory || "",
    shortDesc: product.shortDesc || "",
    fullDesc: product.fullDesc || "",
    price: product.price || "",
    currency: product.currency || "USD",
    unit: product.unit || "kg",
    moq: product.moq || "",
    stock: product.stock || "",
    leadTime: product.leadTime || "",
    shippingTerms: product.shippingTerms || "",
    packaging: product.packaging || "",
    certifications: product.certifications || "",
    origin: product.origin || "",
    countryCode: product.countryCode || "",
    isVisible: product.isVisible !== undefined ? product.isVisible : true,
  });

  // ===== Images State =====
  const [existingImages, setExistingImages] = useState(
    Array.isArray(product.images) ? product.images : []
  );
  const [newImages, setNewImages] = useState([]);

  // ===== Fetch image limit =====
  useEffect(() => {
    fetch("/api/user/subscription")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const limit = data?.plan?.maxImagesPerProduct;
        if (typeof limit === "number") {
          setImageLimit(limit);
        }
      })
      .catch(() => {
        setImageLimit(-1);
      });
  }, []);

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategoryChange = (category, subCategory) => {
    setFormData((prev) => ({
      ...prev,
      category: category || "",
      subCategory: subCategory || "",
    }));
  };

  // ===== Image limit calculations =====
  const totalImages = existingImages.length + newImages.length;
  const isUnlimited = imageLimit === -1;
  const isLimitKnown = imageLimit !== null && imageLimit !== -1;
  const remainingSlots = isLimitKnown
    ? Math.max(0, imageLimit - totalImages)
    : Infinity;
  const isImageFull = isLimitKnown && totalImages >= imageLimit;

  // ===== Image Upload =====
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // ✅ چک کلاینت: تعداد انتخابی نباید از ظرفیت باقی‌مانده بیشتر باشه
    if (isLimitKnown && files.length > remainingSlots) {
      toast.warning(
        `You can only add ${remainingSlots} more image${
          remainingSlots !== 1 ? "s" : ""
        }. You selected ${files.length}.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedPaths = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.warning(`Skipping ${file.name}: not an image.`);
          continue;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 5) {
          toast.warning(`Skipping ${file.name}: exceeds 5MB.`);
          continue;
        }

        // ⚠️ نکته: targetId رو پاس نمی‌دیم تا سرور چک نکنه.
        // چک اصلی در PUT /api/products/[id] انجام می‌شه (هنگام Save).
        const result = await uploadFileWithProgress(
          file,
          "products",
          (percent) => setUploadProgress(percent)
        );
        uploadedPaths.push(result.path);
      }

      setNewImages((prev) => [...prev, ...uploadedPaths]);
      toast.success(`${uploadedPaths.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const allImages = [...existingImages, ...newImages];

      if (allImages.length === 0) {
        toast.error("Please add at least one image");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        fullDesc: formData.fullDesc || null,
        images: allImages,
        price: parseFloat(formData.price),
        moq: parseInt(formData.moq),
        stock: formData.stock ? parseInt(formData.stock) : null,
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : null,
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      toast.success("Product updated. Pending approval.");
      router.push("/dashboard/products");
    } catch (error) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = existingImages.length === 0 && newImages.length === 0;

  return (
    <>
      <div className="ep-page">
        {/* ============================================================
           Header
           ============================================================ */}
        <div className="ep-header">
          <div className="ep-header-left">
            <Link href="/dashboard/products" className="ep-back-link">
              <i className="fas fa-arrow-left"></i>
              Back to Products
            </Link>
            <h1>
              <i className="fas fa-pen"></i>
              Edit Product
            </h1>
            <p>
              #{product.productNumber} ·{" "}
              {product.name?.slice(0, 60) || "Untitled"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ep-form">
          {/* ============================================================
             SECTION 1: Basic Information
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-info-circle"></i>
                Basic Information
              </h3>
            </div>

            <Field
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Organic Arabica Coffee Beans"
              required
              icon="fa-box"
            />

            <div className="ep-field">
              <label className="ep-label">
                <i className="fas fa-tags"></i>
                Category
              </label>
              <CategorySelect
                categoryValue={formData.category}
                subCategoryValue={formData.subCategory}
                onCategoryChange={handleCategoryChange}
                onSubCategoryChange={(sub) =>
                  setFormData((prev) => ({ ...prev, subCategory: sub || "" }))
                }
                categoryRequired={true}
              />
            </div>

            <div className="ep-field">
              <label className="ep-label">
                <i className="fas fa-align-left"></i>
                Short Description
                <span className="ep-label-meta">
                  {formData.shortDesc?.length || 0}/200
                </span>
              </label>
              <textarea
                className="ep-input"
                rows="3"
                name="shortDesc"
                placeholder="Brief description that appears in listings"
                value={formData.shortDesc}
                onChange={handleChange}
                maxLength="200"
                required
              />
              <div className="ep-hint">
                This appears in search results and product listings.
              </div>
            </div>

            <div className="ep-field">
              <label className="ep-label">
                <i className="fas fa-file-alt"></i>
                Full Description
                <span className="ep-label-meta">
                  {formData.fullDesc?.length || 0}/5000
                </span>
              </label>
              <RichTextEditor
                value={formData.fullDesc}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, fullDesc: value }))
                }
                placeholder="Detailed description including origin, processing, certifications, etc."
                height={250}
              />
              <div className="ep-hint">
                Use the toolbar to format text (bold, lists, links, images...)
              </div>
            </div>
          </section>

          {/* ============================================================
             SECTION 2: Pricing & Inventory
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-tag"></i>
                Pricing & Inventory
              </h3>
            </div>

            <div className="ep-grid-3">
              <Field
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                icon="fa-dollar-sign"
              />
              <Field
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                type="select"
                icon="fa-coins"
                options={["USD", "EUR", "GBP", "AED", "IRR"]}
              />
              <Field
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                type="select"
                icon="fa-balance-scale"
                options={[
                  "kg",
                  "g",
                  "lb",
                  "L",
                  "ml",
                  "pieces",
                  "boxes",
                  "pallets",
                  "containers",
                  "metric_tons",
                ]}
              />
            </div>

            <div className="ep-grid-3">
              <Field
                label="MOQ"
                name="moq"
                value={formData.moq}
                onChange={handleChange}
                type="number"
                placeholder="100"
                required
                icon="fa-cube"
              />
              <Field
                label="Available Stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                type="number"
                placeholder="Optional"
                icon="fa-warehouse"
              />
              <Field
                label="Lead Time (days)"
                name="leadTime"
                value={formData.leadTime}
                onChange={handleChange}
                type="number"
                placeholder="Optional"
                icon="fa-clock"
              />
            </div>
          </section>

          {/* ============================================================
             SECTION 3: Shipping & Details
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-ship"></i>
                Shipping & Additional Details
              </h3>
            </div>

            <div className="ep-grid-2">
              <Field
                label="Shipping Terms"
                name="shippingTerms"
                value={formData.shippingTerms}
                onChange={handleChange}
                type="select"
                icon="fa-truck"
                options={[
                  "FOB (Free On Board)",
                  "CIF (Cost, Insurance, Freight)",
                  "EXW (Ex Works)",
                  "DDP (Delivered Duty Paid)",
                  "DAP (Delivered at Place)",
                ]}
              />
              <Field
                label="Packaging"
                name="packaging"
                value={formData.packaging}
                onChange={handleChange}
                placeholder="e.g., 20kg GrainPro bags"
                icon="fa-box-open"
              />
              <Field
                label="Certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                placeholder="e.g., USDA Organic, Fair Trade"
                icon="fa-certificate"
                hint="Separate with commas"
              />
              <div className="ep-field">
                <label className="ep-label">
                  <i className="fas fa-globe"></i>
                  Country of Origin
                </label>
                <CountrySelect
                  value={formData.countryCode}
                  onChange={(code) => {
                    const name = getCountryName(code);
                    setFormData((prev) => ({
                      ...prev,
                      origin: name,
                      countryCode: code,
                    }));
                  }}
                  placeholder="Select country of origin"
                />
              </div>
            </div>
          </section>

          {/* ============================================================
             SECTION 4: Images - با محدودیت هوشمند
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-images"></i>
                Product Images
                {isUnlimited && (
                  <span className="ep-count-badge">Unlimited</span>
                )}
                {isLimitKnown && (
                  <span
                    className={`ep-count-badge ${isImageFull ? "is-full" : ""}`}
                  >
                    {totalImages}/{imageLimit}
                  </span>
                )}
              </h3>
              <p className="ep-card-sub">
                First image will be used as the main thumbnail
              </p>
            </div>

            {/* ===== Limit Info ===== */}
            {isLimitKnown && (
              <div
                className={`ep-limit-info ${isImageFull ? "warning" : ""}`}
              >
                <i
                  className={`fas ${isImageFull
                      ? "fa-exclamation-triangle"
                      : "fa-info-circle"
                    }`}
                ></i>
                <span>
                  {isImageFull ? (
                    <>
                      You&apos;ve reached the maximum of{" "}
                      <strong>{imageLimit}</strong> image
                      {imageLimit !== 1 ? "s" : ""} per product on your plan.
                      Remove an image or{" "}
                      <Link
                        href="/plans"
                        style={{
                          color: "inherit",
                          textDecoration: "underline",
                        }}
                      >
                        upgrade your plan
                      </Link>{" "}
                      to add more.
                    </>
                  ) : (
                    <>
                      You can add <strong>{remainingSlots}</strong> more image
                      {remainingSlots !== 1 ? "s" : ""} ({totalImages} of{" "}
                      {imageLimit} used).
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Images Grid */}
            {!isEmpty ? (
              <div className="ep-img-grid">
                {/* Existing Images */}
                {existingImages.map((img, i) => (
                  <div key={`ex-${i}`} className="ep-img-item">
                    <img src={img} alt={`Existing ${i + 1}`} />
                    {i === 0 && newImages.length === 0 && (
                      <span className="ep-img-badge">Main</span>
                    )}
                    <span className="ep-img-tag existing">Existing</span>
                    <button
                      type="button"
                      className="ep-img-remove"
                      onClick={() => removeExistingImage(i)}
                      aria-label="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}

                {/* New Images */}
                {newImages.map((img, i) => (
                  <div key={`nw-${i}`} className="ep-img-item is-new">
                    <img src={img} alt={`New ${i + 1}`} />
                    {existingImages.length === 0 && i === 0 && (
                      <span className="ep-img-badge">Main</span>
                    )}
                    <span className="ep-img-tag new">New</span>
                    <button
                      type="button"
                      className="ep-img-remove"
                      onClick={() => removeNewImage(i)}
                      aria-label="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}

                {/* Add Button */}
                <button
                  type="button"
                  className={`ep-img-add ${isImageFull ? "is-full" : ""}`}
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading || isImageFull}
                  title={
                    isImageFull
                      ? `Image limit reached (${imageLimit} images)`
                      : "Add more images"
                  }
                >
                  {uploading ? (
                    <div className="ep-spinner-small" />
                  ) : isImageFull ? (
                    <>
                      <i className="fas fa-lock"></i>
                      <span>Limit Reached</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      <span>Add More</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                className="ep-img-empty"
                onClick={() => {
                  if (!isImageFull && !uploading) {
                    fileInputRef.current.click();
                  }
                }}
                style={{
                  cursor: isImageFull ? "not-allowed" : "pointer",
                  opacity: isImageFull ? 0.6 : 1,
                }}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                <h4>No images yet</h4>
                <p>Click to upload product images</p>
                <button
                  type="button"
                  className="ep-btn ep-btn-primary ep-btn-sm"
                  disabled={isImageFull}
                >
                  {isImageFull ? (
                    <>
                      <i className="fas fa-lock"></i> Limit Reached
                    </>
                  ) : (
                    <>
                      <i className="fas fa-folder-open"></i>
                      Choose Files
                    </>
                  )}
                </button>
              </div>
            )}

            <UploadProgress
              progress={uploadProgress}
              label="Uploading images..."
            />

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={isImageFull}
            />

            <div className="ep-img-hint">
              <i className="fas fa-info-circle"></i>
              Max 5MB each · JPG, PNG, WEBP
            </div>
          </section>

          {/* ============================================================
             SECTION 5: Visibility
             ============================================================ */}
          <section className="ep-card">
            <div className="ep-card-head">
              <h3 className="ep-card-title">
                <i className="fas fa-eye"></i>
                Visibility
              </h3>
            </div>

            <label className="ep-toggle-row">
              <div className="ep-toggle-info">
                <div className="ep-toggle-label">
                  {formData.isVisible
                    ? "Product visible to buyers"
                    : "Product hidden (draft)"}
                </div>
                <div className="ep-toggle-hint">
                  Toggle off to save as draft. Note: product needs admin
                  approval before going live.
                </div>
              </div>
              <div
                className={`ep-toggle ${formData.isVisible ? "on" : "off"}`}
              >
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={formData.isVisible}
                  onChange={handleChange}
                  className="ep-toggle-input"
                />
                <div className="ep-toggle-knob" />
              </div>
            </label>
          </section>

          {/* ============================================================
             Sticky Save Bar
             ============================================================ */}
          <div className="ep-save-bar">
            <div className="ep-save-info">
              <i className="fas fa-info-circle"></i>
              <span>Changes are pending admin approval</span>
            </div>
            <div className="ep-save-actions">
              <Link
                href="/dashboard/products"
                className="ep-btn ep-btn-ghost"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="ep-btn ep-btn-primary"
                disabled={loading || uploading}
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
           Header
           ============================================================ */
        .ep-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ep-header-left {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ep-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #64748b;
          text-decoration: none;
          font-weight: 700;
          transition: color 0.2s ease;
          width: fit-content;
        }

        .ep-back-link:hover {
          color: #13795b;
        }

        .ep-back-link i {
          font-size: 11px;
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
          font-size: 13px;
          color: #64748b;
          margin: 0;
          word-wrap: break-word;
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

        /* ===== Count badge ===== */
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
           Grids
           ============================================================ */
        .ep-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .ep-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        /* ============================================================
           Fields
           ============================================================ */
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

        :global(.ep-label-meta) {
          margin-left: auto;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
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

        :global(textarea.ep-input) {
          resize: vertical;
          min-height: 80px;
          line-height: 1.5;
        }

        :global(.ep-hint) {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* ============================================================
           Images
           ============================================================ */
        .ep-img-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .ep-img-item {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e8edf0;
          background: #f5f8f6;
          transition: all 0.2s ease;
        }

        .ep-img-item.is-new {
          border-color: #a7f3d0;
          border-style: dashed;
        }

        .ep-img-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ep-img-item:hover {
          border-color: #13795b;
          box-shadow: 0 8px 20px rgba(19, 121, 91, 0.12);
        }

        .ep-img-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          padding: 3px 8px;
          background: linear-gradient(135deg, #f5b544, #e08900);
          color: white;
          border-radius: 50px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .ep-img-tag {
          position: absolute;
          bottom: 6px;
          left: 6px;
          padding: 2px 8px;
          border-radius: 50px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          backdrop-filter: blur(4px);
        }

        .ep-img-tag.existing {
          background: rgba(15, 23, 42, 0.7);
          color: white;
        }

        .ep-img-tag.new {
          background: rgba(16, 185, 129, 0.85);
          color: white;
        }

        .ep-img-remove {
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

        .ep-img-item:hover .ep-img-remove {
          opacity: 1;
        }

        .ep-img-remove:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .ep-img-add {
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
          gap: 6px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s ease;
          padding: 0;
        }

        .ep-img-add:hover:not(:disabled) {
          border-color: #13795b;
          background: #f0faf6;
          color: #13795b;
        }

        .ep-img-add:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ep-img-add i {
          font-size: 20px;
        }

        /* ===== Add button - full state ===== */
        .ep-img-add.is-full {
          border-color: #fecaca;
          background: #fef2f2;
          color: #dc2626;
          cursor: not-allowed;
          opacity: 1;
        }

        .ep-img-add.is-full:hover {
          border-color: #fecaca;
          background: #fef2f2;
          color: #dc2626;
        }

        /* Empty State */
        .ep-img-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          border: 2px dashed #cbd5d1;
          border-radius: 14px;
          background: #f8fafc;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ep-img-empty:hover {
          border-color: #13795b;
          background: #f0faf6;
        }

        .ep-img-empty > i {
          font-size: 40px;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .ep-img-empty h4 {
          font-size: 15px;
          font-weight: 800;
          color: #334155;
          margin: 0 0 4px 0;
          font-family: "Manrope", sans-serif;
        }

        .ep-img-empty p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }

        .ep-img-hint {
          font-size: 11.5px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ep-img-hint i {
          color: #13795b;
        }

        /* ============================================================
           Toggle
           ============================================================ */
        .ep-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #f1f5f7;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ep-toggle-row:hover {
          border-color: #13795b;
          background: #f0faf6;
        }

        .ep-toggle-info {
          flex: 1;
          min-width: 0;
        }

        .ep-toggle-label {
          font-size: 13.5px;
          font-weight: 700;
          color: #0b1f18;
          margin-bottom: 3px;
        }

        .ep-toggle-hint {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .ep-toggle {
          position: relative;
          width: 52px;
          height: 28px;
          border-radius: 50px;
          flex-shrink: 0;
          transition: background 0.25s ease;
        }

        .ep-toggle.on {
          background: #13795b;
        }

        .ep-toggle.off {
          background: #cbd5d1;
        }

        .ep-toggle-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          margin: 0;
          z-index: 2;
        }

        .ep-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ep-toggle.on .ep-toggle-knob {
          left: 27px;
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
          font-size: 12.5px;
          min-height: 38px;
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

          .ep-grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ep-img-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
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
          .ep-grid-2,
          .ep-grid-3 {
            grid-template-columns: 1fr;
          }

          .ep-img-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ep-card-title {
            font-size: 14px;
          }

          .ep-card-sub {
            font-size: 11.5px;
            padding-left: 0;
          }

          .ep-toggle-row {
            padding: 14px;
            gap: 12px;
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

          .ep-img-grid {
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
  step,
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
          step={step}
          className="ep-input"
        />
      )}

      {hint && <div className="ep-hint">{hint}</div>}
    </div>
  );
}