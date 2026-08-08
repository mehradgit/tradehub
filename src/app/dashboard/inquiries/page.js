// src/app/dashboard/inquiries/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

export default async function InquiriesPage({ searchParams }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { tab = "buyer" } = await searchParams;

  const inquiries = await prisma.productInquiry.findMany({
    where: {
      [tab === "buyer" ? "userId" : "supplierId"]: session.user.id,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          unit: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
          companyName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
    <Layout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-0">
              <i className="fas fa-file-invoice me-2" style={{ color: "var(--primary)" }}></i>
              My Inquiries
            </h1>
            <p className="text-muted">Manage your product inquiries</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-3 mb-4 border-bottom pb-2">
          <Link
            href="/dashboard/inquiries?tab=buyer"
            className={`fw-bold text-decoration-none px-3 py-2 rounded-pill ${
              tab === "buyer" ? "bg-primary text-white" : "text-muted"
            }`}
          >
            As Buyer
          </Link>
          <Link
            href="/dashboard/inquiries?tab=supplier"
            className={`fw-bold text-decoration-none px-3 py-2 rounded-pill ${
              tab === "supplier" ? "bg-primary text-white" : "text-muted"
            }`}
          >
            As Supplier
          </Link>
        </div>

        {inquiries.length > 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={inquiry.product.images?.[0] || "https://via.placeholder.com/40"}
                          alt={inquiry.product.name}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                        <span className="fw-semibold">{inquiry.product.name}</span>
                      </div>
                    </td>
                    <td>
                      {tab === "buyer"
                        ? inquiry.supplier?.companyName || inquiry.supplier?.name || "—"
                        : inquiry.user?.companyName || inquiry.user?.name || "—"}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-invoice fa-3x text-muted mb-3"></i>
            <h3>No inquiries yet</h3>
            <p className="text-muted">
              {tab === "buyer"
                ? "You haven't sent any product inquiries yet."
                : "You haven't received any product inquiries yet."}
            </p>
            {tab === "buyer" && (
              <Link href="/products" className="btn btn-primary">
                <i className="fas fa-search me-2"></i>Browse Products
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}