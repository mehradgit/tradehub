// src/components/suppliers/SupplierProducts.js
"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";

export default function SupplierProducts({ products, totalProducts }) {
  const [showAll, setShowAll] = useState(false);
  const displayProducts = showAll ? products : products.slice(0, 6);

  return (
    <div className="supplier-products">
      <div className="section-header">
        <h3 className="section-title">
          <i className="fas fa-box"></i>
          Products ({totalProducts})
        </h3>
      </div>

      {products.length > 0 ? (
        <>
          <div className="compact-products-grid">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length > 6 && !showAll && (
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-secondary rounded-pill px-4"
                onClick={() => setShowAll(true)}
              >
                Show All {totalProducts} Products
                <i className="fas fa-chevron-down ms-2"></i>
              </button>
            </div>
          )}

          {showAll && (
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-secondary rounded-pill px-4"
                onClick={() => setShowAll(false)}
              >
                Show Less
                <i className="fas fa-chevron-up ms-2"></i>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted">No products listed yet.</p>
        </div>
      )}
    </div>
  );
}