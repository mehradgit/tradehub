// src/app/(public)/products/new/page.js
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import RichTextEditor from "@/components/ui/RichTextEditor";
import CountrySelect from "@/components/ui/CountrySelect";
import CategorySelect from "@/components/ui/CategorySelect";
import VocabularySelect from "@/components/ui/VocabularySelect";
import ProductAttributesFields from "@/components/product/ProductAttributesFields";
import { getCountryName } from "@/lib/countries";
import { useCategories } from "@/hooks/useCategories";
import { resolveCategoryPath } from "@/lib/categoryTree";
import { attributesMapToArray } from "@/lib/attributeValues";
import { toast } from "react-toastify";

export default function NewProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====== Image limit from plan ======
  // null = not loaded yet | -1 = unlimited | n = a number
  const [imageLimit, setImageLimit] = useState(null);

  // ====== Form data ======
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subCategory: "",
    productType: "",
    shortDesc: "",
    fullDesc: "",
    price: "",
    currency: "USD",
    unit: "kg",
    moq: "",
    stock: "",
    leadTime: "",
    images: [], // array of base64 strings
    // ====== Dynamic attributes (EAV) ======
    // { [attributeId]: value } — replaces the previous key/value list
    attributes: {},
    shippingTerms: "",
    packaging: "",
    certifications: "",
    paymentTerms: "",
    origin: "",
    countryCode: "",
    isVisible: true,
  });

  // ====== Category path for the dynamic attributes panel ======
  // Example: "grains-cereals/rice/basmati"
  const { tree } = useCategories();

  const categoryPath = useMemo(
    () =>
      resolveCategoryPath(
        {
          category: formData.category,
          subCategory: formData.subCategory,
          productType: formData.productType,
        },
        tree,
      ),
    [formData.category, formData.subCategory, formData.productType, tree],
  );

  // ====== Field change handlers ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    // Changing the category changes the attributes; previous values must be cleared
    setFormData((prev) => ({
      ...prev,
      category: value,
      subCategory: "",
      productType: "",
      attributes: {},
    }));
  };

  const handleSubCategoryChange = (value) => {
    // Attributes depend on the category → reset
    setFormData((prev) => ({
      ...prev,
      subCategory: value,
      productType: "",
      attributes: {},
    }));
  };

  const handleProductTypeChange = (value) => {
    // Attributes also depend on the product type → reset
    setFormData((prev) => ({ ...prev, productType: value, attributes: {} }));
  };

  const handleFullDescChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, fullDesc: value }));
  }, []);

  // ====== Images ======
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = [...formData.images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          newImages.push(ev.target.result);
          setFormData((prev) => ({ ...prev, images: newImages }));
        };
        reader.readAsDataURL(file);
      }
    }
    fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  // ====== Toggle ======
  const toggleVisibility = () => {
    setFormData((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  };

  // ====== Next step ======
  const handleNextStep = () => {
    if (
      !formData.name ||
      !formData.category ||
      !formData.shortDesc ||
      !formData.price ||
      !formData.moq
    ) {
      setError("Please fill in all required fields");
      return;
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      setError("Please enter a valid price");
      return;
    }
    if (isNaN(parseInt(formData.moq)) || parseInt(formData.moq) <= 0) {
      setError("Please enter a valid MOQ");
      return;
    }
    setError("");
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  // ====== Form submission ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        productType: formData.productType || undefined,
        shortDesc: formData.shortDesc,
        fullDesc: formData.fullDesc || undefined,
        price: parseFloat(formData.price),
        currency: formData.currency,
        unit: formData.unit,
        moq: parseInt(formData.moq),
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        images: formData.images,
        badge: undefined,
        country: undefined,
        countryCode: formData.countryCode,
        origin: formData.origin || undefined,
        certifications: formData.certifications || undefined,
        packaging: formData.packaging || undefined,
        shippingTerms: formData.shippingTerms || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        isVisible: formData.isVisible,
        // ====== Dynamic attributes: map → [{ attributeId, value }] ======
        attributes: attributesMapToArray(formData.attributes),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      toast.success(
        "Product submitted for approval. You will be notified once approved.",
      );
      router.push("/dashboard/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== Fetch image limit from plan ======
  useEffect(() => {
    if (status !== "authenticated") return;

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
  }, [status]);

  // ====== If the user is not logged in ======
  if (status === "loading") {
    return (
      <Layout>
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }
  if (!session) {
    router.push("/login");
    return null;
  }

  // ===== Image limit calculations =====
  const currentImageCount = formData.images.length;
  const isUnlimited = imageLimit === -1;
  const isLimitKnown = imageLimit !== null && imageLimit !== -1;
  const remainingSlots = isLimitKnown
    ? Math.max(0, imageLimit - currentImageCount)
    : Infinity;
  const isImageFull = isLimitKnown && currentImageCount >= imageLimit;

  return (
    <div className="container py-4">
      <div className="form-container">
        {/* ====== HEADER ====== */}
        <div className="form-header">
          <h1>
            <i className="fas fa-plus-circle"></i> Add New Product
          </h1>
          <div className="step-indicator">
            <span className="step-label" id="stepLabel">
              Step {step} of 2
            </span>
            <span
              className={`step-dot ${step === 1 ? "active" : "done"}`}
            ></span>
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
                <i
                  className="fas fa-info-circle me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Basic Information
              </h3>

              <div className="form-group">
                <label>
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  placeholder="e.g., Organic Arabica Coffee Beans"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
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

              <div className="form-group">
                <label>
                  Short Description <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="shortDesc"
                  placeholder="Brief description (max 200 characters)"
                  value={formData.shortDesc}
                  onChange={handleChange}
                  required
                ></textarea>
                <div className="help-text">
                  This will appear in search results and product listings.
                </div>
              </div>

              <div className="form-group">
                <label>Full Description</label>
                <RichTextEditor
                  value={formData.fullDesc}
                  onChange={handleFullDescChange}
                  placeholder="Detailed description including origin, processing, certifications, etc."
                  height={250}
                />
                <div className="help-text">
                  Full description of the product. It is shown on the product
                  page, so add all the details a buyer needs.
                </div>
                <small className="text-muted">
                  Use the toolbar to format your text (bold, italic, lists,
                  links, etc.)
                </small>
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i
                  className="fas fa-tag me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Pricing &amp; Inventory
              </h3>

              <div className="form-row-3">
                <div className="form-group">
                  <label>
                    Price (per unit) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-control"
                    name="price"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Currency <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
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
                    <option value="piece">piece</option>
                    <option value="box">box</option>
                  </select>
                  <div className="help-text">
                    Unit used for the price and the minimum order quantity.
                  </div>
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>
                    Minimum Order Quantity (MOQ){" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    name="moq"
                    placeholder="100"
                    value={formData.moq}
                    onChange={handleChange}
                    required
                  />
                  <div className="help-text">
                    Smallest quantity a buyer can order.
                  </div>
                </div>
                <div className="form-group">
                  <label>Available Stock</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    name="stock"
                    placeholder="1000"
                    value={formData.stock}
                    onChange={handleChange}
                  />
                  <div className="help-text">
                    How many units you have ready to sell.
                  </div>
                </div>
                <div className="form-group">
                  <label>Lead Time (days)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    name="leadTime"
                    placeholder="7"
                    value={formData.leadTime}
                    onChange={handleChange}
                  />
                  <div className="help-text">
                    How many days you need to get the order ready.
                  </div>
                </div>
              </div>

              {/* ============================================================
                  PRODUCT IMAGES - with a smart limit
                  ============================================================ */}
              <h3 className="fw-bold mt-4 mb-3">
                <i
                  className="fas fa-images me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Product Images
                {isUnlimited && (
                  <span className="np-count-badge">Unlimited</span>
                )}
                {isLimitKnown && (
                  <span
                    className={`np-count-badge ${isImageFull ? "is-full" : ""}`}
                  >
                    {currentImageCount}/{imageLimit}
                  </span>
                )}
              </h3>

              {/* ===== Limit Info ===== */}
              {isLimitKnown && (
                <div
                  className={`np-limit-info ${isImageFull ? "warning" : ""}`}
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
                        You can add <strong>{remainingSlots}</strong> more
                        image{remainingSlots !== 1 ? "s" : ""} (
                        {currentImageCount} of {imageLimit} used).
                      </>
                    )}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>Product Images</label>
                <div
                  className="image-upload-area"
                  onClick={() => {
                    if (!isImageFull) {
                      fileInputRef.current.click();
                    }
                  }}
                  style={{
                    cursor: isImageFull ? "not-allowed" : "pointer",
                    opacity: isImageFull ? 0.6 : 1,
                  }}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>
                    {isImageFull
                      ? "Image limit reached"
                      : "Drag & drop images here or click to browse"}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isImageFull}
                  >
                    {isImageFull ? (
                      <>
                        <i className="fas fa-lock me-1"></i> Limit Reached
                      </>
                    ) : (
                      <>
                        <i className="fas fa-folder-open"></i> Choose Files
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isImageFull}
                  />
                  <div className="help-text">
                    Accepted formats: JPG, PNG, WEBP. Max 5MB each.
                  </div>
                </div>
                <div className="image-preview">
                  {formData.images.map((img, index) => (
                    <div
                      key={index}
                      className="preview-item"
                      style={{ backgroundImage: `url(${img})` }}
                    >
                      <button
                        type="button"
                        className="remove-img"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
                  onClick={() => alert("Draft saved!")}
                >
                  <i className="fas fa-save"></i> Save as Draft
                </button>
                <Link href="/products" className="btn btn-outline-secondary">
                  <i className="fas fa-times"></i> Cancel
                </Link>
              </div>
            </>
          )}

          {/* ====== STEP 2 ====== */}
          {step === 2 && (
            <>
              <h3 className="fw-bold mb-3">
                <i
                  className="fas fa-table me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Technical Specifications
              </h3>

              {/* ============================================================
                  Technical specifications — fully dynamic based on the selected category
                  ============================================================ */}
              <div className="form-group">
                <label>Product specifications</label>
                <ProductAttributesFields
                  categoryPath={categoryPath}
                  values={formData.attributes}
                  onChange={(next) =>
                    setFormData((prev) => ({ ...prev, attributes: next }))
                  }
                />
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i
                  className="fas fa-ship me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Shipping &amp; Additional Info
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Shipping Terms</label>
                  <VocabularySelect
                    vocabKey="incoterms"
                    value={formData.shippingTerms}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, shippingTerms: v }))
                    }
                    allowCustom
                    placeholder="Select delivery term…"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <VocabularySelect
                    vocabKey="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, paymentTerms: v }))
                    }
                    allowCustom
                    placeholder="Select payment term…"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Packaging</label>
                  <VocabularySelect
                    vocabKey="packagingTypes"
                    value={formData.packaging}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, packaging: v }))
                    }
                    multiple
                    allowCustom
                    placeholder="Select packaging…"
                    addPlaceholder="e.g., 20kg GrainPro bags"
                  />
                </div>
                <div className="form-group">
                  <label>Certifications</label>
                  <VocabularySelect
                    vocabKey="certifications"
                    value={formData.certifications}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, certifications: v }))
                    }
                    multiple
                    allowCustom
                    placeholder="Select certifications…"
                    addPlaceholder="e.g., USDA Organic"
                  />
                  <div className="help-text">Separate with commas</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country of Origin</label>
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

              <h3 className="fw-bold mt-4 mb-3">
                <i
                  className="fas fa-sliders-h me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Visibility
              </h3>

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
                      ? "Product visible to buyers"
                      : "Product hidden (draft)"}
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
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Publish Product"}
                  <i className="fas fa-check-circle ms-2"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => alert("Draft saved!")}
                >
                  <i className="fas fa-save"></i> Save as Draft
                </button>
                <Link href="/products" className="btn btn-outline-secondary">
                  <i className="fas fa-times"></i> Cancel
                </Link>
              </div>
            </>
          )}
        </form>
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        /* ===== Count badge ===== */
        .np-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 8px;
          margin-left: 10px;
          background: #eaf7f1;
          color: #0b5b43;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
        }

        .np-count-badge.is-full {
          background: #fef2f2;
          color: #dc2626;
        }

        /* ===== Limit info message ===== */
        .np-limit-info {
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
          margin-bottom: 16px;
        }

        .np-limit-info i {
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 13px;
        }

        .np-limit-info strong {
          font-weight: 800;
          color: #0b1b18;
        }

        .np-limit-info.warning {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .np-limit-info.warning strong {
          color: #7f1d1d;
        }
      `}</style>
    </div>
  );
}