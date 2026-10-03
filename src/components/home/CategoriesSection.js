// src/components/home/CategoriesSection.js
"use client";

import Link from "next/link";
import { categories } from "@/lib/categories"; // ✅ استفاده از فایل جامع دسته‌ها

export default function CategoriesSection() {
  // ====== استخراج دسته‌های اصلی (حداکثر ۶ مورد) ======
  const mainCategories = categories
    .filter((c) => c.parent === 0)
    .slice(0, 6);

  // ====== نقشه‌ی آیکون‌ها برای دسته‌های مشخص ======
  const iconMap = {
    Protein: "fa-drumstick-bite",
    "Legumes, Grains, and Other Foods": "fa-wheat-awn",
    "Dairy and Breakfast": "fa-cow",
    "Frozen Foods": "fa-snowflake",
    Condiments: "fa-pepper-hot",
    "Canned and Ready-Made Food": "fa-can-food",
    "Sweets and Snacks": "fa-candy-cane", // در صورت نیاز به ۷ ام
  };

  return (
    <section className="categories-section mb-5">
      <div className="section-heading">
        <div>
          <h2>Explore Food Categories</h2>
          <p>Find reliable suppliers across major food industries.</p>
        </div>
        <Link href="/products" className="view-all">
          <span>View All Categories</span>
          <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>

      <div className="categories-grid">
        {mainCategories.map((category, index) => (
          <Link
            href={`/products?category=${encodeURIComponent(category.id)}`}
            key={category.id}
            className="category-card"
          >
            <div className="category-icon">
              <i className={`fa-solid ${iconMap[category.name] || "fa-tag"}`}></i>
            </div>
            <h3>{category.name}</h3>
            <p>20K+ products</p> {/* متن ثابت مطابق HTML نمونه */}
          </Link>
        ))}
      </div>
    </section>
  );
}