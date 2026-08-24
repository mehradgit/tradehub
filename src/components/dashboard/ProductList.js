// src/components/dashboard/ProductList.js
"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

export default function ProductList({ products: initialProducts }) {
  const [products, setProducts] = useState(initialProducts);

  const getStatusBadge = (product) => {
    if (!product.isVisible) {
      return <span className="badge bg-secondary">Suspended</span>;
    }
    if (product.stock === 0 || product.stock === null) {
      return <span className="badge bg-warning text-dark">Sold Out</span>;
    }
    return <span className="badge bg-success">Active</span>;
  };

  const getStatusClass = (product) => {
    if (!product.isVisible) return "suspended";
    if (product.stock === 0 || product.stock === null) return "sold-out";
    return "active";
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, isVisible: !currentStatus } : p
        )
      );
      toast.success(
        `Product ${!currentStatus ? "activated" : "suspended"} successfully`
      );
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  return (
    <div className="dashboard-product-list">
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const imageUrl = product.images?.[0] || "https://via.placeholder.com/50x50";
              return (
                <tr key={product.id} className={`product-row ${getStatusClass(product)}`}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="product-thumb-img"
                      />
                      <div>
                        <div className="fw-bold">{product.name}</div>
                        <small className="text-muted">{product.badge || "No badge"}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category || "—"}</td>
                  <td>
                    ${product.price} <span className="text-muted">/{product.unit}</span>
                  </td>
                  <td>{product.stock ?? "—"}</td>
                  <td>{getStatusBadge(product)}</td>
                  <td>{product.views || 0}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        className="btn btn-sm btn-outline-primary"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <Link
                        href={`/products/${product.id}`}
                        target="_blank"
                        className="btn btn-sm btn-outline-secondary"
                        title="View"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button
                        onClick={() => handleToggleVisibility(product.id, product.isVisible)}
                        className={`btn btn-sm ${
                          product.isVisible ? "btn-outline-warning" : "btn-outline-success"
                        }`}
                        title={product.isVisible ? "Suspend" : "Activate"}
                      >
                        <i className={`fas ${product.isVisible ? "fa-pause" : "fa-play"}`}></i>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}