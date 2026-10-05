// src/app/(public)/requests/new/page.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import CountrySelect from "@/components/ui/CountrySelect";
import CategorySelect from "@/components/ui/CategorySelect";
import SupplierCountrySelect from "@/components/ui/SupplierCountrySelect";
import VocabularySelect from "@/components/ui/VocabularySelect";
import { getCountryName } from "@/lib/countries";

export default function NewRequestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====== Form data ======
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subCategory: "",
    description: "",
    quantity: "",
    unit: "kg",
    budgetRange: "",
    currency: "USD",
    deadline: "",
    deliveryCountry: "",
    deliveryCountryCode: "",
    shippingTerms: "",
    packagingReq: "",
    certifications: "",
    paymentTerms: "",
    targetPrice: "",
    isPriceNegotiable: true,
    supplierCountries: ["WORLDWIDE"],
    attachments: [],
    isUrgent: false,
    isVisible: true,
  });

  // ====== Field changes ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // ====== Category changes ======
  const handleCategoryChange = (category) => {
    setFormData((prev) => ({
      ...prev,
      category,
      subCategory: "",
      productType: "",
    }));
  };

  const handleSubCategoryChange = (sub) => {
    setFormData((prev) => ({
      ...prev,
      subCategory: sub || "",
      productType: "",
    }));
  };

  const handleProductTypeChange = (pt) => {
    setFormData((prev) => ({ ...prev, productType: pt || "" }));
  };

  // ====== Supplier country changes ======
  const handleSupplierCountriesChange = (countries) => {
    setFormData((prev) => ({ ...prev, supplierCountries: countries }));
  };

  // ====== Image upload with progress ======
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const uploadedPaths = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFileWithProgress(
          file,
          "requests",
          (percent) => setUploadProgress(percent),
        );
        uploadedPaths.push(result.path);
      }
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedPaths],
      }));
      toast.success(`${uploadedPaths.length} file(s) uploaded successfully!`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file(s)");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // ====== Toggle ======
  const toggleUrgent = () => {
    setFormData((prev) => ({ ...prev, isUrgent: !prev.isUrgent }));
  };

  const toggleVisibility = () => {
    setFormData((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  };

  // ====== Next step ======
  const handleNextStep = () => {
    const errors = [];
    if (!formData.title?.trim()) errors.push("Please enter a request title");
    if (!formData.category) errors.push("Please select a category");
    if (!formData.description?.trim()) errors.push("Please enter a description");
    if (!formData.quantity || parseInt(formData.quantity) <= 0)
      errors.push("Please enter a valid quantity (greater than 0)");
    if (!formData.deliveryCountry)
      errors.push("Please select a delivery location (country)");

    if (errors.length > 0) {
      toast.warning(errors.join(". "));
      return;
    }
    setError("");
    setStep(2);
  };

  const handlePrevStep = () => setStep(1);

  // ====== Submit the form ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        description: formData.description.trim(),
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        budgetRange: formData.budgetRange || undefined,
        currency: formData.currency,
        deadline: formData.deadline || undefined,
        deliveryCountry: formData.deliveryCountry,
        shippingTerms: formData.shippingTerms || undefined,
        packagingReq: formData.packagingReq || undefined,
        certifications: formData.certifications || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        targetPrice: formData.isPriceNegotiable
          ? null
          : parseFloat(formData.targetPrice) || null,
        isPriceNegotiable: formData.isPriceNegotiable,
        supplierCountries: formData.supplierCountries,
        attachments: formData.attachments,
        isUrgent: formData.isUrgent,
        isVisible: formData.isVisible,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create buying request");
      }

      toast.success(
        "Request submitted for approval. You will be notified once approved.",
      );
      router.push("/dashboard/requests");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== If the user is not logged in ======
  if (status === "loading") {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container py-4">
      <div className="form-container">
        {/* ====== HEADER ====== */}
        <div className="form-header">
          <h1>
            <i className="fas fa-file-alt"></i> Post Buying Request
          </h1>
          <div className="step-indicator">
            <span className="step-label">Step {step} of 2</span>
            <span className={`step-dot ${step === 1 ? "active" : "done"}`}></span>
            <span className={`step-dot ${step === 2 ? "active" : ""}`}></span>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ====== STEP 1 ====== */}
          {step === 1 && (
            <>
              <h3 className="fw-bold mb-3">
                <i className="fas fa-info-circle me-2" style={{ color: "var(--primary)" }}></i>
                Request Details
              </h3>

              <div className="form-group">
                <label>
                  Request Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  placeholder="e.g., Organic Raw Honey · 2000 Jars Monthly"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                <div className="help-text">
                  Clear and specific title helps suppliers find your request.
                </div>
              </div>

              <div className="form-row">
                <CategorySelect
                  categoryValue={formData.category}
                  subCategoryValue={formData.subCategory}
                  productTypeValue={formData.productType}
                  onCategoryChange={handleCategoryChange}
                  onSubCategoryChange={handleSubCategoryChange}
                  onProductTypeChange={handleProductTypeChange}
                  categoryRequired
                />
              </div>

              <div className="form-group mt-3">
                <label>
                  Description <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="description"
                  maxLength={2000}
                  placeholder="Describe what you are looking for in detail."
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
                <div className="help-text">
                  Provide as much detail as possible to attract the right suppliers.
                </div>
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i className="fas fa-tag me-2" style={{ color: "var(--primary)" }}></i>
                Quantity &amp; Pricing
              </h3>

              {/* Quantity + Unit + Currency */}
              <div className="form-row-3">
                <div className="form-group">
                  <label>
                    Quantity <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    name="quantity"
                    placeholder="2000"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <div className="help-text">
                    How much you want to buy, in the unit selected below.
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    Unit <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pieces">pieces</option>
                    <option value="boxes">boxes</option>
                    <option value="pallets">pallets</option>
                    <option value="containers">containers</option>
                    <option value="metric_tons">Metric Tons</option>
                    <option value="20ft_container">20-Foot Container</option>
                    <option value="40ft_container">40-Foot Container</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    className="form-select"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Target Price + Negotiabl + Budget Range + Deadline */}
              <div className="form-row-3">
                <div className="form-group">
                  <label>Target Price</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-control"
                    name="targetPrice"
                    step="0.01"
                    placeholder={formData.isPriceNegotiable ? "Negotiable" : "e.g. 6.50"}
                    value={formData.targetPrice}
                    onChange={handleChange}
                    disabled={formData.isPriceNegotiable}
                    style={{
                      background: formData.isPriceNegotiable ? "#f5f5f5" : "#fff",
                      color: formData.isPriceNegotiable ? "var(--gray)" : "var(--black)",
                    }}
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="isPriceNegotiable"
                      checked={formData.isPriceNegotiable}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          isPriceNegotiable: e.target.checked,
                          targetPrice: e.target.checked ? "" : prev.targetPrice,
                        }));
                      }}
                      style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                    />
                    Price is negotiable
                  </label>
                </div>

                <div className="form-group">
                  <label>Budget Range</label>
                  <select
                    className="form-select"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleChange}
                  >
                    <option value="">Select budget range</option>
                    <option>Under $1,000</option>
                    <option>$1,000 – $5,000</option>
                    <option>$5,000 – $10,000</option>
                    <option>$10,000 – $25,000</option>
                    <option>$25,000 – $50,000</option>
                    <option>$50,000 – $100,000</option>
                    <option>$100,000+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quote Deadline</label>
                  <input
                    type="date"
                    className="form-control"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="form-group mt-3">
                <label>Payment Terms</label>
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

              {/* Suppliers From */}
              <div className="form-group mt-3">
                <label>
                  Looking for Suppliers From{" "}
                  <span className="text-muted fw-normal">
                    (select multiple, or choose Worldwide)
                  </span>
                </label>
                <SupplierCountrySelect
                  value={formData.supplierCountries}
                  onChange={handleSupplierCountriesChange}
                />
              </div>

              {/* Delivery Location */}
              <div className="form-group mt-3">
                <label>
                  Delivery Location <span className="required">*</span>
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
                  required
                />
                <div className="help-text">
                  Where do you need the products delivered?
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                >
                  Next Step <i className="fas fa-arrow-right ms-2"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => toast.success("Draft saved successfully!")}
                >
                  <i className="fas fa-save"></i> Save as Draft
                </button>
                <Link href="/requests" className="btn btn-outline-secondary">
                  <i className="fas fa-times"></i> Cancel
                </Link>
              </div>
            </>
          )}

          {/* ====== STEP 2 ====== */}
          {step === 2 && (
            <>
              <h3 className="fw-bold mb-3">
                <i className="fas fa-ship me-2" style={{ color: "var(--primary)" }}></i>
                Shipping &amp; Additional Info
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Shipping Terms</label>
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
                <div className="form-group">
                  <label>Packaging Requirements</label>
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
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i className="fas fa-certificate me-2" style={{ color: "var(--primary)" }}></i>
                Certifications &amp; Requirements
              </h3>

              <div className="form-group">
                <label>Required Certifications</label>
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
                <div className="help-text">Separate with commas</div>
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i className="fas fa-paperclip me-2" style={{ color: "var(--primary)" }}></i>
                Attachments (Optional)
              </h3>

              <div className="form-group">
                <label>Upload supporting documents</label>
                <div
                  className="image-upload-area"
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Drag &amp; drop files here or click to browse</p>
                  <button type="button" className="btn btn-secondary">
                    <i className="fas fa-folder-open"></i> Choose Files
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <div className="help-text">
                    Accepted formats: JPG, PNG, WEBP. Max 5MB each.
                  </div>
                </div>

                <UploadProgress progress={uploadProgress} label="Uploading images..." />

                <div className="image-preview d-flex flex-wrap gap-2 mt-2">
                  {formData.attachments.map((img, index) => (
                    <div
                      key={index}
                      className="position-relative"
                      style={{ width: "80px", height: "80px" }}
                    >
                      <img
                        src={img}
                        alt={`Attachment ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid var(--gray-light)",
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-1"
                        style={{ width: "24px", height: "24px", fontSize: "12px" }}
                        onClick={() => removeAttachment(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i className="fas fa-sliders-h me-2" style={{ color: "var(--primary)" }}></i>
                Settings
              </h3>

              <div className="form-group">
                <div className="toggle-group mb-3">
                  <div
                    className={`toggle ${formData.isUrgent ? "active" : ""}`}
                    onClick={toggleUrgent}
                  >
                    <div className="toggle-knob"></div>
                  </div>
                  <span className="toggle-label">
                    {formData.isUrgent ? "Mark as Urgent" : "Normal"}
                  </span>
                </div>
                <div className="help-text">
                  Urgent requests get highlighted and priority attention from suppliers.
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-group">
                  <div
                    className={`toggle ${formData.isVisible ? "active" : ""}`}
                    onClick={toggleVisibility}
                  >
                    <div className="toggle-knob"></div>
                  </div>
                  <span className="toggle-label">
                    {formData.isVisible
                      ? "Request visible to suppliers"
                      : "Request hidden (draft)"}
                  </span>
                </div>
                <div className="help-text">
                  Toggle off to save as draft (hidden from marketplace).
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handlePrevStep}
                >
                  <i className="fas fa-arrow-left me-2"></i> Previous Step
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || isUploading}
                >
                  {loading ? "Publishing..." : "Publish Request"}
                  <i className="fas fa-paper-plane ms-2"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => toast.success("Draft saved successfully!")}
                >
                  <i className="fas fa-save"></i> Save as Draft
                </button>
                <Link href="/requests" className="btn btn-outline-secondary">
                  <i className="fas fa-times"></i> Cancel
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}