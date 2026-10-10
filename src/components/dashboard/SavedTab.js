// src/components/dashboard/SavedTab.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCT_PLACEHOLDER } from "@/lib/imageHelpers";

export default function SavedTab({ products, requests }) {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div>
      <div className="d-flex gap-3 mb-4 border-bottom pb-2">
        <button
          className={`fw-bold btn btn-sm ${activeTab === "products" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setActiveTab("products")}
        >
          Products ({products.length})
        </button>
        <button
          className={`fw-bold btn btn-sm ${activeTab === "requests" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setActiveTab("requests")}
        >
          Buying Requests ({requests.length})
        </button>
      </div>

      <div className="row g-3">
        {activeTab === "products" ? (
          products.length > 0 ? (
            products.map(({ product }) => (
              <div key={product.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0">
                  <img
                    src={product.images?.[0] || PRODUCT_PLACEHOLDER}
                    className="card-img-top"
                    style={{ height: "180px", objectFit: "cover" }}
                    alt={product.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title fw-bold">{product.name}</h5>
                    <p className="card-text text-muted small">
                      {product.shortDesc?.slice(0, 80)}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-primary">${product.price}/{product.unit}</span>
                      <span className="text-muted small">{product.user?.companyName || "Unknown"}</span>
                    </div>
                    <div className="mt-3 d-flex gap-2">
                      <Link href={`/products/${product.id}`} className="btn btn-primary btn-sm flex-grow-1">
                        <i className="fas fa-eye me-1"></i> View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 col-12">
              <p className="text-muted">No saved products.</p>
            </div>
          )
        ) : (
          requests.length > 0 ? (
            requests.map(({ request }) => (
              <div key={request.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body">
                    <h5 className="card-title fw-bold">{request.title}</h5>
                    <p className="card-text text-muted small">
                      {request.description?.slice(0, 80)}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">{request.category || "Uncategorized"}</span>
                      <span className="badge bg-warning text-dark">{request.isUrgent ? "Urgent" : "Open"}</span>
                    </div>
                    <div className="mt-3 d-flex gap-2">
                      <Link href={`/requests/${request.id}`} className="btn btn-primary btn-sm flex-grow-1">
                        <i className="fas fa-eye me-1"></i> View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 col-12">
              <p className="text-muted">No saved buying requests.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}