// src/components/layout/Footer.js
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="footer-logo">
              <Image
                src="/images/logo-foodtradelink-white.svg"
                alt="FoodTradeLink"
                width={200}
                height={50}
              />
            </Link>
            <p style={{ marginTop: "18px", color: "rgba(255,255,255,0.67)", fontSize: "14px", maxWidth: "360px" }}>
              A global B2B marketplace connecting food suppliers, manufacturers, exporters, wholesalers and buyers.
            </p>
          </div>

          <div>
            <h3>For Suppliers</h3>
            <ul className="footer-links">
              <li><Link href="#">Sell Products</Link></li>
              <li><Link href="#">Supplier Membership</Link></li>
              <li><Link href="#">Business Verification</Link></li>
              <li><Link href="#">Marketing Solutions</Link></li>
            </ul>
          </div>

          <div>
            <h3>For Buyers</h3>
            <ul className="footer-links">
              <li><Link href="#">Post Buying Request</Link></li>
              <li><Link href="#">Find Suppliers</Link></li>
              <li><Link href="#">Request Quotations</Link></li>
              <li><Link href="#">Trade Services</Link></li>
            </ul>
          </div>

          <div>
            <h3>Support</h3>
            <ul className="footer-links">
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 FoodTradeLink. All rights reserved.</span>
          <span>Global B2B Food Marketplace</span>
        </div>
      </div>
    </footer>
  );
}