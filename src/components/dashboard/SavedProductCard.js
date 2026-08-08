// src/components/dashboard/SavedProductCard.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

export default function SavedProductCard({ product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUnsave = async () => {
    if (!confirm("Remove this product from saved?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/saved-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      router.refresh(); // Refresh the page to update list
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0 hover-shadow transition">
      <div
        className="card-img-top"
        style={{
          height: "180px",
          backgroundImage: `url(${product.images?.[0] || "https://via.placeholder.com/300x200"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="card-body">
        <h5 className="card-title fw-bold text-dark">{product.name}</h5>
        <p className="card-text text-muted small">
          {product.shortDesc?.slice(0, 80)}...
        </p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fw-bold text-primary">
            ${product.price}/{product.unit}
          </span>
          <span className="text-muted small">
            {product.user?.companyName || "Unknown Supplier"}
          </span>
        </div>
      </div>
      <div className="card-footer bg-white border-0 d-flex gap-2">
        <Link href={`/products/${product.id}`} className="btn btn-primary btn-sm flex-grow-1">
          <i className="fas fa-eye me-1"></i> View
        </Link>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={handleUnsave}
          disabled={loading}
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
        </button>
      </div>
    </div>
  );
}