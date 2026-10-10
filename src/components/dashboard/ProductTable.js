// src/components/dashboard/ProductTable.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { PRODUCT_PLACEHOLDER } from "@/lib/imageHelpers";

export default function ProductTable({ products }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // ====== Determine the product status with a modern style ======
  const getStatusInfo = (product) => {
    if (product.status === "PENDING") {
      return {
        type: "pending",
        label: "Pending Review",
        icon: "fa-clock",
        bg: "#fff7e6",
        color: "#b45309",
        border: "#fde68a",
      };
    }
    if (product.status === "REJECTED") {
      return {
        type: "rejected",
        label: "Rejected",
        icon: "fa-times-circle",
        bg: "#fef2f2",
        color: "#b91c1c",
        border: "#fecaca",
      };
    }
    if (product.status === "APPROVED") {
      if (!product.isVisible) {
        return {
          type: "hidden",
          label: "Hidden",
          icon: "fa-eye-slash",
          bg: "#f1f5f9",
          color: "#475569",
          border: "#cbd5e1",
        };
      }
      if (product.stock === 0) {
        return {
          type: "soldout",
          label: "Sold Out",
          icon: "fa-box-open",
          bg: "#fff7e6",
          color: "#92400e",
          border: "#fde68a",
        };
      }
      return {
        type: "active",
        label: "Active",
        icon: "fa-check-circle",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
      };
    }
    // Fallback
    return {
      type: "active",
      label: "Active",
      icon: "fa-check-circle",
      bg: "#ecfdf5",
      color: "#047857",
      border: "#a7f3d0",
    };
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <div className="table-title">My Products</div>
          <div className="card-subtitle">
            Manage your products and monitor their performance
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard/products" className="view-all">
            View All <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Status</th>
              <th>Views</th>
              <th>Inquiries</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = getStatusInfo(product);
              const imageUrl =
                product.images?.[0] || PRODUCT_PLACEHOLDER;
              const inquiryCount = product._count?.inquiries || 0;

              return (
                <tr key={product.id}>
                  <td>
                    <div className="product">
                      <img
                        className="product-img"
                        src={imageUrl}
                        alt={product.name}
                      />
                      <div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-category">
                          {product.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="price">${product.price}</span>{" "}
                    <span className="unit">/ {product.unit}</span>
                  </td>
                  <td>
                    {/* Modern status badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 11px",
                        borderRadius: 50,
                        background: status.bg,
                        color: status.color,
                        border: `1px solid ${status.border}`,
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <i
                        className={`fas ${status.icon}`}
                        style={{ fontSize: 10 }}
                      ></i>
                      {status.label}
                    </span>

                    {/* Rejection reason, if any */}
                    {status.type === "rejected" && product.rejectionNote && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 10,
                          color: "#991b1b",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 4,
                          maxWidth: 200,
                        }}
                        title={product.rejectionNote}
                      >
                        <i
                          className="fas fa-info-circle"
                          style={{ marginTop: 2, flexShrink: 0 }}
                        ></i>
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {product.rejectionNote}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <i className="fa-regular fa-eye"></i> {product.views || 0}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/inquiries?productId=${product.id}`}
                      className="view-all"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      <i className="fa-regular fa-envelope"></i> {inquiryCount}
                    </Link>
                  </td>
                  <td>
                    <div className="actions">
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        className="action-btn"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </Link>
                      <Link
                        href={`/products/${product.productNumber}/${product.slug}`}
                        target="_blank"
                        className="action-btn"
                        title="View"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </Link>
                      <button
                        className="action-btn delete"
                        title="Delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
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