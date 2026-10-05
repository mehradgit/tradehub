// src/app/(public)/requests/[requestNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import RequestDetail from "@/components/requests/RequestDetail";
import {
  getSectionSettings,
  canViewBuyerInfo,
  hasRevealedBuyerInfo,
} from "@/lib/accessControlService";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// getRequest
// ============================================================
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
          profileNumber: true,
          slug: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) return null;

  // Parse attachments
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

  // Parse supplierCountries
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

  // Related requests
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

// ============================================================
// generateMetadata
// ============================================================
export async function generateMetadata({ params }) {
  const { requestNumber } = await params;
  const num = parseInt(requestNumber);
  if (isNaN(num)) return { title: "Request Not Found" };

  const request = await prisma.buyingRequest.findUnique({
    where: { requestNumber: num },
    select: {
      title: true,
      description: true,
      category: true,
      subCategory: true,
      quantity: true,
      unit: true,
      deliveryCountry: true,
      buyerCountry: true,
      budgetRange: true,
      currency: true,
      slug: true,
      status: true,
      isUrgent: true,
      attachments: true,
      createdAt: true,
    },
  });

  if (!request) {
    return {
      title: "Request Not Found",
      description: "The buying request you're looking for does not exist.",
      robots: { index: false, follow: false },
    };
  }

  const requestUrl = `${BASE_URL}/requests/${requestNumber}/${request.slug}`;

  // Image
  let imageUrl = `${BASE_URL}/og-default.png`;
  if (Array.isArray(request.attachments) && request.attachments[0]) {
    const img = request.attachments[0];
    imageUrl = img.startsWith("http") ? img : `${BASE_URL}${img}`;
  }

  const description = (
    request.description ||
    `Buying request for ${request.title}. Quantity: ${request.quantity} ${request.unit}. Delivery: ${request.deliveryCountry}`
  )
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 158);

  const keywords = [
    request.title,
    request.category,
    request.subCategory,
    request.deliveryCountry,
    request.buyerCountry,
    "buying request",
    "sourcing",
    "procurement",
    "B2B inquiry",
  ].filter(Boolean);

  const isIndexable = request.status === "APPROVED";

  return {
    title: request.title,
    description,
    keywords,
    alternates: {
      canonical: requestUrl,
    },
    openGraph: {
      type: "article",
      url: requestUrl,
      title: request.title,
      description,
      siteName: "FoodTradeHub",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: request.title,
        },
      ],
      ...(request.createdAt && {
        publishedTime: new Date(request.createdAt).toISOString(),
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: request.title,
      description,
      images: [imageUrl],
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false },
  };
}

// ============================================================
// RequestPage
// ============================================================
export default async function RequestPage({ params }) {
  const { requestNumber } = await params;
  const data = await getRequest(requestNumber);

  if (!data) notFound();

  const { request, relatedRequests, attachments, supplierCountries } = data;

  // ====== Access control ======
  const session = await auth();
  const requestSettings = await getSectionSettings("request");
  const buyerInfoPermission = await canViewBuyerInfo(
    session?.user?.id,
    request
  );

  const alreadyRevealed =
    session?.user?.id && request.user.id !== session.user.id
      ? await hasRevealedBuyerInfo(session.user.id, request.id)
      : false;

  const shouldAutoReveal =
    buyerInfoPermission.allowed &&
    (buyerInfoPermission.reason === "owner" ||
      buyerInfoPermission.reason === "admin" ||
      buyerInfoPermission.reason === "already_revealed" ||
      buyerInfoPermission.reason === "guest_allowed" ||
      buyerInfoPermission.reason === "everyone" ||
      buyerInfoPermission.reason === "loggedIn" ||
      requestSettings?.buyerInfo?.consumeQuotaOnReveal === false);

  // ====== Serialize ======
  const serializedRequest = {
    id: request.id,
    requestNumber: request.requestNumber,
    slug: request.slug,
    title: request.title,
    category: request.category,
    subCategory: request.subCategory,
    description: request.description,
    quantity: request.quantity,
    unit: request.unit,
    budgetRange: request.budgetRange,
    currency: request.currency,
    targetPrice: request.targetPrice,
    isPriceNegotiable: request.isPriceNegotiable,
    deadline: request.deadline ? request.deadline.toISOString() : null,
    deliveryCountry: request.deliveryCountry,
    buyerCountry: request.buyerCountry,
    shippingTerms: request.shippingTerms,
    packagingReq: request.packagingReq,
    certifications: request.certifications,
    paymentTerms: request.paymentTerms,
    isUrgent: request.isUrgent,
    isVisible: request.isVisible,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    user: {
      id: request.user.id,
      name: request.user.name,
      companyName: request.user.companyName,
      country: request.user.country,
      countryCode: request.user.countryCode,
      image: request.user.image,
      logo: request.user.logo,
      profileNumber: request.user.profileNumber,
      slug: request.user.slug,
      createdAt: request.user.createdAt.toISOString(),
    },
  };

  const serializedRelated = relatedRequests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    slug: r.slug,
    title: r.title,
    description: r.description,
    isUrgent: r.isUrgent,
    buyerCountry: r.buyerCountry,
    createdAt: r.createdAt.toISOString(),
  }));

  // ============================================================
  // JSON-LD
  // ============================================================
  const requestUrl = `${BASE_URL}/requests/${requestNumber}/${request.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Demand",
    name: request.title,
    description: request.description,
    url: requestUrl,
    ...(request.category && { category: request.category }),
    ...(request.createdAt && {
      datePosted: new Date(request.createdAt).toISOString(),
    }),
    ...(request.deadline && {
      validThrough: new Date(request.deadline).toISOString(),
    }),
    quantity: {
      "@type": "QuantitativeValue",
      value: request.quantity,
      unitText: request.unit,
    },
    ...(request.deliveryCountry && {
      availableAtOrFrom: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressCountry: request.deliveryCountry,
        },
      },
    }),
    ...(request.targetPrice && {
      priceSpecification: {
        "@type": "PriceSpecification",
        price: request.targetPrice,
        priceCurrency: request.currency || "USD",
      },
    }),
    seller: {
      "@type": "Organization",
      name: request.user.companyName || request.user.name || "Buyer",
      ...(request.user.country && {
        address: {
          "@type": "PostalAddress",
          addressCountry: request.user.country,
        },
      }),
    },
  };

  return (
    <>
      {/* ✅ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <RequestDetail
        request={serializedRequest}
        relatedRequests={serializedRelated}
        attachments={attachments}
        supplierCountries={supplierCountries}
        buyerInfoPermission={buyerInfoPermission}
        alreadyRevealed={alreadyRevealed}
        shouldAutoReveal={shouldAutoReveal}
      />
    </>
  );
}