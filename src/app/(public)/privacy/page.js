// src/app/(public)/privacy/page.js
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | FoodTradeHub",
  description:
    "Learn how FoodTradeHub collects, uses, and protects your personal and business information.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="privacy-page">
      {/* ====== HERO ====== */}
      <section className="privacy-hero">
        <div className="container">
          <span className="privacy-eyebrow">
            <i className="fa-solid fa-shield-halved"></i>
            Legal
          </span>
          <h1>
            Privacy <span>Policy</span>
          </h1>
          <p>
            Your privacy matters to us. This policy explains what data we
            collect, how we use it, and the choices you have.
          </p>
          <div className="privacy-last-updated">
            <i className="fa-regular fa-calendar"></i>
            Last Updated: {lastUpdated}
          </div>
        </div>
      </section>

      {/* ====== CONTENT ====== */}
      <section className="privacy-section">
        <div className="container">
          <div className="privacy-layout">
            {/* ====== SIDEBAR TOC ====== */}
            <aside className="privacy-toc">
              <div className="privacy-toc-inner">
                <h4>Table of Contents</h4>
                <ul>
                  <li><a href="#introduction">1. Introduction</a></li>
                  <li><a href="#data-we-collect">2. Data We Collect</a></li>
                  <li><a href="#how-we-use">3. How We Use Your Data</a></li>
                  <li><a href="#legal-basis">4. Legal Basis</a></li>
                  <li><a href="#sharing">5. Sharing Your Information</a></li>
                  <li><a href="#cookies">6. Cookies &amp; Tracking</a></li>
                  <li><a href="#security">7. Data Security</a></li>
                  <li><a href="#retention">8. Data Retention</a></li>
                  <li><a href="#your-rights">9. Your Rights</a></li>
                  <li><a href="#children">10. Children's Privacy</a></li>
                  <li><a href="#international">11. International Transfers</a></li>
                  <li><a href="#changes">12. Changes to This Policy</a></li>
                  <li><a href="#contact">13. Contact Us</a></li>
                </ul>
              </div>
            </aside>

            {/* ====== MAIN CONTENT ====== */}
            <div className="privacy-content">
              {/* 1. Introduction */}
              <section id="introduction" className="privacy-block">
                <h2>
                  <span className="privacy-num">1</span>
                  Introduction
                </h2>
                <p>
                  Welcome to <strong>FoodTradeHub</strong> ("we", "our", or
                  "us"). FoodTradeHub is a global B2B marketplace that connects
                  food suppliers, manufacturers, exporters, wholesalers, and
                  buyers. This Privacy Policy describes how we collect, use,
                  disclose, and safeguard your information when you visit our
                  website, create an account, list products, post buying
                  requests, or interact with other users.
                </p>
                <p>
                  By using FoodTradeHub, you consent to the data practices
                  described in this policy. If you do not agree, please do not
                  use our platform.
                </p>
              </section>

              {/* 2. Data We Collect */}
              <section id="data-we-collect" className="privacy-block">
                <h2>
                  <span className="privacy-num">2</span>
                  Data We Collect
                </h2>
                <p>
                  We collect information that you provide directly, information
                  generated automatically, and information from third parties.
                </p>

                <h3>2.1 Information You Provide</h3>
                <ul>
                  <li>
                    <strong>Account Data:</strong> name, email address,
                    password (hashed), phone number, country, and profile
                    picture.
                  </li>
                  <li>
                    <strong>Business Information:</strong> company name,
                    business type, address, city, postal code, employee count,
                    website, company email, and bio.
                  </li>
                  <li>
                    <strong>Listing Content:</strong> product details, images,
                    buying requests, quantity, budget, target price, packaging
                    requirements, and shipping terms.
                  </li>
                  <li>
                    <strong>Communications:</strong> messages sent through our
                    platform, support tickets, and attachments.
                  </li>
                  <li>
                    <strong>Payment Information:</strong> payment history,
                    invoices, and transaction references. We do not store full
                    card details — payments are processed by our payment
                    gateway partner (<strong>YekPay</strong>).
                  </li>
                  <li>
                    <strong>Authentication Data:</strong> if you sign in with
                    Google, we receive your name, email, and profile picture
                    from Google.
                  </li>
                </ul>

                <h3>2.2 Information Collected Automatically</h3>
                <ul>
                  <li>
                    <strong>Device &amp; Usage Data:</strong> IP address,
                    browser type, operating system, referring URL, pages
                    visited, and time spent.
                  </li>
                  <li>
                    <strong>Cookies:</strong> session cookies for
                    authentication and preference cookies to remember your
                    settings.
                  </li>
                  <li>
                    <strong>Web Push Tokens:</strong> if you enable push
                    notifications, we store your browser's push subscription
                    endpoint.
                  </li>
                </ul>

                <h3>2.3 Information from Third Parties</h3>
                <ul>
                  <li>Google (for OAuth sign-in)</li>
                  <li>Payment gateway providers (YekPay)</li>
                  <li>Email delivery services (for transactional emails)</li>
                </ul>
              </section>

              {/* 3. How We Use */}
              <section id="how-we-use" className="privacy-block">
                <h2>
                  <span className="privacy-num">3</span>
                  How We Use Your Data
                </h2>
                <p>We use the information we collect for the following purposes:</p>
                <ul>
                  <li>To create and manage your account</li>
                  <li>To display your public profile, products, and requests to other users</li>
                  <li>To facilitate communication between buyers and suppliers (messages, inquiries, quotes)</li>
                  <li>To process subscriptions and payments</li>
                  <li>To verify your identity and prevent fraud</li>
                  <li>To send transactional emails (verification, password reset, notifications)</li>
                  <li>To send push notifications if enabled</li>
                  <li>To provide customer support</li>
                  <li>To improve the platform, analyze usage patterns, and develop new features</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              {/* 4. Legal Basis */}
              <section id="legal-basis" className="privacy-block">
                <h2>
                  <span className="privacy-num">4</span>
                  Legal Basis for Processing
                </h2>
                <p>
                  Where required by law (e.g., GDPR), we rely on the following
                  legal bases:
                </p>
                <ul>
                  <li>
                    <strong>Contract:</strong> processing necessary to provide
                    our services (account, listings, communications).
                  </li>
                  <li>
                    <strong>Consent:</strong> for marketing emails and web push
                    notifications (you may withdraw at any time).
                  </li>
                  <li>
                    <strong>Legitimate Interest:</strong> for fraud prevention,
                    security, and service improvement.
                  </li>
                  <li>
                    <strong>Legal Obligation:</strong> for tax, accounting, and
                    regulatory compliance.
                  </li>
                </ul>
              </section>

              {/* 5. Sharing */}
              <section id="sharing" className="privacy-block">
                <h2>
                  <span className="privacy-num">5</span>
                  Sharing Your Information
                </h2>
                <p>
                  We do not sell your personal data. We may share it with:
                </p>
                <ul>
                  <li>
                    <strong>Other Users:</strong> if you are a supplier, your
                    public profile, company name, and product listings are
                    visible to buyers. If you are a buyer, your buying requests
                    are visible to suppliers. Contact information may be hidden
                    behind paid plans or require quota consumption.
                  </li>
                  <li>
                    <strong>Service Providers:</strong> payment processors,
                    email delivery services, hosting providers, and analytics
                    tools.
                  </li>
                  <li>
                    <strong>Legal Authorities:</strong> when required by law,
                    subpoena, or to protect our rights.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> in case of merger,
                    acquisition, or sale of assets.
                  </li>
                </ul>
              </section>

              {/* 6. Cookies */}
              <section id="cookies" className="privacy-block">
                <h2>
                  <span className="privacy-num">6</span>
                  Cookies &amp; Tracking
                </h2>
                <p>
                  We use cookies and similar technologies for:
                </p>
                <ul>
                  <li>
                    <strong>Authentication:</strong> to keep you signed in
                    across sessions (NextAuth session cookies).
                  </li>
                  <li>
                    <strong>Preferences:</strong> to remember your language
                    and display settings.
                  </li>
                  <li>
                    <strong>Security:</strong> to prevent cross-site request
                    forgery and detect suspicious activity.
                  </li>
                </ul>
                <p>
                  You can control cookies through your browser settings. Note
                  that disabling essential cookies may prevent you from using
                  the platform.
                </p>
              </section>

              {/* 7. Security */}
              <section id="security" className="privacy-block">
                <h2>
                  <span className="privacy-num">7</span>
                  Data Security
                </h2>
                <p>
                  We implement reasonable technical and organizational measures
                  to protect your data, including:
                </p>
                <ul>
                  <li>Password hashing with bcrypt</li>
                  <li>HTTPS encryption in transit</li>
                  <li>Role-based access controls</li>
                  <li>Regular security reviews</li>
                </ul>
                <p>
                  However, no method of transmission over the Internet is 100%
                  secure. We cannot guarantee absolute security.
                </p>
              </section>

              {/* 8. Retention */}
              <section id="retention" className="privacy-block">
                <h2>
                  <span className="privacy-num">8</span>
                  Data Retention
                </h2>
                <p>
                  We retain your personal data for as long as your account is
                  active, or as needed to provide services and comply with
                  legal obligations. When you delete your account, we may
                  retain certain data (e.g., invoices) for legal, tax, or
                  fraud-prevention purposes.
                </p>
              </section>

              {/* 9. Your Rights */}
              <section id="your-rights" className="privacy-block">
                <h2>
                  <span className="privacy-num">9</span>
                  Your Rights
                </h2>
                <p>
                  Depending on your jurisdiction, you may have the right to:
                </p>
                <ul>
                  <li><strong>Access</strong> — request a copy of your personal data</li>
                  <li><strong>Correct</strong> — update inaccurate information</li>
                  <li><strong>Delete</strong> — request deletion of your account and data</li>
                  <li><strong>Restrict</strong> — limit how we process your data</li>
                  <li><strong>Object</strong> — to certain processing activities</li>
                  <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
                  <li><strong>Withdraw Consent</strong> — at any time, where consent is the legal basis</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:support@foodtradehub.com">
                    support@foodtradehub.com
                  </a>
                  .
                </p>
              </section>

              {/* 10. Children */}
              <section id="children" className="privacy-block">
                <h2>
                  <span className="privacy-num">10</span>
                  Children's Privacy
                </h2>
                <p>
                  FoodTradeHub is a B2B platform intended for business use and
                  is not directed to individuals under 18. We do not knowingly
                  collect data from children.
                </p>
              </section>

              {/* 11. International */}
              <section id="international" className="privacy-block">
                <h2>
                  <span className="privacy-num">11</span>
                  International Data Transfers
                </h2>
                <p>
                  FoodTradeHub operates globally. Your data may be transferred
                  to and processed in countries outside your own. We take
                  appropriate safeguards (such as standard contractual clauses)
                  to ensure your data remains protected.
                </p>
              </section>

              {/* 12. Changes */}
              <section id="changes" className="privacy-block">
                <h2>
                  <span className="privacy-num">12</span>
                  Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will
                  post the revised policy on this page with a new "Last
                  Updated" date. We encourage you to review it periodically.
                </p>
              </section>

              {/* 13. Contact */}
              <section id="contact" className="privacy-block">
                <h2>
                  <span className="privacy-num">13</span>
                  Contact Us
                </h2>
                <p>
                  If you have questions, concerns, or requests regarding this
                  Privacy Policy, please contact us:
                </p>
                <div className="privacy-contact-card">
                  <div className="privacy-contact-item">
                    <i className="fa-solid fa-envelope"></i>
                    <div>
                      <span>Email</span>
                      <a href="mailto:support@foodtradehub.com">
                        support@foodtradehub.com
                      </a>
                    </div>
                  </div>
                  <div className="privacy-contact-item">
                    <i className="fa-solid fa-location-dot"></i>
                    <div>
                      <span>Address</span>
                      <strong>Al Khuwair, Muscat, Sultanate of Oman</strong>
                    </div>
                  </div>
                  <div className="privacy-contact-item">
                    <i className="fa-solid fa-headset"></i>
                    <div>
                      <span>Support</span>
                      <Link href="/contact">Contact our team →</Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .privacy-page {
          background: #f6f8f9;
        }

        /* ====== HERO ====== */
        .privacy-hero {
          padding: 80px 0 60px;
          background: linear-gradient(125deg, #eff9f4, #f8fbf9 55%, #e9f5ef);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .privacy-hero::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 60px solid rgba(15, 158, 110, 0.04);
          top: -250px;
          right: -100px;
        }
        .privacy-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 50px;
          background: #eaf7f1;
          color: #13795b;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        .privacy-hero h1 {
          font-family: "Manrope", sans-serif;
          font-size: clamp(32px, 4.5vw, 52px);
          line-height: 1.15;
          letter-spacing: -1.5px;
          color: #13251f;
          margin-bottom: 20px;
        }
        .privacy-hero h1 span {
          color: #13795b;
        }
        .privacy-hero p {
          font-size: 17px;
          line-height: 1.7;
          color: #71807b;
          max-width: 680px;
          margin: 0 auto 24px;
        }
        .privacy-last-updated {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: white;
          border: 1px solid #e2e9e5;
          border-radius: 50px;
          font-size: 13px;
          color: #71807b;
          font-weight: 600;
        }

        /* ====== SECTION ====== */
        .privacy-section {
          padding: 60px 0 90px;
        }
        .privacy-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 992px) {
          .privacy-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        /* ====== TOC ====== */
        .privacy-toc {
          position: sticky;
          top: 100px;
        }
        @media (max-width: 992px) {
          .privacy-toc {
            position: static;
          }
        }
        .privacy-toc-inner {
          background: white;
          border: 1px solid #e2e9e5;
          border-radius: 16px;
          padding: 24px 20px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .privacy-toc-inner h4 {
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #13251f;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f7;
        }
        .privacy-toc-inner ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .privacy-toc-inner li {
          margin-bottom: 4px;
        }
        .privacy-toc-inner a {
          display: block;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 12.5px;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .privacy-toc-inner a:hover {
          background: #eaf7f1;
          color: #13795b;
          border-left-color: #13795b;
        }

        /* ====== CONTENT ====== */
        .privacy-content {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e9e5;
          padding: 40px 44px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 640px) {
          .privacy-content {
            padding: 24px 20px;
          }
        }

        .privacy-block {
          margin-bottom: 40px;
          scroll-margin-top: 100px;
        }
        .privacy-block:last-child {
          margin-bottom: 0;
        }

        .privacy-block h2 {
          font-family: "Manrope", sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #13251f;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f7;
        }
        .privacy-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #13795b, #1d9a71);
          color: white;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .privacy-block h3 {
          font-family: "Manrope", sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #13251f;
          margin: 24px 0 10px 0;
        }

        .privacy-block p {
          font-size: 15px;
          line-height: 1.8;
          color: #33413d;
          margin: 0 0 14px 0;
        }

        .privacy-block ul {
          padding-left: 0;
          margin: 0 0 16px 0;
          list-style: none;
        }
        .privacy-block ul li {
          font-size: 14.5px;
          line-height: 1.8;
          color: #33413d;
          padding: 6px 0 6px 28px;
          position: relative;
        }
        .privacy-block ul li::before {
          content: "";
          position: absolute;
          left: 8px;
          top: 15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1d9a71;
        }

        .privacy-block a {
          color: #13795b;
          text-decoration: none;
          font-weight: 600;
          border-bottom: 1px dashed #a7f3d0;
          transition: all 0.2s ease;
        }
        .privacy-block a:hover {
          color: #0b5b43;
          border-bottom-style: solid;
        }

        .privacy-block strong {
          color: #13251f;
          font-weight: 700;
        }

        /* ====== Contact Card ====== */
        .privacy-contact-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 20px;
          padding: 20px;
          background: #f9fbfa;
          border: 1px solid #eef2f0;
          border-radius: 14px;
        }
        .privacy-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .privacy-contact-item i {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          color: #13795b;
          display: grid;
          place-items: center;
          font-size: 15px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(19, 121, 91, 0.08);
        }
        .privacy-contact-item div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .privacy-contact-item span {
          font-size: 11px;
          font-weight: 800;
          color: #71807b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .privacy-contact-item strong,
        .privacy-contact-item a {
          font-size: 13.5px;
          color: #13251f;
          font-weight: 700;
          border: none;
        }
        .privacy-contact-item a {
          color: #13795b;
        }
      `}</style>
    </div>
  );
}