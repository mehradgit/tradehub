// src/components/home/ContactForm.js
"use client";

import { useState } from "react";
import { toast } from "react-toastify";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      toast.warning("Please fill in all fields");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      toast.success(
        "Thank you! Your message has been sent. We'll get back to you soon."
      );
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <div className="contact-form-group">
          <label htmlFor="name">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="email">
            Email Address <span className="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="contact-form-group">
        <label htmlFor="subject">
          Subject <span className="required">*</span>
        </label>
        <input
          id="subject"
          type="text"
          name="subject"
          placeholder="How can we help you?"
          value={formData.subject}
          onChange={handleChange}
          required
        />
      </div>

      <div className="contact-form-group">
        <label htmlFor="message">
          Message <span className="required">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Write your message here..."
          value={formData.message}
          onChange={handleChange}
          required
        ></textarea>
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
            Send Message
          </>
        )}
      </button>
    </form>
  );
}