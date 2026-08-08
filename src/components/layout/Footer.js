// src/components/layout/Footer.js
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-5" style={{ background: "#1e1916", color: "white" }}>
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-3">
            <h4 className="fw-bold mb-3">
              Food<span style={{ color: "var(--color-secondary, #f4b942)" }}>Hub</span>
            </h4>
            <p className="text-white-50" style={{ fontSize: "14px" }}>
              The global B2B food marketplace. Connect, trade, grow.
            </p>
          </div>
          <div className="col-md-3">
            <h5 className="fw-bold mb-3">For Suppliers</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Sell on Platform
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Memberships
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Marketing Solutions
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5 className="fw-bold mb-3">For Buyers</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Post Request
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Find Suppliers
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Quality Inspection
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5 className="fw-bold mb-3">Support</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Help Center
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Contact Us
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white-50 text-decoration-none">
                  <i className="fas fa-chevron-right me-2" style={{ color: "var(--color-secondary, #f4b942)", fontSize: "10px" }}></i>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-top border-secondary border-opacity-25 pt-3 mt-3 text-center">
          <p className="text-white-50 small">
            © 2026 FoodHub. All rights reserved. | B2B Food Marketplace
          </p>
        </div>
      </div>
    </footer>
  );
}