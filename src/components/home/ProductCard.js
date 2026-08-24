// src/components/home/ProductCardModern.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import OrangeLine from "../ui/OrangeLine";
import { getCountryName } from "@/lib/countries";

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || "https://via.placeholder.com/242x209";

  return (
    <Link
      href={`/products/${product.productNumber}/${product.slug}`}
      className="product-card-modern-link"
    >
      <div className="product-card-modern">
        {/* تصویر با دکمه Enquire Now */}
        <div className="product-card-modern-image-wrapper">
          <div className="product-card-modern-image">
            <img src={imageUrl} alt={product.name} />
            {/* لایه شفاف روی تصویر (در hover ظاهر می‌شود) */}
            <div className="product-card-modern-overlay"></div>
          </div>
          {/* دکمه Enquire Now - در hover از پایین به مرکز می‌آید */}
          <div className="product-card-modern-btn-wrapper">
            <button className="btn-enquire">Enquire Now</button>
          </div>
        </div>

        {/* اطلاعات */}
        <div className="product-card-modern-body">
          <div className="product-card-modern-category">
            {product.category || "Food Products"}
          </div>
          <h3 className="product-card-modern-title">{product.name}</h3>
          {/* ✅ خط نارنجی زیر نام محصول */}
          <div className="product-card-modern-underline" />{" "}
          <div className="product-card-modern-company">
            <span>Company:</span>
            <span>{product.user?.companyName || "Unknown"}</span>
          </div>
          <div className="product-card-modern-country">
            <CountryFlag countryCode={product.countryCode} size="20px" />
            <span> {product.country || "—"} </span>
            {/* <span>{product.country || "—"}</span> */}
          </div>
        </div>
      </div>
    </Link>
  );
}
