// src/components/dashboard/ProductTable.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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

  const getStatus = (product) => {
    if (!product.isVisible) return { label: "Suspended", className: "sold" };
    if (product.stock === 0) return { label: "Sold Out", className: "sold" };
    return { label: "Active", className: "active" };
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
          {/* <Link href="/products/new" className="view-all">
            Add New Product <i className="fa-solid fa-arrow-right"></i>
          </Link> */}
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
              const status = getStatus(product);
              const imageUrl =
                product.images?.[0] || "https://placehold.co/42x42";
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
                    <span className={`status ${status.className}`}>
                      <span className="status-dot"></span> {status.label}
                    </span>
                  </td>
                  <td>
                    <i className="fa-regular fa-eye"></i> {product.views || 0}
                  </td>
                  <td>
                    {/* ✅ لینک به صفحه درخواست‌ها با فیلتر productId */}
                    <Link
                      href={`/dashboard/inquiries?productId=${product.id}`}
                      className="view-all"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      <i className="fa-regular fa-envelope"></i> {inquiryCount}
                      <span
                        style={{
                          fontSize: "10px",
                          marginLeft: "4px",
                          color: "var(--gray)",
                        }}
                      >
                        (View Details)
                      </span>
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
