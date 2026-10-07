// src/components/home/CategoriesSection.js
"use client";

import Link from "next/link";

// نگاشت نام‌های نمایشی → slug واقعی
const SLUG_MAP = {
  Protein: "meat-poultry-game",
  "Legumes, Grains, and Other Foods": "grains-cereals",
  "Dairy and Breakfast": "dairy-eggs",
  "Frozen Foods": "processed-convenience-foods",
  Condiments: "spices-herbs-seasonings",
  "Canned and Ready-Made Food": "beverages",
  "Sweets and Snacks": "bakery-confectionery-snacks",
};

const SHOW = [
  { name: "Meat & Poultry",         slug: "meat-poultry-game",           icon: "fa-drumstick-bite" },
  { name: "Grains & Cereals",       slug: "grains-cereals",              icon: "fa-wheat-awn" },
  { name: "Dairy & Eggs",           slug: "dairy-eggs",                  icon: "fa-cow" },
  { name: "Spices & Seasonings",    slug: "spices-herbs-seasonings",     icon: "fa-pepper-hot" },
  { name: "Sweeteners & Honey",     slug: "sweeteners-sugar-honey",      icon: "fa-jar" },
  { name: "Nuts & Dried Fruits",    slug: "nuts-seeds-dried-fruits",     icon: "fa-seedling" },
];

export default function CategoriesSection() {
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
        {SHOW.map((c) => (
          <Link key={c.slug} href={`/categories/${c.slug}`} className="category-card">
            <div className="category-icon">
              <i className={`fa-solid ${c.icon}`}></i>
            </div>
            <h3>{c.name}</h3>
            <p>Browse products</p>
          </Link>
        ))}
      </div>
    </section>
  );
}