// src/components/dashboard/EditProductForm.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
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
  const fileInputRef = useRef(null);

  // ====== State فرم ======
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

  // ====== State تصاویر ======
  const [images, setImages] = useState(product.images || []);
  const [newImages, setNewImages] = useState([]);

  // ====== تغییرات فیلدهای عادی ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFullDescChange = (value) => {
    setFormData((prev) => ({ ...prev, fullDesc: value }));
  };

  // ====== تغییرات دسته‌بندی ======
  const handleCategoryChange = (category, subCategory) => {
    setFormData((prev) => ({
      ...prev,
      category: category,
      subCategory: subCategory || "",
    }));
  };

  // ====== تغییرات کشور ======
  // const handleCountryChange = (countryCode) => {
  //   setFormData((prev) => ({ ...prev, origin: countryCode }));
  // };

  // ====== آپلود تصاویر ======
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedPaths = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "products");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");

        uploadedPaths.push(data.path);
      }

      setNewImages((prev) => [...prev, ...uploadedPaths]);
      toast.success(`${uploadedPaths.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ====== حذف تصاویر ======
  const removeExistingImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeNewImage = (index) => {
    const newAtts = [...newImages];
    newAtts.splice(index, 1);
    setNewImages(newAtts);
  };

  // ====== ارسال فرم ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const allImages = [...images, ...newImages];

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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/dashboard/products");
    } catch (error) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow border-0 rounded-4 p-4 p-md-5">
      <form onSubmit={handleSubmit}>
        {/* ====== اطلاعات پایه ====== */}
        <h5 className="fw-bold mb-3">
          <i
            className="fas fa-info-circle me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Basic Information
        </h5>

        <div className="form-group mb-3">
          <label className="form-label fw-semibold">Product Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Category</label>
            <CategorySelect
              categoryValue={formData.category}
              subCategoryValue={formData.subCategory}
              onCategoryChange={(cat) => handleCategoryChange(cat, "")}
              onSubCategoryChange={(sub) =>
                handleCategoryChange(formData.category, sub)
              }
              categoryRequired={true}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Country of Origin</label>
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

        <div className="form-group mt-3">
          <label className="form-label fw-semibold">
            Short Description
            <span className="text-muted fw-normal"> (max 200 characters)</span>
          </label>
          <textarea
            className="form-control"
            rows="2"
            name="shortDesc"
            value={formData.shortDesc}
            onChange={handleChange}
            maxLength="200"
            required
          />
          <div className="text-end text-muted small mt-1">
            {formData.shortDesc?.length || 0}/200
          </div>
        </div>

        <div className="form-group mt-3">
          <label className="form-label fw-semibold">
            Full Description
            <span className="text-muted fw-normal"> (max 5000 characters)</span>
          </label>
          <RichTextEditor
            value={formData.fullDesc}
            onChange={handleFullDescChange}
            placeholder="Detailed description including origin, processing, certifications, etc."
            height={250}
          />
          <small className="text-muted">
            Use the toolbar to format your text (bold, italic, lists, links,
            etc.)
          </small>
          <div className="text-end text-muted small mt-1">
            {formData.fullDesc?.length || 0}/5000
          </div>
        </div>

        {/* ====== قیمت و موجودی ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i
            className="fas fa-tag me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Pricing & Inventory
        </h5>

        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Price</label>
            <input
              type="number"
              className="form-control"
              name="price"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Currency</label>
            <select
              className="form-select"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Unit</label>
            <input
              type="text"
              className="form-control"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">MOQ</label>
            <input
              type="number"
              className="form-control"
              name="moq"
              value={formData.moq}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Stock</label>
            <input
              type="number"
              className="form-control"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Lead Time (days)</label>
            <input
              type="number"
              className="form-control"
              name="leadTime"
              value={formData.leadTime}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ====== اطلاعات تکمیلی ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i
            className="fas fa-ship me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Shipping & Additional Info
        </h5>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Shipping Terms</label>
            <input
              type="text"
              className="form-control"
              name="shippingTerms"
              value={formData.shippingTerms}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Packaging</label>
            <input
              type="text"
              className="form-control"
              name="packaging"
              value={formData.packaging}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Certifications</label>
            <input
              type="text"
              className="form-control"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ====== تصاویر ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i
            className="fas fa-images me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Product Images
        </h5>

        {images.length > 0 && (
          <div className="mb-3">
            <label className="form-label fw-semibold">Current Images</label>
            <div className="d-flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid var(--gray-light)",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-1"
                    style={{ width: "24px", height: "24px", fontSize: "12px" }}
                    onClick={() => removeExistingImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newImages.length > 0 && (
          <div className="mb-3">
            <label className="form-label fw-semibold">New Images</label>
            <div className="d-flex flex-wrap gap-3">
              {newImages.map((img, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={img}
                    alt={`New ${index + 1}`}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid var(--gray-light)",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-1"
                    style={{ width: "24px", height: "24px", fontSize: "12px" }}
                    onClick={() => removeNewImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-group mb-3">
          <label className="form-label fw-semibold">Upload New Images</label>
          <div className="d-flex align-items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              <i className="fas fa-cloud-upload-alt me-2"></i>
              {uploading ? "Uploading..." : "Choose Images"}
            </button>
            <small className="text-muted">Max 5MB each · JPG, PNG, WEBP</small>
          </div>
        </div>

        {/* ====== وضعیت ====== */}
        <div className="form-group mt-3">
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="isVisible"
              name="isVisible"
              checked={formData.isVisible}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isVisible: e.target.checked,
                }))
              }
            />
            <label className="form-check-label fw-semibold" htmlFor="isVisible">
              {formData.isVisible
                ? "Product is visible to buyers"
                : "Product is hidden (draft)"}
            </label>
          </div>
        </div>

        {/* ====== دکمه‌ها ====== */}
        <div className="d-flex gap-3 mt-4">
          <button
            type="submit"
            className="btn btn-primary btn-lg flex-grow-1"
            style={{ borderRadius: "50px" }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/dashboard/products"
            className="btn btn-outline-secondary btn-lg"
            style={{ borderRadius: "50px" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
