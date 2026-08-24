// src/app/products/new/page.js
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import RichTextEditor from "@/components/ui/RichTextEditor";
import CountrySelect from "@/components/ui/CountrySelect";
import CategorySelect from "@/components/ui/CategorySelect";
import { getCountryName } from "@/lib/countries";

export default function NewProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====== فرم دیتا ======
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subCategory: "",
    shortDesc: "",
    fullDesc: "",
    price: "",
    currency: "USD",
    unit: "kg",
    moq: "",
    stock: "",
    leadTime: "",
    images: [], // array of base64 strings
    specs: [{ attribute: "", value: "" }],
    shippingTerms: "",
    packaging: "",
    certifications: "",
    origin: "",
    countryCode: "",
    isVisible: true,
  });

  // ====== تغییرات فیلدها ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value, subCategory: "" }));
  };
  const handleSubCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, subCategory: value }));
  };
  // ====== تغییرات Full Description (Rich Text) ======
  const handleFullDescChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, fullDesc: value }));
  }, []);

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specs];
    newSpecs[index][field] = value;
    setFormData((prev) => ({ ...prev, specs: newSpecs }));
  };

  const addSpecRow = () => {
    setFormData((prev) => ({
      ...prev,
      specs: [...prev.specs, { attribute: "", value: "" }],
    }));
  };

  const removeSpecRow = (index) => {
    if (formData.specs.length > 1) {
      const newSpecs = [...formData.specs];
      newSpecs.splice(index, 1);
      setFormData((prev) => ({ ...prev, specs: newSpecs }));
    }
  };

  // ====== تصاویر ======
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

  // ====== مرحله بعد ======
  const handleNextStep = () => {
    // اعتبارسنجی مرحله اول
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

  // ====== ارسال فرم ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // تبدیل specs به object
      const specsObj = formData.specs.reduce((acc, { attribute, value }) => {
        if (attribute && value) {
          acc[attribute] = value;
        }
        return acc;
      }, {});

      const payload = {
        name: formData.name,
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        shortDesc: formData.shortDesc,
        fullDesc: formData.fullDesc || undefined,
        price: parseFloat(formData.price),
        currency: formData.currency,
        unit: formData.unit,
        moq: parseInt(formData.moq),
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        images: formData.images,
        badge: undefined, // کاربر می‌تواند بعداً اضافه کند
        country: undefined, // از کاربر گرفته نمی‌شود
        countryCode: formData.countryCode,
        origin: formData.origin || undefined,
        certifications: formData.certifications || undefined,
        packaging: formData.packaging || undefined,
        shippingTerms: formData.shippingTerms || undefined,
        isVisible: formData.isVisible,
        specs: specsObj,
      };
      // console.log(origin, countryCode, "country,countryCode");
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      router.push(`/products/${data.productNumber}/${data.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== اگر کاربر لاگین نیست ======
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
                  onCategoryChange={handleCategoryChange}
                  onSubCategoryChange={handleSubCategoryChange}
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
                    className="form-control"
                    name="moq"
                    placeholder="100"
                    value={formData.moq}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Available Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    name="stock"
                    placeholder="1000"
                    value={formData.stock}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Lead Time (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="leadTime"
                    placeholder="7"
                    value={formData.leadTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h3 className="fw-bold mt-4 mb-3">
                <i
                  className="fas fa-images me-2"
                  style={{ color: "var(--primary)" }}
                ></i>
                Product Images
              </h3>

              <div className="form-group">
                <label>Product Images</label>
                <div
                  className="image-upload-area"
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Drag &amp; drop images here or click to browse</p>
                  <button type="button" className="btn btn-secondary">
                    <i className="fas fa-folder-open"></i> Choose Files
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
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

              <div className="form-group">
                <label>Add product specifications</label>
                <div className="spec-table-wrapper">
                  <table className="spec-table">
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        <th>Value</th>
                        <th style={{ textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.specs.map((spec, index) => (
                        <tr key={index}>
                          <td className="spec-label">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., Origin"
                              value={spec.attribute}
                              onChange={(e) =>
                                handleSpecChange(
                                  index,
                                  "attribute",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="spec-value">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., Colombia"
                              value={spec.value}
                              onChange={(e) =>
                                handleSpecChange(index, "value", e.target.value)
                              }
                            />
                          </td>
                          <td className="spec-actions">
                            <button
                              type="button"
                              className="btn-sm btn-sm-danger"
                              onClick={() => removeSpecRow(index)}
                              disabled={formData.specs.length <= 1}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary mt-2"
                  onClick={addSpecRow}
                >
                  <i className="fas fa-plus"></i> Add Specification
                </button>
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
                  <select
                    className="form-select"
                    name="shippingTerms"
                    value={formData.shippingTerms}
                    onChange={handleChange}
                  >
                    <option value="">Select shipping terms</option>
                    <option>FOB (Free On Board)</option>
                    <option>CIF (Cost, Insurance, Freight)</option>
                    <option>EXW (Ex Works)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Packaging</label>
                  <input
                    type="text"
                    className="form-control"
                    name="packaging"
                    placeholder="e.g., 20kg GrainPro bags"
                    value={formData.packaging}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Certifications</label>
                  <input
                    type="text"
                    className="form-control"
                    name="certifications"
                    placeholder="e.g., USDA Organic, Fair Trade"
                    value={formData.certifications}
                    onChange={handleChange}
                  />
                  <div className="help-text">Separate with commas</div>
                </div>
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
    </div>
  );
}
