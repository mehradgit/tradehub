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
import { getCountryName } from "@/lib/countries"; // تابع کمکی برای نام کشور

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
    deadline: request.deadline ? new Date(request.deadline).toISOString().split("T")[0] : "",
    deliveryCountry: request.deliveryCountry || "",
    deliveryCountryCode: request.deliveryCountryCode || "", // فرض بر این که در دیتابیس ذخیره شده
    shippingTerms: request.shippingTerms || "",
    packagingReq: request.packagingReq || "",
    certifications: request.certifications || "",
    isUrgent: request.isUrgent || false,
    isVisible: request.isVisible !== undefined ? request.isVisible : true,
  });

  // ====== State تصاویر ======
  const [attachments, setAttachments] = useState(request.attachments || []);
  const [newAttachments, setNewAttachments] = useState([]);

  // ====== تغییرات فیلدها ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          }
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

  // ====== حذف تصویر موجود ======
  const removeExistingAttachment = (index) => {
    const newAtts = [...attachments];
    newAtts.splice(index, 1);
    setAttachments(newAtts);
  };

  // ====== حذف تصویر جدید ======
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
      // ترکیب تصاویر موجود و جدید
      const allAttachments = [...attachments, ...newAttachments];

      const payload = {
        ...formData,
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

      toast.success("Request updated successfully!");
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

        {/* ====== مقدار و بودجه ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i className="fas fa-tag me-2" style={{ color: "var(--primary)" }}></i>
          Quantity & Budget
        </h5>

        <div className="row g-3">
          <div className="col-md-3">
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
            <label className="form-label fw-semibold">Budget Range</label>
            <input
              type="text"
              className="form-control"
              name="budgetRange"
              value={formData.budgetRange}
              onChange={handleChange}
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
        </div>

        <div className="row g-3 mt-2">
          <div className="col-md-6">
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

        {/* ====== حمل‌ونقل و اطلاعات تکمیلی ====== */}
        <h5 className="fw-bold mt-4 mb-3">
          <i className="fas fa-ship me-2" style={{ color: "var(--primary)" }}></i>
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

        {/* نمایش تصاویر موجود */}
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

        {/* نمایش تصاویر جدید آپلود شده */}
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

        {/* دکمه آپلود */}
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

        {/* ====== دکمه‌ها ====== */}
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