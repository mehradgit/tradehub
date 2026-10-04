// src/components/dashboard/EditRequestForm.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import CategorySelect from "@/components/ui/CategorySelect";
import CountrySelect from "@/components/ui/CountrySelect";
import SupplierCountrySelect from "@/components/ui/SupplierCountrySelect";
import VocabularySelect from "@/components/ui/VocabularySelect";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import { getCountryName } from "@/lib/countries";

export default function EditRequestForm({ request }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // ===== Form State =====
  const [formData, setFormData] = useState({
    title: request.title || "",
    category: request.category || "",
    subCategory: request.subCategory || "",
    productType: request.productType || "",
    description: request.description || "",
    quantity: request.quantity || "",
    unit: request.unit || "kg",
    budgetRange: request.budgetRange || "",
    currency: request.currency || "USD",
    deadline: request.deadline
      ? new Date(request.deadline).toISOString().split("T")[0]
      : "",
    deliveryCountry: request.deliveryCountry || "",
    deliveryCountryCode: request.deliveryCountryCode || "",
    shippingTerms: request.shippingTerms || "",
    packagingReq: request.packagingReq || "",
    certifications: request.certifications || "",
    paymentTerms: request.paymentTerms || "",
    targetPrice: request.targetPrice || "",
    isPriceNegotiable:
      request.isPriceNegotiable !== undefined
        ? request.isPriceNegotiable
        : true,
    supplierCountries: request.supplierCountries || ["WORLDWIDE"],
    isUrgent: request.isUrgent || false,
    isVisible:
      request.isVisible !== undefined ? request.isVisible : true,
  });

  // ===== Attachments State =====
  const [existingImages, setExistingImages] = useState(
    Array.isArray(request.attachments) ? request.attachments : []
  );
  const [newImages, setNewImages] = useState([]);

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategoryChange = (category) => {
    setFormData((prev) => ({
      ...prev,
      category: category || "",
      subCategory: "",
      productType: "",
    }));
  };

  const handleSubCategoryChange = (subCategory) => {
    setFormData((prev) => ({
      ...prev,
      subCategory: subCategory || "",
      productType: "",
    }));
  };

  const handleProductTypeChange = (productType) => {
    setFormData((prev) => ({
      ...prev,
      productType: productType || "",
    }));
  };
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
        const result = await uploadFileWithProgress(
          file,
          "requests",
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
      const allAttachments = [...existingImages, ...newImages];

      const payload = {
        ...formData,
        paymentTerms: formData.paymentTerms || null,
        targetPrice: formData.isPriceNegotiable
          ? null
          : parseFloat(formData.targetPrice) || null,
        isPriceNegotiable: formData.isPriceNegotiable,
        supplierCountries: formData.supplierCountries,
        attachments: allAttachments,
        quantity: parseInt(formData.quantity),
        deadline: formData.deadline || undefined,
      };

      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      toast.success("Request updated. Pending approval.");
      router.push("/dashboard/requests");
    } catch (error) {
      toast.error(error.message || "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  const totalImages = existingImages.length + newImages.length;
  const isEmpty = existingImages.length === 0 && newImages.length === 0;

  return (
    <>
      <div className="er-page">
        {/* ============================================================
           Header
           ============================================================ */}
        <div className="er-header">
          <div className="er-header-left">
            <Link href="/dashboard/requests" className="er-back-link">
              <i className="fas fa-arrow-left"></i>
              Back to Requests
            </Link>
            <h1>
              <i className="fas fa-pen"></i>
              Edit Buying Request
            </h1>
            <p>
              #{request.requestNumber} ·{" "}
              {request.title?.slice(0, 60) || "Untitled"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="er-form">
          {/* ============================================================
             SECTION 1: Request Details
             ============================================================ */}
          <section className="er-card">
            <div className="er-card-head">
              <h3 className="er-card-title">
                <i className="fas fa-info-circle"></i>
                Request Details
              </h3>
            </div>

            <Field
              label="Request Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Organic Raw Honey · 2000 Jars Monthly"
              required
              icon="fa-heading"
              hint="Clear and specific title helps suppliers find your request."
            />

            <div className="er-field">
              <label className="er-label">
                <i className="fas fa-tags"></i>
                Category
              </label>
              <CategorySelect
                categoryValue={formData.category}
                subCategoryValue={formData.subCategory}
                productTypeValue={formData.productType}
                onCategoryChange={handleCategoryChange}
                onSubCategoryChange={handleSubCategoryChange}
                onProductTypeChange={handleProductTypeChange}
                categoryRequired={true}
              />
            </div>

            <div className="er-field">
              <label className="er-label">
                <i className="fas fa-align-left"></i>
                Description
                <span className="er-label-meta">
                  {formData.description?.length || 0}/2000
                </span>
              </label>
              <textarea
                className="er-input"
                rows="5"
                name="description"
                maxLength={2000}
                placeholder="Describe what you are looking for in detail..."
                value={formData.description}
                onChange={handleChange}
                required
              />
              <div className="er-hint">
                Provide as much detail as possible to attract the right
                suppliers.
              </div>
            </div>
          </section>

          {/* ============================================================
             SECTION 2: Quantity & Pricing
             ============================================================ */}
          <section className="er-card">
            <div className="er-card-head">
              <h3 className="er-card-title">
                <i className="fas fa-tag"></i>
                Quantity & Pricing
              </h3>
            </div>

            <div className="er-grid-3">
              <Field
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                type="number"
                placeholder="2000"
                required
                icon="fa-cube"
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
                  "20ft_container",
                  "40ft_container",
                ]}
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
            </div>

            <div className="er-grid-3">
              {/* Target Price */}
              <div className="er-field">
                <label className="er-label">
                  <i className="fas fa-dollar-sign"></i>
                  Target Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="er-input"
                  name="targetPrice"
                  placeholder={
                    formData.isPriceNegotiable ? "Negotiable" : "e.g. 6.50"
                  }
                  value={formData.targetPrice}
                  onChange={handleChange}
                  disabled={formData.isPriceNegotiable}
                  style={{
                    background: formData.isPriceNegotiable ? "#f8fafc" : "white",
                    color: formData.isPriceNegotiable ? "#94a3b8" : "#0b1f18",
                  }}
                />
                <label className="er-checkbox-row">
                  <input
                    type="checkbox"
                    name="isPriceNegotiable"
                    checked={formData.isPriceNegotiable}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPriceNegotiable: e.target.checked,
                        targetPrice: e.target.checked ? "" : prev.targetPrice,
                      }))
                    }
                    className="er-checkbox-input"
                  />
                  <span className="er-checkbox-mark">
                    {formData.isPriceNegotiable && (
                      <i className="fas fa-check"></i>
                    )}
                  </span>
                  <span className="er-checkbox-label">
                    Price is negotiable
                  </span>
                </label>
              </div>

              {/* Budget Range */}
              <Field
                label="Budget Range"
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleChange}
                type="select"
                icon="fa-wallet"
                options={[
                  "Under $1,000",
                  "$1,000 – $5,000",
                  "$5,000 – $10,000",
                  "$10,000 – $25,000",
                  "$25,000 – $50,000",
                  "$50,000 – $100,000",
                  "$100,000+",
                ]}
              />

              {/* Deadline */}
              <Field
                label="Quote Deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                type="date"
                icon="fa-calendar-alt"
              />
            </div>

            <div className="er-field">
              <label className="er-label">
                <i className="fas fa-credit-card"></i>
                Payment Terms
              </label>
              <VocabularySelect
                vocabKey="paymentTerms"
                value={formData.paymentTerms}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, paymentTerms: v }))
                }
                allowCustom
                placeholder="Select payment term…"
              />
            </div>
          </section>

          {/* ============================================================
             SECTION 3: Suppliers From
             ============================================================ */}
          <section className="er-card">
            <div className="er-card-head">
              <h3 className="er-card-title">
                <i className="fas fa-globe"></i>
                Looking for Suppliers From
              </h3>
              <p className="er-card-sub">
                Select multiple countries, or choose Worldwide
              </p>
            </div>

            <SupplierCountrySelect
              value={formData.supplierCountries}
              onChange={(countries) =>
                setFormData((prev) => ({
                  ...prev,
                  supplierCountries: countries,
                }))
              }
            />
          </section>

          {/* ============================================================
             SECTION 4: Delivery & Shipping
             ============================================================ */}
          <section className="er-card">
            <div className="er-card-head">
              <h3 className="er-card-title">
                <i className="fas fa-ship"></i>
                Delivery & Shipping
              </h3>
            </div>

            <div className="er-grid-2">
              <div className="er-field">
                <label className="er-label">
                  <i className="fas fa-map-pin"></i>
                  Delivery Location
                  <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <CountrySelect
                  value={formData.deliveryCountryCode}
                  onChange={(code) => {
                    const name = getCountryName(code);
                    setFormData((prev) => ({
                      ...prev,
                      deliveryCountry: name,
                      deliveryCountryCode: code,
                    }));
                  }}
                  placeholder="Select delivery country"
                />
                <div className="er-hint">
                  Where do you need the products delivered?
                </div>
              </div>

              <div className="er-field">
                <label className="er-label">
                  <i className="fas fa-truck"></i>
                  Shipping Terms
                </label>
                <VocabularySelect
                  vocabKey="incoterms"
                  value={formData.shippingTerms}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, shippingTerms: v }))
                  }
                  allowCustom
                  placeholder="Select delivery term…"
                />
              </div>

              <div className="er-field">
                <label className="er-label">
                  <i className="fas fa-box-open"></i>
                  Packaging Requirements
                </label>
                <VocabularySelect
                  vocabKey="packagingTypes"
                  value={formData.packagingReq}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, packagingReq: v }))
                  }
                  multiple
                  allowCustom
                  placeholder="Select packaging type…"
                  addPlaceholder="Add custom packaging…"
                />
              </div>

              <div className="er-field">
                <label className="er-label">
                  <i className="fas fa-certificate"></i>
                  Required Certifications
                </label>
                <VocabularySelect
                  vocabKey="certifications"
                  value={formData.certifications}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, certifications: v }))
                  }
                  multiple
                  allowCustom
                  placeholder="Select certification…"
                  addPlaceholder="Add custom certification…"
                />
                <div className="er-hint">Separate with commas</div>
              </div>
            </div>
          </section>

          {/* ============================================================
             SECTION 5: Attachments
             ============================================================ */}
          <section className="er-card">
            <div className="er-card-head">
              <h3 className="er-card-title">
                <i className="fas fa-images"></i>
                Attachments
                <span className="er-count-badge">{totalImages}</span>
              </h3>
              <p className="er-card-sub">
                Optional: add reference images or specification files
              </p>
            </div>

            {!isEmpty ? (
              <div className="er-img-grid">
                {existingImages.map((img, i) => (
                  <div key={`ex-${i}`} className="er-img-item">
                    <img src={img} alt={`Existing ${i + 1}`} />
                    <span className="er-img-tag existing">Existing</span>
                    <button
                      type="button"
                      className="er-img-remove"
                      onClick={() => removeExistingImage(i)}
                      aria-label="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}

                {newImages.map((img, i) => (
                  <div key={`nw-${i}`} className="er-img-item is-new">
                    <img src={img} alt={`New ${i + 1}`} />
                    <span className="er-img-tag new">New</span>
                    <button
                      type="button"
                      className="er-img-remove"
                      onClick={() => removeNewImage(i)}
                      aria-label="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="er-img-add"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="er-spinner-small" />
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
                className="er-img-empty"
                onClick={() => fileInputRef.current.click()}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                <h4>No attachments yet</h4>
                <p>Click to upload reference images (optional)</p>
                <button
                  type="button"
                  className="er-btn er-btn-primary er-btn-sm"
                >
                  <i className="fas fa-folder-open"></i>
                  Choose Files
                </button>
              </div>
            )}

            <UploadProgress
              progress={uploadProgress}
              label="Uploading..."
            />

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />

            <div className="er-img-hint">
              <i className="fas fa-info-circle"></i>
              Max 5MB each · JPG, PNG, WEBP
            </div>
          </section>

          {/* ============================================================
             SECTION 6: Settings
             ============================================================ */}
          <section className="er-card">
            <div className="er-card-head">
              <h3 className="er-card-title">
                <i className="fas fa-sliders-h"></i>
                Settings
              </h3>
            </div>

            {/* Urgent */}
            <label className="er-toggle-row">
              <div className="er-toggle-info">
                <div className="er-toggle-label">
                  {formData.isUrgent ? "Mark as Urgent" : "Normal Priority"}
                </div>
                <div className="er-toggle-hint">
                  Urgent requests get highlighted and priority attention from
                  suppliers.
                </div>
              </div>
              <div
                className={`er-toggle ${formData.isUrgent ? "on" : "off"}`}
              >
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="er-toggle-input"
                />
                <div className="er-toggle-knob" />
              </div>
            </label>

            {/* Visible */}
            <label className="er-toggle-row">
              <div className="er-toggle-info">
                <div className="er-toggle-label">
                  {formData.isVisible
                    ? "Request visible to suppliers"
                    : "Request hidden (draft)"}
                </div>
                <div className="er-toggle-hint">
                  Toggle off to save as draft. Note: request needs admin
                  approval before going live.
                </div>
              </div>
              <div
                className={`er-toggle ${formData.isVisible ? "on" : "off"}`}
              >
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={formData.isVisible}
                  onChange={handleChange}
                  className="er-toggle-input"
                />
                <div className="er-toggle-knob" />
              </div>
            </label>
          </section>

          {/* ============================================================
             Sticky Save Bar
             ============================================================ */}
          <div className="er-save-bar">
            <div className="er-save-info">
              <i className="fas fa-info-circle"></i>
              <span>Changes are pending admin approval</span>
            </div>
            <div className="er-save-actions">
              <Link
                href="/dashboard/requests"
                className="er-btn er-btn-ghost"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="er-btn er-btn-primary"
                disabled={loading || uploading}
              >
                {loading ? (
                  <>
                    <span className="er-spinner-small" />
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
        .er-page {
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
        .er-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .er-header-left {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .er-back-link {
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

        .er-back-link:hover {
          color: #13795b;
        }

        .er-back-link i {
          font-size: 11px;
        }

        .er-header-left h1 {
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

        .er-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .er-header-left p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          word-wrap: break-word;
        }

        /* ============================================================
           Form
           ============================================================ */
        .er-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ============================================================
           Card
           ============================================================ */
        .er-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .er-card-head {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f5f7;
        }

        .er-card-title {
          font-size: 15px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .er-card-title i {
          color: #13795b;
          background: #eaf7f1;
          padding: 6px;
          border-radius: 8px;
          font-size: 12px;
        }

        .er-card-sub {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0;
          padding-left: 36px;
        }

        .er-count-badge {
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

        /* ============================================================
           Grids
           ============================================================ */
        .er-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .er-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        /* ============================================================
           Fields
           ============================================================ */
        :global(.er-field) {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        :global(.er-label) {
          font-size: 12.5px;
          font-weight: 700;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        :global(.er-label i) {
          color: #13795b;
          font-size: 11px;
          width: 14px;
          text-align: center;
        }

        :global(.er-label-meta) {
          margin-left: auto;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        :global(.er-input) {
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

        :global(.er-input:focus) {
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }

        :global(.er-input::placeholder) {
          color: #94a3b8;
        }

        :global(.er-input:disabled) {
          cursor: not-allowed;
        }

        :global(textarea.er-input) {
          resize: vertical;
          min-height: 120px;
          line-height: 1.55;
        }

        :global(.er-hint) {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* ============================================================
           Custom Checkbox
           ============================================================ */
        .er-checkbox-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          user-select: none;
        }

        .er-checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .er-checkbox-mark {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid #cbd5d1;
          background: white;
          display: grid;
          place-items: center;
          color: white;
          font-size: 9px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .er-checkbox-input:checked + .er-checkbox-mark {
          background: #13795b;
          border-color: #13795b;
        }

        .er-checkbox-label {
          flex: 1;
        }

        /* ============================================================
           Images
           ============================================================ */
        .er-img-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .er-img-item {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e8edf0;
          background: #f5f8f6;
          transition: all 0.2s ease;
        }

        .er-img-item.is-new {
          border-color: #a7f3d0;
          border-style: dashed;
        }

        .er-img-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .er-img-item:hover {
          border-color: #13795b;
          box-shadow: 0 8px 20px rgba(19, 121, 91, 0.12);
        }

        .er-img-tag {
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

        .er-img-tag.existing {
          background: rgba(15, 23, 42, 0.7);
          color: white;
        }

        .er-img-tag.new {
          background: rgba(16, 185, 129, 0.85);
          color: white;
        }

        .er-img-remove {
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

        .er-img-item:hover .er-img-remove {
          opacity: 1;
        }

        .er-img-remove:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .er-img-add {
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

        .er-img-add:hover:not(:disabled) {
          border-color: #13795b;
          background: #f0faf6;
          color: #13795b;
        }

        .er-img-add:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .er-img-add i {
          font-size: 20px;
        }

        /* Empty State */
        .er-img-empty {
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

        .er-img-empty:hover {
          border-color: #13795b;
          background: #f0faf6;
        }

        .er-img-empty > i {
          font-size: 40px;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .er-img-empty h4 {
          font-size: 15px;
          font-weight: 800;
          color: #334155;
          margin: 0 0 4px 0;
          font-family: "Manrope", sans-serif;
        }

        .er-img-empty p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }

        .er-img-hint {
          font-size: 11.5px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .er-img-hint i {
          color: #13795b;
        }

        /* ============================================================
           Toggle
           ============================================================ */
        .er-toggle-row {
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

        .er-toggle-row:hover {
          border-color: #13795b;
          background: #f0faf6;
        }

        .er-toggle-info {
          flex: 1;
          min-width: 0;
        }

        .er-toggle-label {
          font-size: 13.5px;
          font-weight: 700;
          color: #0b1f18;
          margin-bottom: 3px;
        }

        .er-toggle-hint {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .er-toggle {
          position: relative;
          width: 52px;
          height: 28px;
          border-radius: 50px;
          flex-shrink: 0;
          transition: background 0.25s ease;
        }

        .er-toggle.on {
          background: #13795b;
        }

        .er-toggle.off {
          background: #cbd5d1;
        }

        .er-toggle-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          margin: 0;
          z-index: 2;
        }

        .er-toggle-knob {
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

        .er-toggle.on .er-toggle-knob {
          left: 27px;
        }

        /* ============================================================
           Buttons
           ============================================================ */
        :global(.er-btn) {
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

        :global(.er-btn:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }

        :global(.er-btn-primary) {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
        }

        :global(.er-btn-primary:hover:not(:disabled)) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        :global(.er-btn-ghost) {
          background: white;
          color: #334155;
          border-color: #e8edf0;
        }

        :global(.er-btn-ghost:hover:not(:disabled)) {
          border-color: #13795b;
          color: #13795b;
          background: #f0faf6;
        }

        :global(.er-btn-sm) {
          padding: 8px 14px;
          font-size: 12.5px;
          min-height: 38px;
        }

        .er-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: erSpin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes erSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ============================================================
           Sticky Save Bar
           ============================================================ */
        .er-save-bar {
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

        .er-save-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #64748b;
          font-weight: 600;
        }

        .er-save-info i {
          color: #13795b;
          font-size: 14px;
        }

        .er-save-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 768px) {
          .er-header-left h1 {
            font-size: 20px;
          }

          .er-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          .er-card {
            padding: 18px;
            border-radius: 16px;
          }

          .er-grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .er-img-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .er-save-bar {
            padding: 12px 16px;
            bottom: 8px;
          }

          .er-save-info {
            display: none;
          }

          .er-save-actions {
            width: 100%;
          }

          :global(.er-save-actions .er-btn) {
            flex: 1;
          }
        }

        @media (max-width: 600px) {
          .er-grid-2,
          .er-grid-3 {
            grid-template-columns: 1fr;
          }

          .er-img-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .er-card-title {
            font-size: 14px;
          }

          .er-card-sub {
            font-size: 11.5px;
            padding-left: 0;
          }

          .er-toggle-row {
            padding: 14px;
            gap: 12px;
          }
        }

        @media (max-width: 400px) {
          .er-page {
            gap: 16px;
          }

          .er-header-left h1 {
            font-size: 18px;
          }

          .er-card {
            padding: 16px;
          }

          .er-img-grid {
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
    <div className="er-field">
      <label className="er-label">
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
          className="er-input"
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
          className="er-input"
        />
      )}

      {hint && <div className="er-hint">{hint}</div>}
    </div>
  );
}