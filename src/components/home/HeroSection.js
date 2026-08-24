// // src/components/home/HeroSection.js
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function HeroSection({ stats }) {
//   const router = useRouter();
//   const [searchQuery, setSearchQuery] = useState("");

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (searchQuery.trim()) {
//       router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
//     }
//   };

//   return (
//     <section className="hero">
//       <div className="container">
//         <div className="hero-content">
//           <div className="hero-text">
//             <h1 className="hero-title">
//               Premium <span>Food</span> Trade Network
//             </h1>
//             <p className="hero-subtitle">
//               Connect with verified suppliers & buyers worldwide. Post requests,
//               discover quality products, and grow your food business.
//             </p>

//             {/* Search Bar */}
//             <form onSubmit={handleSearch} className="search-section">
//               <div className="search-box">
//                 <input
//                   type="text"
//                   className="search-input"
//                   placeholder="Search products, suppliers, or requests..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//                 <button type="submit" className="btn btn-primary search-btn">
//                   <i className="fas fa-search"></i> Search
//                 </button>
//               </div>
//             </form>

//             {/* Stats */}
//             <div className="hero-stats">
//               <div>
//                 <div className="hero-stat-number">{stats?.suppliers || 8200}+</div>
//                 <div className="hero-stat-label">Suppliers</div>
//               </div>
//               <div>
//                 <div className="hero-stat-number">{stats?.buyers || 4500}+</div>
//                 <div className="hero-stat-label">Buyers</div>
//               </div>
//               <div>
//                 <div className="hero-stat-number">{stats?.products || 24000}+</div>
//                 <div className="hero-stat-label">Products</div>
//               </div>
//             </div>
//           </div>

//           <div className="hero-image">
//             <img
//               src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
//               alt="Food Marketplace"
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// src/components/home/HeroSection.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection({ stats }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="hero-new">
      <div className="container">
        <div className="hero-new-grid">
          <div>
            <div className="eyebrow">
              <i className="fa-solid fa-globe"></i>
              GLOBAL B2B FOOD MARKETPLACE
            </div>

            <h1>
              Trade Food Products <br />
              <span>Without Borders.</span>
            </h1>

            <p>
              Connect with verified food suppliers, manufacturers, wholesalers
              and buyers from around the world. Discover products, send
              inquiries and grow your international food business.
            </p>

            <form onSubmit={handleSearch} className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search products, suppliers or food categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                Search
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </form>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{stats?.suppliers || "18,500"}+</strong>
                <span>Verified Suppliers</span>
              </div>
              <div className="hero-stat">
                <strong>{stats?.products || "72,000"}+</strong>
                <span>Food Products</span>
              </div>
              <div className="hero-stat">
                <strong>{stats?.countries || "120"}+</strong>
                <span>Countries</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            {/* ✅ تصویر از سرور محلی */}
            <img
              src="/images/hero.jpg"
              alt="Global food marketplace"
            />
            <div className="floating-card">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Verified Trading</strong>
                <small>Trusted B2B connections</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}