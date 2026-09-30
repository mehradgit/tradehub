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

// ====== getRequest (بدون تغییر) ======
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

  // Related
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

// ====== generateMetadata (بدون تغییر) ======
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

  // Access control
  const session = await auth();
  const requestSettings = await getSectionSettings("request");
  const buyerInfoPermission = await canViewBuyerInfo(
    session?.user?.id,
    request,
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

  // ✅ Serialize for client component
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

  return (
    <RequestDetail
      request={serializedRequest}
      relatedRequests={serializedRelated}
      attachments={attachments}
      supplierCountries={supplierCountries}
      buyerInfoPermission={buyerInfoPermission}
      alreadyRevealed={alreadyRevealed}
      shouldAutoReveal={shouldAutoReveal}
    />
  );
}
