// src/app/(public)/terms/page.js
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | FoodTradeLink",
  description:
    "Read the terms and conditions that govern your use of the FoodTradeLink B2B marketplace.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 2026";

  return (
    <div className="terms-page">
      {/* ====== HERO ====== */}
      <section className="terms-hero">
        <div className="container">
          <span className="terms-eyebrow">
            <i className="fa-solid fa-file-contract"></i>
            Legal
          </span>
          <h1>
            Terms of <span>Service</span>
          </h1>
          <p>
            These terms govern your access to and use of the FoodTradeLink
            platform. Please read them carefully before using our services.
          </p>
          <div className="terms-last-updated">
            <i className="fa-regular fa-calendar"></i>
            Last Updated: {lastUpdated}
          </div>
        </div>
      </section>

      {/* ====== CONTENT ====== */}
      <section className="terms-section">
        <div className="container">
          <div className="terms-layout">
            {/* ====== SIDEBAR TOC ====== */}
            <aside className="terms-toc">
              <div className="terms-toc-inner">
                <h4>Table of Contents</h4>
                <ul>
                  <li><a href="#acceptance">1. Acceptance of Terms</a></li>
                  <li><a href="#definitions">2. Definitions</a></li>
                  <li><a href="#eligibility">3. Eligibility</a></li>
                  <li><a href="#account">4. Account Registration</a></li>
                  <li><a href="#platform-use">5. Acceptable Use</a></li>
                  <li><a href="#listings">6. Product &amp; Request Listings</a></li>
                  <li><a href="#subscriptions">7. Subscriptions &amp; Payments</a></li>
                  <li><a href="#access-control">8. Access Control &amp; Quotas</a></li>
                  <li><a href="#ip">9. Intellectual Property</a></li>
                  <li><a href="#user-content">10. User Content</a></li>
                  <li><a href="#disclaimer">11. Disclaimer of Warranties</a></li>
                  <li><a href="#liability">12. Limitation of Liability</a></li>
                  <li><a href="#indemnification">13. Indemnification</a></li>
                  <li><a href="#termination">14. Termination</a></li>
                  <li><a href="#governing-law">15. Governing Law</a></li>
                  <li><a href="#changes">16. Changes to Terms</a></li>
                  <li><a href="#contact">17. Contact Us</a></li>
                </ul>
              </div>
            </aside>

            {/* ====== MAIN CONTENT ====== */}
            <div className="terms-content">
              {/* 1 */}
              <section id="acceptance" className="terms-block">
                <h2>
                  <span className="terms-num">1</span>
                  Acceptance of Terms
                </h2>
                <p>
                  By accessing, registering for, or using FoodTradeLink (the
                  "Platform", "Service", "we", "our", or "us"), you agree to
                  be bound by these Terms of Service ("Terms"), our{" "}
                  <Link href="/privacy">Privacy Policy</Link>, and all
                  applicable laws and regulations.
                </p>
                <p>
                  If you do not agree with any part of these Terms, you must
                  not use the Platform. If you are using the Platform on behalf
                  of a company or other legal entity, you represent that you
                  have the authority to bind that entity to these Terms.
                </p>
              </section>

              {/* 2 */}
              <section id="definitions" className="terms-block">
                <h2>
                  <span className="terms-num">2</span>
                  Definitions
                </h2>
                <ul>
                  <li>
                    <strong>"User"</strong> — any individual or entity who
                    accesses or uses the Platform.
                  </li>
                  <li>
                    <strong>"Supplier"</strong> — a User who lists products for
                    sale.
                  </li>
                  <li>
                    <strong>"Buyer"</strong> — a User who posts buying
                    requests or contacts Suppliers.
                  </li>
                  <li>
                    <strong>"Content"</strong> — any text, images, data, or
                    other material uploaded or shared on the Platform.
                  </li>
                  <li>
                    <strong>"Subscription"</strong> — a paid plan (Bronze,
                    Silver, Gold) that grants additional features and quotas.
                  </li>
                  <li>
                    <strong>"Quota"</strong> — a monthly limit on certain
                    actions (e.g., revealing contact info, submitting quotes).
                  </li>
                </ul>
              </section>

              {/* 3 */}
              <section id="eligibility" className="terms-block">
                <h2>
                  <span className="terms-num">3</span>
                  Eligibility
                </h2>
                <p>
                  To use FoodTradeLink, you must:
                </p>
                <ul>
                  <li>Be at least 18 years old</li>
                  <li>
                    Have the legal capacity to enter into binding contracts
                  </li>
                  <li>
                    Register only if you are a legitimate business (supplier,
                    buyer, distributor, etc.)
                  </li>
                  <li>
                    Provide accurate, current, and complete information during
                    registration
                  </li>
                </ul>
              </section>

              {/* 4 */}
              <section id="account" className="terms-block">
                <h2>
                  <span className="terms-num">4</span>
                  Account Registration
                </h2>
                <p>
                  To access most features, you must create an account. You
                  agree to:
                </p>
                <ul>
                  <li>Provide truthful and accurate information</li>
                  <li>Keep your login credentials confidential</li>
                  <li>
                    Notify us immediately of any unauthorized access or
                    security breach
                  </li>
                  <li>
                    Be solely responsible for all activity that occurs under
                    your account
                  </li>
                </ul>
                <p>
                  We reserve the right to refuse registration, suspend, or
                  terminate any account at our sole discretion.
                </p>
              </section>

              {/* 5 */}
              <section id="platform-use" className="terms-block">
                <h2>
                  <span className="terms-num">5</span>
                  Acceptable Use
                </h2>
                <p>You agree NOT to:</p>
                <ul>
                  <li>
                    Post false, misleading, fraudulent, or deceptive
                    information
                  </li>
                  <li>
                    Impersonate another person, company, or entity
                  </li>
                  <li>
                    Upload malware, viruses, or harmful code
                  </li>
                  <li>
                    Use automated tools (bots, scrapers) to extract data
                    without permission
                  </li>
                  <li>
                    Attempt to gain unauthorized access to other accounts or
                    systems
                  </li>
                  <li>
                    Post content that is illegal, obscene, defamatory, or
                    infringes on third-party rights
                  </li>
                  <li>
                    Use the Platform for money laundering, tax evasion, or any
                    other illegal activity
                  </li>
                  <li>
                    List restricted, prohibited, or unsafe products (see
                    Section 6)
                  </li>
                  <li>
                    Circumvent subscription quotas or access control mechanisms
                  </li>
                  <li>
                    Share contact information publicly to bypass the Platform's
                    monetization rules
                  </li>
                </ul>
                <p>
                  Violations may result in immediate account suspension or
                  termination.
                </p>
              </section>

              {/* 6 */}
              <section id="listings" className="terms-block">
                <h2>
                  <span className="terms-num">6</span>
                  Product &amp; Request Listings
                </h2>
                <h3>6.1 Supplier Listings</h3>
                <p>
                  Suppliers are solely responsible for the accuracy of their
                  product listings, including:
                </p>
                <ul>
                  <li>Product descriptions, prices, and MOQ (Minimum Order Quantity)</li>
                  <li>Country of origin, certifications, and packaging</li>
                  <li>Shipping and payment terms</li>
                  <li>Compliance with export/import laws of their jurisdiction</li>
                </ul>
                <p>
                  All listings are subject to <strong>admin approval</strong>{" "}
                  before becoming publicly visible.
                </p>

                <h3>6.2 Buyer Requests</h3>
                <p>
                  Buyers are solely responsible for the accuracy of their
                  buying requests, including quantity, budget, and delivery
                  requirements.
                </p>

                <h3>6.3 Prohibited Content</h3>
                <p>
                  You may not list or request:
                </p>
                <ul>
                  <li>Illegal or controlled substances</li>
                  <li>Counterfeit or misbranded products</li>
                  <li>Products that violate food safety regulations</li>
                  <li>Endangered species or protected wildlife products</li>
                  <li>Weapons or hazardous materials</li>
                </ul>
              </section>

              {/* 7 */}
              <section id="subscriptions" className="terms-block">
                <h2>
                  <span className="terms-num">7</span>
                  Subscriptions &amp; Payments
                </h2>
                <h3>7.1 Plans</h3>
                <p>
                  FoodTradeLink offers both <strong>free</strong> (Basic) and{" "}
                  <strong>paid</strong> plans (Bronze, Silver, Gold). Each plan
                  provides different limits on:
                </p>
                <ul>
                  <li>Number of products and requests</li>
                  <li>Images per product/request</li>
                  <li>Monthly inquiries and quotes</li>
                  <li>Profile images</li>
                  <li>Access to contact information of other users</li>
                </ul>

                <h3>7.2 Payment Processing</h3>
                <p>
                  Payments are processed securely through our payment gateway
                  partner, <strong>YekPay</strong>. By making a payment, you
                  also agree to YekPay's terms and privacy policy. We do not
                  store your full payment card details.
                </p>

                <h3>7.3 Refunds</h3>
                <p>
                  Unless required by law, all subscription payments are{" "}
                  <strong>non-refundable</strong>. However, we may consider
                  refunds on a case-by-case basis for technical issues
                  resulting in duplicate charges or unauthorized transactions.
                </p>

                <h3>7.4 Coupons</h3>
                <p>
                  Coupons are subject to their own terms, including expiration
                  dates, minimum amounts, and usage limits. Coupons may not be
                  combined unless explicitly stated.
                </p>

                <h3>7.5 Auto-Renewal</h3>
                <p>
                  Subscriptions do not auto-renew. You will need to manually
                  purchase a new subscription period when your current one
                  expires.
                </p>
              </section>

              {/* 8 */}
              <section id="access-control" className="terms-block">
                <h2>
                  <span className="terms-num">8</span>
                  Access Control &amp; Quotas
                </h2>
                <p>
                  FoodTradeLink uses a <strong>quota-based system</strong> to
                  manage access to certain information (such as buyer or
                  supplier contact details). Revealing such information may
                  consume a portion of your monthly quota, depending on the
                  current platform settings.
                </p>
                <p>
                  Attempting to circumvent these mechanisms (e.g., through
                  scraping, multiple accounts, or public disclosure of contact
                  info) is strictly prohibited and may result in account
                  termination.
                </p>
              </section>

              {/* 9 */}
              <section id="ip" className="terms-block">
                <h2>
                  <span className="terms-num">9</span>
                  Intellectual Property
                </h2>
                <p>
                  All content on FoodTradeLink (logos, design, text, graphics,
                  software) is owned by us or our licensors and is protected
                  by intellectual property laws. You may not copy, modify,
                  distribute, or create derivative works without our express
                  written consent.
                </p>
                <p>
                  The FoodTradeLink name and logo are trademarks of our company.
                </p>
              </section>

              {/* 10 */}
              <section id="user-content" className="terms-block">
                <h2>
                  <span className="terms-num">10</span>
                  User Content
                </h2>
                <p>
                  You retain ownership of any content you upload. However, by
                  posting content, you grant FoodTradeLink a{" "}
                  <strong>
                    worldwide, non-exclusive, royalty-free, transferable
                  </strong>{" "}
                  license to use, display, reproduce, and distribute that
                  content on the Platform and in related marketing materials.
                </p>
                <p>
                  You represent that you own or have the necessary rights to
                  any content you upload, and that it does not infringe on
                  third-party rights.
                </p>
              </section>

              {/* 11 */}
              <section id="disclaimer" className="terms-block">
                <h2>
                  <span className="terms-num">11</span>
                  Disclaimer of Warranties
                </h2>
                <p>
                  FoodTradeLink is provided{" "}
                  <strong>"as is" and "as available"</strong> without any
                  warranties of any kind, express or implied, including but not
                  limited to:
                </p>
                <ul>
                  <li>Warranties of merchantability or fitness for a particular purpose</li>
                  <li>Non-infringement of third-party rights</li>
                  <li>Uninterrupted or error-free operation</li>
                  <li>Accuracy or reliability of user-generated content</li>
                </ul>
                <p>
                  We do <strong>not</strong> verify the accuracy of product
                  listings, buyer requests, or user profiles. You are solely
                  responsible for conducting your own due diligence before
                  entering into any business transaction.
                </p>
                <p>
                  FoodTradeLink is a <strong>facilitator</strong>, not a party
                  to any transaction between Users.
                </p>
              </section>

              {/* 12 */}
              <section id="liability" className="terms-block">
                <h2>
                  <span className="terms-num">12</span>
                  Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by law, FoodTradeLink shall
                  not be liable for:
                </p>
                <ul>
                  <li>Any indirect, incidental, special, or consequential damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Damages arising from transactions between Users</li>
                  <li>Unauthorized access to your account or data</li>
                  <li>Third-party services (payment gateways, email providers, etc.)</li>
                </ul>
                <p>
                  Our total liability shall not exceed the amount you paid us
                  in the 12 months preceding the claim.
                </p>
              </section>

              {/* 13 */}
              <section id="indemnification" className="terms-block">
                <h2>
                  <span className="terms-num">13</span>
                  Indemnification
                </h2>
                <p>
                  You agree to indemnify, defend, and hold harmless
                  FoodTradeLink, its officers, directors, employees, and agents
                  from any claims, damages, losses, or expenses (including
                  attorney fees) arising from:
                </p>
                <ul>
                  <li>Your use of the Platform</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Content you upload or share</li>
                  <li>Transactions you enter into with other Users</li>
                </ul>
              </section>

              {/* 14 */}
              <section id="termination" className="terms-block">
                <h2>
                  <span className="terms-num">14</span>
                  Termination
                </h2>
                <p>
                  We may suspend or terminate your account at any time, with or
                  without notice, for conduct that we believe:
                </p>
                <ul>
                  <li>Violates these Terms</li>
                  <li>Harms other Users or our business</li>
                  <li>Violates applicable laws</li>
                  <li>Is fraudulent, abusive, or harmful</li>
                </ul>
                <p>
                  You may delete your account at any time by contacting our
                  support. Upon termination, your right to use the Platform
                  will cease immediately.
                </p>
              </section>

              {/* 15 */}
              <section id="governing-law" className="terms-block">
                <h2>
                  <span className="terms-num">15</span>
                  Governing Law
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of the{" "}
                  <strong>Sultanate of Oman</strong>, without regard to its
                  conflict-of-law principles.
                </p>
                <p>
                  Any disputes arising from these Terms or your use of the
                  Platform shall be subject to the exclusive jurisdiction of
                  the courts of Muscat, Oman.
                </p>
              </section>

              {/* 16 */}
              <section id="changes" className="terms-block">
                <h2>
                  <span className="terms-num">16</span>
                  Changes to Terms
                </h2>
                <p>
                  We may update these Terms from time to time. When we do, we
                  will revise the "Last Updated" date at the top of this page
                  and, for material changes, notify you via email or an
                  in-platform notification.
                </p>
                <p>
                  Continued use of the Platform after any changes constitutes
                  acceptance of the updated Terms.
                </p>
              </section>

              {/* 17 */}
              <section id="contact" className="terms-block">
                <h2>
                  <span className="terms-num">17</span>
                  Contact Us
                </h2>
                <p>
                  For questions regarding these Terms of Service, please
                  contact us:
                </p>
                <div className="terms-contact-card">
                  <div className="terms-contact-item">
                    <i className="fa-solid fa-envelope"></i>
                    <div>
                      <span>Email</span>
                      <a href="mailto:support@FoodTradeLink.com">
                        support@FoodTradeLink.com
                      </a>
                    </div>
                  </div>
                  <div className="terms-contact-item">
                    <i className="fa-solid fa-location-dot"></i>
                    <div>
                      <span>Address</span>
                      <strong>Al Khuwair, Muscat, Sultanate of Oman</strong>
                    </div>
                  </div>
                  <div className="terms-contact-item">
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
        .terms-page {
          background: #f6f8f9;
        }

        /* ====== HERO ====== */
        .terms-hero {
          padding: 80px 0 60px;
          background: linear-gradient(125deg, #eff9f4, #f8fbf9 55%, #e9f5ef);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .terms-hero::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 60px solid rgba(15, 158, 110, 0.04);
          top: -250px;
          right: -100px;
        }
        .terms-eyebrow {
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
        .terms-hero h1 {
          font-family: "Manrope", sans-serif;
          font-size: clamp(32px, 4.5vw, 52px);
          line-height: 1.15;
          letter-spacing: -1.5px;
          color: #13251f;
          margin-bottom: 20px;
        }
        .terms-hero h1 span {
          color: #13795b;
        }
        .terms-hero p {
          font-size: 17px;
          line-height: 1.7;
          color: #71807b;
          max-width: 680px;
          margin: 0 auto 24px;
        }
        .terms-last-updated {
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
        .terms-section {
          padding: 60px 0 90px;
        }
        .terms-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 992px) {
          .terms-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        /* ====== TOC ====== */
        .terms-toc {
          position: sticky;
          top: 100px;
        }
        @media (max-width: 992px) {
          .terms-toc {
            position: static;
          }
        }
        .terms-toc-inner {
          background: white;
          border: 1px solid #e2e9e5;
          border-radius: 16px;
          padding: 24px 20px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .terms-toc-inner h4 {
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
        .terms-toc-inner ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .terms-toc-inner li {
          margin-bottom: 4px;
        }
        .terms-toc-inner a {
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
        .terms-toc-inner a:hover {
          background: #eaf7f1;
          color: #13795b;
          border-left-color: #13795b;
        }

        /* ====== CONTENT ====== */
        .terms-content {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e9e5;
          padding: 40px 44px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 640px) {
          .terms-content {
            padding: 24px 20px;
          }
        }

        .terms-block {
          margin-bottom: 40px;
          scroll-margin-top: 100px;
        }
        .terms-block:last-child {
          margin-bottom: 0;
        }

        .terms-block h2 {
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
        .terms-num {
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

        .terms-block h3 {
          font-family: "Manrope", sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #13251f;
          margin: 24px 0 10px 0;
        }

        .terms-block p {
          font-size: 15px;
          line-height: 1.8;
          color: #33413d;
          margin: 0 0 14px 0;
        }

        .terms-block ul {
          padding-left: 0;
          margin: 0 0 16px 0;
          list-style: none;
        }
        .terms-block ul li {
          font-size: 14.5px;
          line-height: 1.8;
          color: #33413d;
          padding: 6px 0 6px 28px;
          position: relative;
        }
        .terms-block ul li::before {
          content: "";
          position: absolute;
          left: 8px;
          top: 15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1d9a71;
        }

        .terms-block a {
          color: #13795b;
          text-decoration: none;
          font-weight: 600;
          border-bottom: 1px dashed #a7f3d0;
          transition: all 0.2s ease;
        }
        .terms-block a:hover {
          color: #0b5b43;
          border-bottom-style: solid;
        }

        .terms-block strong {
          color: #13251f;
          font-weight: 700;
        }

        /* ====== Contact Card ====== */
        .terms-contact-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 20px;
          padding: 20px;
          background: #f9fbfa;
          border: 1px solid #eef2f0;
          border-radius: 14px;
        }
        .terms-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .terms-contact-item i {
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
        .terms-contact-item div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .terms-contact-item span {
          font-size: 11px;
          font-weight: 800;
          color: #71807b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .terms-contact-item strong,
        .terms-contact-item a {
          font-size: 13.5px;
          color: #13251f;
          font-weight: 700;
          border: none;
        }
        .terms-contact-item a {
          color: #13795b;
        }
      `}</style>
    </div>
  );
}