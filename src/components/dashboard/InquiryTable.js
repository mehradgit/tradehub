// src/components/dashboard/InquiryTable.js
"use client";

import { useState } from "react";
import Link from "next/link";
import InquiryModal from "./InquiryModal";
import { PRODUCT_PLACEHOLDER } from "@/lib/imageHelpers";

export default function InquiryTable({ inquiries, tab }) {
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-warning text-dark",
      responded: "bg-info text-white",
      accepted: "bg-success text-white",
      rejected: "bg-danger text-white",
    };
    return colors[status] || "bg-secondary text-white";
  };

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>{tab === "buyer" ? "Supplier" : "Buyer"}</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => {
              const company =
                tab === "buyer"
                  ? inquiry.supplier?.companyName || inquiry.supplier?.name || "—"
                  : inquiry.user?.companyName || inquiry.user?.name || "—";
              const companyId =
                tab === "buyer" ? inquiry.supplier?.id : inquiry.user?.id;
              return (
                <tr key={inquiry.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={inquiry.product.images?.[0] || PRODUCT_PLACEHOLDER}
                        alt={inquiry.product.name}
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                      {/* Link to the product page */}
                      <Link
                        href={`/products/${inquiry.product.id}`}
                        className="fw-semibold text-decoration-none"
                        style={{ color: "var(--primary)" }}
                        target="_blank"
                      >
                        {inquiry.product.name}
                      </Link>
                    </div>
                  </td>
                  <td>
                    {/* Link to the company/seller profile */}
                    {companyId ? (
                      <Link
                        href={`/profile/${companyId}`}
                        className="text-decoration-none"
                        style={{ color: "var(--gray-dark)" }}
                        target="_blank"
                      >
                        {company}
                      </Link>
                    ) : (
                      company
                    )}
                  </td>
                  <td>{inquiry.quantity || "—"}</td>
                  <td>
                    {inquiry.requestedPrice
                      ? `$${inquiry.requestedPrice}`
                      : "—"}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(inquiry.status)} px-3 py-2`}>
                      {inquiry.status}
                    </span>
                  </td>
                  <td>
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {/* Details button */}
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <i className="fas fa-info-circle me-1"></i> Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details modal */}
      <InquiryModal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        inquiry={selectedInquiry}
        tab={tab}
      />
    </>
  );
}