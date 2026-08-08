// src/app/requests/[id]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import RequestGallery from "@/components/requests/RequestGallery";
import RequestTabs from "@/components/requests/RequestTabs";
import CountryFlag from "@/components/ui/CountryFlag";

// ====== تابع دریافت داده‌های درخواست ======
async function getRequest(id) {
  const request = await prisma.buyingRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          companyName: true,
          country: true,
          countryCode: true,
          image: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // درخواست‌های مشابه (همان دسته‌بندی)
  const relatedRequests = await prisma.buyingRequest.findMany({
    where: {
      category: request.category,
      id: { not: request.id },
      isVisible: true,
    },
    take: 4,
    select: {
      id: true,
      title: true,
      description: true,
      isUrgent: true,
      buyerCountry: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { request, relatedRequests };
}

// ====== صفحه اصلی ======
export default async function RequestPage({ params }) {
  const { id } = await params;
  const { request, relatedRequests } = await getRequest(id);

  // تصویر اصلی (از attachments یا placeholder)
  const mainImage =
    request.attachments?.[0] ||
    "https://images.unsplash.com/photo-1587049352851-8d4e8913397e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  const thumbnails = request.attachments?.slice(1) || [];
  const formattedDate = new Date(request.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  const buyerName =
    request.user.companyName || request.user.name || "Anonymous Buyer";

  return (
    <Layout>
      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/requests" style={{ color: "var(--primary)" }}>
                Requests
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link
                href={`/requests?category=${encodeURIComponent(request.category)}`}
                style={{ color: "var(--primary)" }}
              >
                {request.category}
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">
              {request.title}
            </li>
          </ol>
        </nav>

        {/* Request Detail */}
        <div className="request-detail">
          <RequestGallery mainImage={mainImage} thumbnails={thumbnails} />
          <div className="request-info">
            <div className="request-header-info">
              <span
                className={`request-badge-lg ${request.isUrgent ? "urgent" : ""}`}
              >
                {request.isUrgent ? "Urgent" : "Open"}
              </span>
              <span className="request-status">
                <i className="fas fa-check-circle"></i> Verified Buyer
              </span>
            </div>
            <h1>{request.title}</h1>
            <div className="request-meta-grid">
              <div className="meta-item">
                <span className="label">Budget Range</span>
                <span className="value">
                  {request.budgetRange || "Negotiable"}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Deadline</span>
                <span className="value">
                  {request.deadline
                    ? new Date(request.deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Flexible"}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Quantity</span>
                <span className="value">
                  {request.quantity} {request.unit}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Posted</span>
                <span className="value">{formattedDate}</span>
              </div>
            </div>
            <div className="request-description">
              <p>{request.description}</p>
            </div>

            {/* Specifications Table */}
            <table className="request-specs-table">
              <tbody>
                <tr>
                  <td className="label">
                    <i className="fas fa-tag"></i> Product Type
                  </td>
                  <td className="value">{request.category}</td>
                </tr>
                {request.subCategory && (
                  <tr>
                    <td className="label">
                      <i className="fas fa-folder-open"></i> Sub-Category
                    </td>
                    <td className="value">{request.subCategory}</td>
                  </tr>
                )}
                <tr>
                  <td className="label">
                    <i className="fas fa-certificate"></i> Certifications
                  </td>
                  <td className="value">{request.certifications || "—"}</td>
                </tr>
                <tr>
                  <td className="label">
                    <i className="fas fa-box"></i> Packaging
                  </td>
                  <td className="value">{request.packagingReq || "—"}</td>
                </tr>
                <tr>
                  <td className="label">
                    <i className="fas fa-ship"></i> Shipping Terms
                  </td>
                  <td className="value">{request.shippingTerms || "—"}</td>
                </tr>
                <tr>
                  <td className="label">
                    <i className="fas fa-map-pin"></i> Delivery Location
                  </td>
                  <td className="value">{request.deliveryCountry || "—"}</td>
                </tr>
              </tbody>
            </table>

            {/* Buyer Card */}
            <div className="buyer-card">
              <div className="buyer-avatar">
                {request.user.image ? (
                  <img
                    src={request.user.image}
                    alt={buyerName}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <i className="fas fa-user-tie"></i>
                )}
              </div>
              <div className="buyer-details">
                <h4>
                  {buyerName}
                  <span className="buyer-badge">
                    <i className="fas fa-check-circle"></i> Verified
                  </span>
                </h4>
                <div className="sub">
                  {" "}
                  <CountryFlag
                    countryCode={request.user.countryCode}
                    size="16px"
                  />{" "}
                  {request.user.country || "—"} <span className="mx-2">·</span>{" "}
                  <i className="fas fa-calendar-alt"></i> Member since{" "}
                  {new Date(request.user.createdAt).getFullYear()}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ whiteSpace: "nowrap" }}
              >
                Contact Buyer
              </button>
            </div>

            {/* Actions */}
            <div className="request-actions">
              <button className="btn btn-primary">
                <i className="fas fa-paper-plane"></i> Submit Quote
              </button>
              <button className="btn btn-outline-secondary">
                <i className="fas fa-bookmark"></i> Save Request
              </button>
              <button
                className="btn btn-outline-secondary"
                style={{ borderColor: "var(--secondary)" }}
              >
                <i className="fas fa-share-alt"></i> Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <RequestTabs request={request} />

        {/* ====== SIMILAR BUYING REQUESTS ====== */}
        {relatedRequests.length > 0 && (
          <div className="mt-5">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-arrow-right"></i> Similar Buying Requests
              </h2>
              <Link href="/requests" className="section-more">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="compact-requests-grid">
              {relatedRequests.map((relatedRequest) => (
                <Link
                  key={relatedRequest.id}
                  href={`/requests/${relatedRequest.id}`}
                  className="text-decoration-none"
                >
                  <div
                    className={`compact-request-card ${relatedRequest.isUrgent ? "wanted" : ""}`}
                  >
                    <span
                      className={`request-badge-sm ${relatedRequest.isUrgent ? "urgent" : "verified"}`}
                    >
                      {relatedRequest.isUrgent ? "Urgent" : "Verified"}
                    </span>
                    <div className="request-title">{relatedRequest.title}</div>
                    <div className="request-desc">
                      {relatedRequest.description}
                    </div>
                    <div className="request-footer">
                      <span>
                        <i className="far fa-calendar-alt"></i>{" "}
                        {new Date(relatedRequest.createdAt).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" },
                        )}
                      </span>
                      <span>
                        <i className="fas fa-user"></i>{" "}
                        {relatedRequest.buyerCountry}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
