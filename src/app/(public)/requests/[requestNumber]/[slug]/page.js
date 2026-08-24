// src/app/(public)/requests/[requestNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RequestGallery from "@/components/requests/RequestGallery";
import CountryFlag from "@/components/ui/CountryFlag";
import RequestActions from "@/components/requests/RequestActions";
import ViewTracker from "@/components/ui/ViewTracker";
import { getCountryViaCode } from "@/lib/countries";

// ====== دریافت داده‌ها با استفاده از requestNumber ======
async function getRequest(requestNumber) {
  const request = await prisma.buyingRequest.findUnique({
    where: { requestNumber },
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
          profileNumber: true, // ✅ برای لینک پروفایل
          slug: true, // ✅ برای لینک پروفایل
        },
      },
    },
  });

  if (!request) notFound();

  // ✅ تبدیل ایمن attachments (چون در اسکیما از نوع Json است)
  let attachments = [];
  if (request.attachments) {
    if (Array.isArray(request.attachments)) {
      attachments = request.attachments;
    } else if (typeof request.attachments === "string") {
      try {
        attachments = JSON.parse(request.attachments);
      } catch {
        attachments = [];
      }
    }
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
      requestNumber: true, // ✅ برای لینک
      slug: true, // ✅ برای لینک
    },
    orderBy: { createdAt: "desc" },
  });

  return { request, relatedRequests, attachments };
}

// ====== متادیتا ======
export async function generateMetadata({ params }) {
  const { requestNumber } = await params;
  const request = await prisma.buyingRequest.findUnique({
    where: { requestNumber: parseInt(requestNumber) },
    select: { title: true, category: true },
  });
  if (!request) return { title: "Request Not Found" };
  return {
    title: `${request.title} | B2B Food Hub`,
    description: `View buying request details for ${request.title}`,
  };
}

// ====== صفحه اصلی ======
export default async function RequestPage({ params }) {
  const { requestNumber } = await params;
  const requestNum = parseInt(requestNumber);
  const { request, relatedRequests, attachments } =
    await getRequest(requestNum);
  const hasImages = attachments.length > 0;

  const buyer = {
    id: request.user.id,
    name: request.user.companyName || request.user.name || "Anonymous Buyer",
    // سایر فیلدهای مورد نیاز برای ConnectModal
  };
  // تاریخ‌ها را در سرور فرمت می‌کنیم تا روی کلاینت دچار هیدریشن نشویم
  const postedDate = new Date(request.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const deadlineDate = request.deadline
    ? new Date(request.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Flexible";

  const buyerName =
    request.user.companyName || request.user.name || "Anonymous Buyer";

  // تصویر اصلی از attachments یا فال‌بک
  const mainImage =
    attachments.length > 0
      ? attachments[0]
      : "https://images.unsplash.com/photo-1587049352851-8d4e8913397e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  const thumbnails = attachments.slice(1);

  return (
    <>
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
            {/* ✅ دسته‌بندی محصول */}
            <li className="breadcrumb-item">
              <Link
                href={`/requests?category=${encodeURIComponent(request.category)}`}
                style={{ color: "var(--primary)" }}
              >
                {request.category}
              </Link>
            </li>
            {/* ✅ زیردسته محصول (در صورت وجود) */}
            {request.subCategory && (
              <li className="breadcrumb-item">
                <Link
                  href={`/requests?category=${encodeURIComponent(request.category)}`}
                  style={{ color: "var(--primary)" }}
                >
                  {request.subCategory}
                </Link>
              </li>
            )}
            <li
              className="breadcrumb-item active text-muted"
              aria-current="page"
            >
              {request.title}
            </li>
          </ol>
        </nav>

        {/* Request Detail Grid */}
        <div className="request-detail">
          {/* گالری تصاویر */}
          <RequestGallery
            mainImage={mainImage}
            thumbnails={thumbnails}
            hasImages={hasImages}
          />

          {/* اطلاعات درخواست */}
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

            {/* اطلاعات متا */}
            <div className="request-meta-grid">
              <div className="meta-item">
                <span className="label">Budget</span>
                <span className="value">
                  {request.budgetRange || "Negotiable"}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Deadline</span>
                <span className="value">{deadlineDate}</span>
              </div>
              <div className="meta-item">
                <span className="label">Quantity</span>
                <span className="value">
                  {request.quantity} {request.unit}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Posted</span>
                <span className="value">{postedDate}</span>
              </div>
            </div>

            {/* توضیحات */}
            <div className="request-description">
              <p>{request.description}</p>
            </div>

            {/* جدول مشخصات */}
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
                  <td className="value">
                    <CountryFlag
                      countryCode={getCountryViaCode(request.deliveryCountry)}
                      size="14px"
                    />
                    <span style={{ marginLeft: "4px" }}>
                      {request.deliveryCountry || "—"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* کارت خریدار */}
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
                  <CountryFlag
                    countryCode={request.user.countryCode}
                    size="16px"
                  />{" "}
                  {request.user.country || "—"} <span className="mx-2">·</span>{" "}
                  <i className="fas fa-calendar-alt"></i> Member since{" "}
                  {new Date(request.user.createdAt).getFullYear()}
                </div>
              </div>
              {/* ✅ لینک به پروفایل با ساختار جدید */}
              <Link
                href={`/profiles/${request.user.profileNumber}/${request.user.slug}`}
                className="btn btn-secondary"
                style={{ whiteSpace: "nowrap" }}
              >
                Company Information
              </Link>
            </div>

            {/* دکمه‌های اقدام */}
            <RequestActions request={request} buyer={buyer} />
          </div>
        </div>

        {/* ====== درخواست‌های مشابه ====== */}
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
              {relatedRequests.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/requests/${rel.requestNumber}/${rel.slug}`}
                  className="text-decoration-none"
                >
                  <div
                    className={`compact-request-card ${rel.isUrgent ? "wanted" : ""}`}
                  >
                    <span
                      className={`request-badge-sm ${rel.isUrgent ? "urgent" : "verified"}`}
                    >
                      {rel.isUrgent ? "Urgent" : "Verified"}
                    </span>
                    <div className="request-title">{rel.title}</div>
                    <div className="request-desc">{rel.description}</div>
                    <div className="request-footer">
                      <span>
                        <i className="far fa-calendar-alt"></i>{" "}
                        {new Date(rel.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        <i className="fas fa-user"></i> {rel.buyerCountry}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <ViewTracker type="request" id={request.id} />
    </>
  );
}
