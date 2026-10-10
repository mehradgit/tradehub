// src/app/(public)/advertise/page.js
import AdvertiseForm from "@/components/home/AdvertiseForm";

export const metadata = {
  title: "Advertise With Us | FoodTradeLink",
  description:
    "Advertise your food business on FoodTradeLink. Reach thousands of food buyers, importers, exporters and distributors worldwide.",
};

export default function AdvertisePage() {
  return (
    <div className="contact-page">
      {/* ====== HERO ====== */}
      <section className="contact-hero">
        <div className="container">
          <span className="contact-eyebrow">
            <i className="fa-solid fa-bullhorn"></i>
            Advertise With Us
          </span>
          <h1>
            Reach <span>Thousands of Food Trade Buyers.</span>
          </h1>
          <p>
            Put your company in front of food importers, exporters,
            manufacturers and distributors. Choose where you want to
            appear and our team will set up your placement.
          </p>
        </div>
      </section>

      {/* ====== INFO + FORM ====== */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            {/* ====== Information ====== */}
            <div className="contact-info">
              <h2>Advertising Options</h2>
              <p className="contact-subtitle">
                Pick one or more placements below and send your request.
                Our advertising team replies within one business day.
              </p>

              {/* Homepage */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-house"></i>
                </div>
                <div>
                  <strong>Homepage</strong>
                  <span>
                    Hero sponsored banner, sponsored company cards and
                    the services strip — seen by every visitor.
                  </span>
                </div>
              </div>

              {/* Product & Request pages */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <div>
                  <strong>Product &amp; Request Pages</strong>
                  <span>
                    Appear next to related products and buying requests
                    from buyers ready to deal.
                  </span>
                </div>
              </div>

              {/* Supplier profiles */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-id-card"></i>
                </div>
                <div>
                  <strong>Supplier Profiles</strong>
                  <span>
                    Promote your brand on supplier profile pages viewed
                    by serious B2B buyers.
                  </span>
                </div>
              </div>

              {/* Direct email */}
              <div className="contact-item">
                <div className="contact-item-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <strong>Direct Email</strong>
                  <a href="mailto:ads@foodtradehub.com">
                    ads@foodtradehub.com
                  </a>
                  <br />
                  <span>For media kits and custom campaigns</span>
                </div>
              </div>
            </div>

            {/* ====== Form ====== */}
            <div className="contact-form-wrapper">
              <h2>Send Your Advertising Request</h2>
              <p className="contact-subtitle">
                Fill in the form below and our advertising team will
                contact you with placement details and pricing.
              </p>
              <AdvertiseForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
