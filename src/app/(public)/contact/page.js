// src/app/(public)/contact/page.js
import ContactForm from "@/components/home/ContactForm";

export const metadata = {
  title: "Contact Us | FoodTradeHub",
  description:
    "Get in touch with FoodTradeHub. Our team in Muscat, Oman is here to help you with any questions about global food trade.",
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      {/* ====== HERO ====== */}
      <section className="contact-hero">
        <div className="container">
          <span className="contact-eyebrow">
            <i className="fa-solid fa-envelope"></i>
            Contact Us
          </span>
          <h1>
            Let's Talk About <span>Your Next Deal.</span>
          </h1>
          <p>
            Whether you have a question, need help finding a supplier, or want
            to discuss a partnership — our team is ready to help.
          </p>
        </div>
      </section>

      {/* ====== CONTACT INFO + FORM ====== */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            {/* ====== Information ====== */}
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p className="contact-subtitle">
                Reach out through any of the channels below. We typically reply
                within a few hours during business days.
              </p>

              {/* Address */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <strong>Office Address</strong>
                  <span>
                    Al Khuwair, Muscat
                    <br />
                    Sultanate of Oman
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <strong>Phone</strong>
                  <a href="tel:+96824567890">+968 2456 7890</a>
                  <br />
                  <a href="tel:+96891234567">+968 9123 4567</a>
                </div>
              </div>

              {/* Email */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <strong>Email</strong>
                  <a href="mailto:info@foodtradehub.com">
                    info@foodtradehub.com
                  </a>
                  <br />
                  <a href="mailto:support@foodtradehub.com">
                    support@foodtradehub.com
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div>
                  <strong>Business Hours</strong>
                  <span>
                    Sunday – Thursday: 9:00 AM – 6:00 PM (GST)
                    <br />
                    Friday – Saturday: Closed
                  </span>
                </div>
              </div>

              {/* Social */}
              <div className="contact-social">
                <span>Follow us</span>
                <div className="contact-social-links">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <i className="fab fa-x-twitter"></i>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* ====== Form ====== */}
            <div className="contact-form-wrapper">
              <h2>Send Us a Message</h2>
              <p className="contact-subtitle">
                Fill in the form below and we will get back to you as soon as
                possible.
              </p>
              <ContactForm />
            </div>
          </div>

          {/* ====== Map ====== */}
          <div className="contact-map">
            <div className="contact-map-header">
              <i className="fa-solid fa-map-location-dot"></i>
              <div>
                <strong>Visit Our Office</strong>
                <span>Al Khuwair, Muscat, Sultanate of Oman</span>
              </div>
            </div>
            <iframe
              title="FoodTradeHub Office Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=58.40%2C23.57%2C58.48%2C23.62&layer=mapnik&marker=23.5950%2C58.4400"
              style={{
                width: "100%",
                height: 360,
                border: 0,
                display: "block",
              }}
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}