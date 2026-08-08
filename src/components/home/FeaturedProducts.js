// // src/components/home/FeaturedProducts.js
// "use client";

// import { useState } from "react";
// import ProductCard from "./ProductCard";
// import RequestCard from "./RequestCard";

// export default function FeaturedProducts({ products, requests }) {
//   const [activeTab, setActiveTab] = useState("all");

//   const tabs = ["All Products", "Best Sellers", "New Arrivals", "Discounted", "Special Offers"];

//   // ✅ فیلتر کردن آیتم‌های undefined از آرایه‌ها
//   const validProducts = products?.filter(Boolean) || [];
//   const validRequests = requests?.filter(Boolean) || [];

//   return (
//     <div className="mb-5">
//       {/* ====== بخش محصولات ====== */}
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <h3 className="fw-bold">
//           <i className="fas fa-star me-2" style={{ color: "var(--color-primary, #e85d3a)" }}></i>
//           Featured Products
//         </h3>
//         <a href="/products" className="text-decoration-none fw-semibold">
//           View All <i className="fas fa-arrow-right ms-1"></i>
//         </a>
//       </div>

//       {/* Tabs */}
//       <div className="d-flex flex-wrap gap-2 mb-4">
//         {tabs.map((tab) => (
//           <button
//             key={tab}
//             className={`btn ${activeTab === tab.toLowerCase() ? "btn-primary" : "btn-outline-secondary"} rounded-pill px-3 py-1`}
//             onClick={() => setActiveTab(tab.toLowerCase())}
//           >
//             {tab}
//           </button>
//         ))}
//       </div>

//       {/* Products Grid */}
//       {validProducts.length > 0 ? (
//         <div className="row g-3">
//           {validProducts.map((product) => (
//             <div key={product.id} className="col-6 col-md-4 col-lg-2">
//               <ProductCard product={product} />
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-4">
//           <p className="text-muted">No products found</p>
//         </div>
//       )}

//       {/* ====== بخش درخواست‌های خرید ====== */}
//       <div className="mt-5 pt-3">
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h3 className="fw-bold">
//             <i className="fas fa-shopping-cart me-2" style={{ color: "var(--color-primary, #e85d3a)" }}></i>
//             Buying Requests
//           </h3>
//           <a href="/requests" className="text-decoration-none fw-semibold">
//             View All <i className="fas fa-arrow-right ms-1"></i>
//           </a>
//         </div>

//         {validRequests.length > 0 ? (
//           <div className="row g-3">
//             {validRequests.map((request) => (
//               <div key={request.id} className="col-md-6 col-lg-3">
//                 <RequestCard request={request} />
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-4">
//             <p className="text-muted">No buying requests found</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// src/components/home/FeaturedProductsModern.js
"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";

export default function FeaturedProductsModern({ products }) {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = ["All", "Newest", "Organic", "Best Sellers"];

  // فیلتر محصولات (در صورت نیاز)
  const filteredProducts = products || [];

  return (
    <div className="featured-products-modern">
      {/* عنوان */}
      <div className="featured-products-modern-header">
        <h2>
          Discover nature's <span>newest products</span>
        </h2>
      </div>

      {/* تب‌ها */}
      <div className="featured-products-modern-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab.toLowerCase() ? "active" : ""}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* گرید محصولات */}
      <div className="featured-products-modern-grid">
        {filteredProducts.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}