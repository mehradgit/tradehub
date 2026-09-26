// src/components/support/TicketForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import AttachmentUpload from "./AttachmentUpload";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/utils/ticketHelpers";

export default function TicketForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
    relatedProductId: "",
    relatedRequestId: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          category: formData.category,
          priority: formData.priority,
          message: formData.message.trim(),
          relatedProductId: formData.relatedProductId || null,
          relatedRequestId: formData.relatedRequestId || null,
          attachments: attachments.map((a) => ({
            fileName: a.fileName,
            filePath: a.filePath,
            fileSize: a.fileSize,
            fileType: a.fileType,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create ticket");

      toast.success(`Ticket #${data.ticket.ticketNumber} created successfully`);
      router.push(`/dashboard/support/${data.ticket.ticketNumber}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>
          <i className="fas fa-plus-circle"></i> New Support Ticket
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Subject */}
        <div className="form-group mb-3">
          <label className="form-label fw-semibold">
            Subject <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            name="subject"
            placeholder="Brief summary of the issue"
            value={formData.subject}
            onChange={handleChange}
            maxLength={200}
            required
          />
        </div>

        <div className="row g-3">
          {/* Category */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Category <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Priority</label>
            <select
              className="form-select"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div className="form-group mt-3">
          <label className="form-label fw-semibold">
            Message <span className="text-danger">*</span>
          </label>
          <textarea
            className="form-control"
            rows="6"
            name="message"
            placeholder="Describe your issue in detail. Include steps to reproduce if it's a technical problem."
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        {/* Related (optional) */}
        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Related Product <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              name="relatedProductId"
              placeholder="Product number (e.g., 1234567)"
              value={formData.relatedProductId}
              onChange={handleChange}
            />
            <div className="help-text">
              Paste the product number if this is about a specific product.
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Related Request <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              name="relatedRequestId"
              placeholder="Request number (e.g., 1234567)"
              value={formData.relatedRequestId}
              onChange={handleChange}
            />
            <div className="help-text">
              Paste the request number if this is about a specific buying
              request.
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="form-group mt-3">
          <label className="form-label fw-semibold">
            Attachments <span className="text-muted">(optional)</span>
          </label>
          <AttachmentUpload
            attachments={attachments}
            onChange={setAttachments}
            maxFiles={3}
            maxSizeMB={5}
          />
        </div>

        {/* Actions */}
        <div className="form-actions mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Ticket"}
            <i className="fas fa-paper-plane ms-2"></i>
          </button>
          <Link href="/dashboard/support" className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
