// src/components/home/ProductCard.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || "https://via.placeholder.com/242x209";

  const formatPrice = (price) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (!num && num !== 0) return null;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const priceDisplay = formatPrice(product.price);
  const currency = product.currency || "USD";
  const unit = product.unit ? `/${product.unit}` : "";

  return (
    <Link
      href={`/products/${product.productNumber}/${product.slug}`}
      className="product-card-modern-link"
    >
      <div className="product-card-modern">
        {/* Image with the Enquire Now button */}
        <div className="product-card-modern-image-wrapper">
          <div className="product-card-modern-image">
            <img src={imageUrl} alt={product.name} />
            <div className="product-card-modern-overlay"></div>
          </div>
          <div className="product-card-modern-btn-wrapper">
            <button className="btn-enquire">Enquire Now</button>
          </div>
        </div>

        {/* Details */}
        <div className="product-card-modern-body">
          <div className="product-card-modern-category">
            {product.category || "Food Products"}
          </div>

          <h3 className="product-card-modern-title">{product.name}</h3>

          <div className="product-card-modern-underline" />

          {/* Price */}
          {priceDisplay && (
            <div className="product-card-modern-price">
              <span className="price-currency">{currency}</span>
              <span className="price-amount">{priceDisplay}</span>
              {unit && <span className="price-unit">{unit}</span>}
            </div>
          )}

          <div className="product-card-modern-company">
            <span>Company:</span>
            <span>{product.user?.companyName || "Unknown"}</span>
          </div>

          <div className="product-card-modern-country">
            <CountryFlag countryCode={product.countryCode} size="20px" />
            <span>{product.country || "—"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}