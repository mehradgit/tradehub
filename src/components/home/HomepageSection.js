// src/components/home/HomepageSection.js
import Link from "next/link";
import ProductCard from "./ProductCard";
import RequestCard from "./RequestCard";

const DEFAULT_ICONS = {
  products: "fa-star",
  requests: "fa-shopping-cart",
};

const DEFAULT_LINKS = {
  products: "/products",
  requests: "/requests",
};

export default function HomepageSection({ section, items = [] }) {
  if (!section || section.isActive === false) return null;
  if (!items || items.length === 0) return null;

  const icon = section.icon || DEFAULT_ICONS[section.type] || "fa-star";
  const basePath = DEFAULT_LINKS[section.type] || "/";

  // ساخت لینک View All
  let viewAllLink = basePath;
  if (section.mode === "category" && section.category) {
    const params = new URLSearchParams();
    params.set("category", section.category);
    if (section.subCategory) {
      params.set("subCategory", section.subCategory);
    }
    viewAllLink = `${basePath}?${params.toString()}`;
  }

  return (
    <div className="featured-products-section">
      {/* ===== Header ===== */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className={`fas ${icon}`}></i> {section.title}
          </h2>
          {section.subtitle && (
            <p className="section-subtitle">{section.subtitle}</p>
          )}
        </div>
        <Link href={viewAllLink} className="section-more">
          View All <i className="fas fa-arrow-right"></i>
        </Link>
      </div>

      {/* ===== Body ===== */}
      {section.type === "products" ? (
        <div className="compact-products-grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="requests-grid">
          {items.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}