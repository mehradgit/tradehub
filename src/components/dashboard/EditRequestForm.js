// src/components/dashboard/EditRequestForm.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";
import CategorySelect from "@/components/ui/CategorySelect";
import CountrySelect from "@/components/ui/CountrySelect";
import SupplierCountrySelect from "@/components/ui/SupplierCountrySelect"; // ✅ جدید
import { getCountryName } from "@/lib/countries";

export default function EditRequestForm({ request }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ====== State فرم ======
  const [formData, setFormData] = useState({
    title: request.title || "",
    category: request.category || "",
    subCategory: request.subCategory || "",
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
    // ✅ فیلدهای جدید
    paymentTerms: request.paymentTerms || "",
    targetPrice: request.targetPrice || "",
    isPriceNegotiable:
      request.isPriceNegotiable !== undefined ? request.isPriceNegotiable : true,
    supplierCountries: request.supplierCountries || ["WORLDWIDE"],
    // =================
    isUrgent: request.isUrgent || false,
    isVisible: request.isVisible !== undefined ? request.isVisible : true,
  });

  // ====== State تصاویر ======
  const [attachments, setAttachments] = useState(request.attachments || []);
  const [newAttachments, setNewAttachments] = useState([]);

  // ====== تغییرات فیلدها ======
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ====== تغییرات دستهبندی ======
  const handleCategoryChange = (category, subCategory) => {
    setFormData((prev) => ({
      ...prev,
      category: category,
      subCategory: subCategory || "",
    }));
  };

  // ====== تغییرات کشور تأمینکننده ======
  const handleSupplierCountriesChange = (countries) => {
    setFormData((prev) => ({ ...prev, supplierCountries: countries }));
  };

  // ====== تغییرات کشور تحویل ======
  const handleCountryChange = (countryCode) => {
    const countryName = getCountryName(countryCode);
    setFormData((prev) => ({
      ...prev,
      deliveryCountry: countryName,
      deliveryCountryCode: countryCode,
    }));
  };

  // ====== آپلود تصاویر جدید ======
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedPaths = [];
      for (const file of files) {
        const result = await uploadFileWithProgress(
          file,
          "requests",
          (percent) => {
            setUploadProgress(percent);
          },
        );
        uploadedPaths.push(result.path);
      }
      setNewAttachments((prev) => [...prev, ...uploadedPaths]);
      toast.success(`${uploadedPaths.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error(error.message || "Failed to upload file(s)");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ====== حذف تصاویر ======
  const removeExistingAttachment = (index) => {
    const newAtts = [...attachments];
    newAtts.splice(index, 1);
    setAttachments(newAtts);
  };

  const removeNewAttachment = (index) => {
    const newAtts = [...newAttachments];
    newAtts.splice(index, 1);
    setNewAttachments(newAtts);
  };

  // ====== Toggle ======
  const toggleUrgent = () => {
    setFormData((prev) => ({ ...prev, isUrgent: !prev.isUrgent }));
  };

  const toggleVisibility = () => {
    setFormData((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  };

  // ====== ارسال فرم ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const allAttachments = [...attachments, ...newAttachments];

      const payload = {
        ...formData,
        // ✅ ارسال فیلدهای جدید
        paymentTerms: formData.paymentTerms || null,
        targetPrice: formData.isPriceNegotiable
          ? null
          : parseFloat(formData.targetPrice) || null,
        isPriceNegotiable: formData.isPriceNegotiable,
        supplierCountries: formData.supplierCountries,
        // =================
        attachments: allAttachments,
        quantity: parseInt(formData.quantity),
        deadline: formData.deadline || undefined,
      };

      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update request");
      }

      toast.success("Request updated successfully. Changes are pending approval.");
      router.push("/dashboard/requests");
    } catch (error) {
      toast.error(error.message || "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow border-0 rounded-4 p-4 p-md-5">
      <form onSubmit={handleSubmit}>
        {/* ====== اطلاعات پایه ====== */}
        <h5 className="fw-bold mb-3">
          <i className="fas fa-info-circle me-2" style={{ color: "var(--primary)" }}></i>
          Basic Information
        </h5>

        <div className="form-group mb-3">
          <label className="form-label fw-semibold">Request Title</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={formData.title}
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
              onSubCategoryChange={(sub) => handleCategoryChange(formData.category, sub)}
              categoryRequired={true}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Delivery Location</label>
            <CountrySelect
              value={formData.deliveryCountryCode}
              onChange={handleCountryChange}
              placeholder="Select delivery country"
            />
          </div>
        </div>

        <div className="form-group mt-3">
          <label className="form-label fw-semibold">Description</label>
          <textarea
            className="form-control"
            rows="4"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* ====== مقدار، قیمت و بودجه ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i className="fas fa-tag me-2" style={{ color: "var(--primary)" }}></i>
          Quantity &amp; Pricing
        </h5>

        {/* ردیف اول: Quantity + Unit + Currency */}
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Quantity</label>
            <input
              type="number"
              className="form-control"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Unit</label>
            <select
              className="form-select"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
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
          <div className="col-md-4">
            <label className="form-label fw-semibold">Currency</label>
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

        {/* ردیف دوم: Target Price + Negotiabl + Budget Range + Deadline */}
        <div className="row g-3 mt-2">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Target Price</label>
            <input
              type="number"
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

          <div className="col-md-4">
            <label className="form-label fw-semibold">Budget Range</label>
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

          <div className="col-md-4">
            <label className="form-label fw-semibold">Quote Deadline</label>
            <input
              type="date"
              className="form-control"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ✅ Payment Terms */}
        <div className="form-group mt-3">
          <label className="form-label fw-semibold">Payment Terms</label>
          <select
            className="form-select"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
          >
            <option value="">Select payment terms</option>
            <option value="T/T">T/T (Telegraphic Transfer)</option>
            <option value="L/C">L/C (Letter of Credit)</option>
            <option value="D/P">D/P (Documents against Payment)</option>
            <option value="D/A">D/A (Documents against Acceptance)</option>
            <option value="PayPal">PayPal</option>
            <option value="Western Union">Western Union</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ✅ Looking for suppliers from */}
        <div className="form-group mt-3">
          <label className="form-label fw-semibold">
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

        {/* ====== حملونقل و اطلاعات تکمیلی ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i className="fas fa-ship me-2" style={{ color: "var(--primary)" }}></i>
          Shipping &amp; Additional Info
        </h5>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Shipping Terms</label>
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
              <option>DDP (Delivered Duty Paid)</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Packaging Requirements</label>
            <input
              type="text"
              className="form-control"
              name="packagingReq"
              value={formData.packagingReq}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-md-12">
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
          <i className="fas fa-images me-2" style={{ color: "var(--primary)" }}></i>
          Attachments
        </h5>

        {attachments.length > 0 && (
          <div className="mb-3">
            <label className="form-label fw-semibold">Current Images</label>
            <div className="d-flex flex-wrap gap-3">
              {attachments.map((img, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={img}
                    alt={`Attachment ${index + 1}`}
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
                    onClick={() => removeExistingAttachment(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newAttachments.length > 0 && (
          <div className="mb-3">
            <label className="form-label fw-semibold">New Images</label>
            <div className="d-flex flex-wrap gap-3">
              {newAttachments.map((img, index) => (
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
                    onClick={() => removeNewAttachment(index)}
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
              disabled={isUploading}
            >
              <i className="fas fa-cloud-upload-alt me-2"></i>
              {isUploading ? "Uploading..." : "Choose Images"}
            </button>
            <UploadProgress progress={uploadProgress} label="Uploading..." />
            <small className="text-muted">Max 5MB each · JPG, PNG, WEBP</small>
          </div>
        </div>

        {/* ====== وضعیت ====== */}
        <div className="form-group mt-3">
          <div className="toggle-group mb-3">
            <div
              className={`toggle ${formData.isUrgent ? "active" : ""}`}
              onClick={toggleUrgent}
            >
              <div className="toggle-knob"></div>
            </div>
            <span className="toggle-label">
              {formData.isUrgent ? "Urgent" : "Normal"}
            </span>
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
              {formData.isVisible ? "Visible to suppliers" : "Hidden (draft)"}
            </span>
          </div>
        </div>

        {/* ====== دکمهها ====== */}
        <div className="d-flex gap-3 mt-4">
          <button
            type="submit"
            className="btn btn-primary btn-lg flex-grow-1"
            style={{ borderRadius: "50px" }}
            disabled={loading || isUploading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/dashboard/requests"
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