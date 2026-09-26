// src/app/(public)/requests/[requestNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RequestGallery from "@/components/requests/RequestGallery";
import CountryFlag from "@/components/ui/CountryFlag";
import RequestActions from "@/components/requests/RequestActions";
import BuyerInfoSection from "@/components/requests/BuyerInfoSection";
import ViewTracker from "@/components/ui/ViewTracker";
import { getCountryName, getCountryViaCode } from "@/lib/countries";
import { auth } from "@/auth";
import {
  getSectionSettings,
  canViewBuyerInfo,
  hasRevealedBuyerInfo,
} from "@/lib/accessControlService";

// ====== دریافت داده‌ها ======
async function getRequest(requestNumber) {
  const numericNumber = parseInt(requestNumber);
  if (isNaN(numericNumber)) return null;

  const request = await prisma.buyingRequest.findUnique({
    where: { requestNumber: numericNumber },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          companyName: true,
          country: true,
          countryCode: true,
          image: true,
          logo: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) return null;

  // Parse attachments safely
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

  // Parse supplierCountries safely
  let supplierCountries = ["WORLDWIDE"];
  if (request.supplierCountries) {
    if (Array.isArray(request.supplierCountries)) {
      supplierCountries = request.supplierCountries;
    } else if (typeof request.supplierCountries === "string") {
      try {
        supplierCountries = JSON.parse(request.supplierCountries);
      } catch {
        supplierCountries = ["WORLDWIDE"];
      }
    }
  }

  // درخواست‌های مشابه
  const relatedRequests = await prisma.buyingRequest.findMany({
    where: {
      category: request.category,
      id: { not: request.id },
      isVisible: true,
      status: "APPROVED",
    },
    take: 4,
    select: {
      id: true,
      title: true,
      description: true,
      isUrgent: true,
      buyerCountry: true,
      createdAt: true,
      requestNumber: true,
      slug: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { request, relatedRequests, attachments, supplierCountries };
}

// ====== متادیتا ======
export async function generateMetadata({ params }) {
  const { requestNumber } = await params;
  const numericNumber = parseInt(requestNumber);
  if (isNaN(numericNumber)) return { title: "Request Not Found" };

  const request = await prisma.buyingRequest.findUnique({
    where: { requestNumber: numericNumber },
    select: { title: true, category: true },
  });

  if (!request) return { title: "Request Not Found" };

  return {
    title: `${request.title} | B2B Food Hub`,
    description: `View buying request details for ${request.title}`,
  };
}

// ====== صفحه ======
export default async function RequestPage({ params }) {
  const { requestNumber } = await params;
  const data = await getRequest(requestNumber);

  if (!data) notFound();

  const { request, relatedRequests, attachments, supplierCountries } = data;

  // ====== بررسی دسترسی ======
  const session = await auth();
  // ✅ نام‌گذاری شفاف: این متغیر همان settings.request است
  const requestSettings = await getSectionSettings("request");
  const buyerInfoPermission = await canViewBuyerInfo(
    session?.user?.id,
    request,
  );

  // ====== بررسی Reveal قبلی ======
  const alreadyRevealed =
    session?.user?.id && request.user.id !== session.user.id
      ? await hasRevealedBuyerInfo(session.user.id, request.id)
      : false;

  // ====== آیا باید خودکار باز شود؟ ======
  const shouldAutoReveal =
    buyerInfoPermission.allowed &&
    (buyerInfoPermission.reason === "owner" ||
      buyerInfoPermission.reason === "admin" ||
      buyerInfoPermission.reason === "already_revealed" ||
      buyerInfoPermission.reason === "guest_allowed" ||
      buyerInfoPermission.reason === "everyone" ||
      buyerInfoPermission.reason === "loggedIn" ||
      requestSettings?.buyerInfo?.consumeQuotaOnReveal === false);

  // ====== تاریخ‌ها ======
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

  const hasImages = attachments.length > 0;
  const mainImage = hasImages ? attachments[0] : null;
  const thumbnails = hasImages ? attachments.slice(1) : [];

  const buyer = {
    id: request.user.id,
    name: buyerName,
  };

  // ====== نمایش Suppliers From ======
  const renderSupplierCountries = () => {
    if (!Array.isArray(supplierCountries) || supplierCountries.length === 0) {
      return "Worldwide";
    }
    if (supplierCountries.includes("WORLDWIDE")) {
      return "Worldwide";
    }
    return supplierCountries.map((code) => getCountryName(code)).join(", ");
  };

  // ====== نمایش Target Price ======
  const renderTargetPrice = () => {
    if (request.isPriceNegotiable) return "Negotiable";
    if (request.targetPrice) {
      return `$${request.targetPrice} / ${request.unit}`;
    }
    return "—";
  };

  return (
    <div className="container py-4">
      {/* View Tracker */}
      <ViewTracker type="request" id={request.id} />

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
          {request.category && (
            <li className="breadcrumb-item">
              <Link
                href={`/requests?category=${encodeURIComponent(request.category)}`}
                style={{ color: "var(--primary)" }}
              >
                {request.category}
              </Link>
            </li>
          )}
          {request.subCategory && (
            <li className="breadcrumb-item">
              <Link
                href={`/requests?category=${encodeURIComponent(request.category)}&subCategory=${encodeURIComponent(request.subCategory)}`}
                style={{ color: "var(--primary)" }}
              >
                {request.subCategory}
              </Link>
            </li>
          )}
          <li className="breadcrumb-item active text-muted" aria-current="page">
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
          <div className="request-description-card">
            <div className="request-description-card-header">
              <i className="fas fa-align-left"></i>
              Description
            </div>
            <div className="request-description-card-body">
              {request.description}
            </div>
          </div>

          {/* جدول مشخصات */}
          <table className="request-specs-table">
            <tbody>
              <tr>
                <td className="label">
                  <i className="fas fa-tag"></i> Product Type
                </td>
                <td className="value">{request.category || "—"}</td>
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
                  <i className="fas fa-credit-card"></i> Payment Terms
                </td>
                <td className="value">{request.paymentTerms || "—"}</td>
              </tr>

              <tr>
                <td className="label">
                  <i className="fas fa-dollar-sign"></i> Target Price
                </td>
                <td className="value">{renderTargetPrice()}</td>
              </tr>

              <tr>
                <td className="label">
                  <i className="fas fa-map-pin"></i> Delivery Location
                </td>
                <td className="value">
                  {request.deliveryCountry ? (
                    <>
                      <CountryFlag
                        countryCode={getCountryViaCode(request.deliveryCountry)}
                        size="16px"
                      />{" "}
                      {request.deliveryCountry}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>

              <tr>
                <td className="label">
                  <i className="fas fa-globe"></i> Suppliers From
                </td>
                <td className="value">{renderSupplierCountries()}</td>
              </tr>
            </tbody>
          </table>

          {/* ====== کارت خریدار با Reveal ====== */}
          <BuyerInfoSection
            requestId={request.id}
            buyer={{
              id: request.user.id,
              name: request.user.name,
              companyName: request.user.companyName,
              image: request.user.image,
              logo: request.user.logo,
              country: request.user.country,
              countryCode: request.user.countryCode,
              createdAt: request.user.createdAt,
            }}
            initialPermission={buyerInfoPermission}
            alreadyRevealed={alreadyRevealed}
            shouldAutoReveal={shouldAutoReveal}
          />

          {/* دکمه‌های Share و Save */}
          <RequestActions
            request={request}
            buyer={buyer}
            buyerInfoPermission={buyerInfoPermission}
            alreadyRevealed={alreadyRevealed}
          />
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
                      <i className="fas fa-user"></i> {rel.buyerCountry || "—"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
