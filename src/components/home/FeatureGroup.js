// src/components/home/FeatureGroup.js
import Link from "next/link";

export default function FeatureGroup() {
  return (
    <section className="section">
      <div className="feature-group">
        <div className="group-image"></div>
        <div className="group-content">
          <h2>Premium Spices & Saffron</h2>
          <p>
            Discover premium spices, saffron, herbs and natural ingredients from
            trusted global producers.
          </p>
          <div className="group-list">
            <div>
              <i className="fa-solid fa-check"></i> Export Quality
            </div>
            <div>
              <i className="fa-solid fa-check"></i> Verified Suppliers
            </div>
            <div>
              <i className="fa-solid fa-check"></i> Bulk Wholesale
            </div>
            <div>
              <i className="fa-solid fa-check"></i> Global Shipping
            </div>
          </div>
          <Link href="/products" className="btn btn-primary">
            Explore Spice Products
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}