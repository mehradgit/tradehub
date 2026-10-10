// src/components/home/AdvertiseForm.js
"use client";

import { useState } from "react";
import { toast } from "react-toastify";

const PLACEMENTS = [
  { value: "Homepage — Hero banner", label: "Homepage Hero Banner" },
  { value: "Homepage — Sponsored cards", label: "Homepage Sponsored Cards" },
  { value: "Homepage — Service strip", label: "Homepage Service Strip" },
  { value: "Product pages", label: "Product Pages" },
  { value: "Buying request pages", label: "Buying Request Pages" },
  { value: "Supplier profile pages", label: "Supplier Profile Pages" },
];

const BUDGETS = [
  "Under $500",
  "$500 – $2,000",
  "$2,000 – $10,000",
  "$10,000+",
  "Not sure yet",
];

export default function AdvertiseForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    country: "",
    placements: [],
    budget: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePlacement = (value) => {
    setFormData((prev) => ({
      ...prev,
      placements: prev.placements.includes(value)
        ? prev.placements.filter((p) => p !== value)
        : [...prev.placements, value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.company.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      toast.warning("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.placements.length === 0) {
      toast.warning("Please select at least one advertising placement");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/advertise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send request");
      }

      toast.success(
        "Thank you! Our advertising team will contact you shortly."
      );
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        country: "",
        placements: [],
        budget: "",
        message: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <div className="contact-form-group">
          <label htmlFor="adv-name">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="adv-name"
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="adv-company">
            Company Name <span className="required">*</span>
          </label>
          <input
            id="adv-company"
            type="text"
            name="company"
            placeholder="Your company"
            value={formData.company}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="contact-form-row">
        <div className="contact-form-group">
          <label htmlFor="adv-email">
            Email Address <span className="required">*</span>
          </label>
          <input
            id="adv-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="adv-phone">Phone</label>
          <input
            id="adv-phone"
            type="tel"
            name="phone"
            placeholder="+968 0000 0000"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="contact-form-group">
        <label htmlFor="adv-country">Country</label>
        <input
          id="adv-country"
          type="text"
          name="country"
          placeholder="e.g. Oman"
          value={formData.country}
          onChange={handleChange}
        />
      </div>

      <div className="contact-form-group">
        <label>
          Where do you want to advertise?{" "}
          <span className="required">*</span>
        </label>
        <div className="ad-placement-grid">
          {PLACEMENTS.map((placement) => (
            <label key={placement.value} className="ad-placement-chip">
              <input
                type="checkbox"
                checked={formData.placements.includes(placement.value)}
                onChange={() => togglePlacement(placement.value)}
              />
              {placement.label}
            </label>
          ))}
        </div>
      </div>

      <div className="contact-form-group">
        <label htmlFor="adv-budget">Monthly Budget</label>
        <select
          id="adv-budget"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
        >
          <option value="">Select a budget range</option>
          {BUDGETS.map((budget) => (
            <option key={budget} value={budget}>
              {budget}
            </option>
          ))}
        </select>
      </div>

      <div className="contact-form-group">
        <label htmlFor="adv-message">
          Your Message <span className="required">*</span>
        </label>
        <textarea
          id="adv-message"
          name="message"
          rows={5}
          placeholder="Tell us about your products or services, target markets and campaign goals..."
          value={formData.message}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="contact-submit" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Sending...
          </>
        ) : (
          <>
            <i className="fa-solid fa-paper-plane"></i>
            Send Advertising Request
          </>
        )}
      </button>
    </form>
  );
}
