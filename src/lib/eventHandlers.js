// src/lib/eventHandlers.js
import { prisma } from "@/lib/prisma";

// ============================================================
// هر handler یک تابع async است که payload می‌گیرد
// و یک آرایه از action برمی‌گرداند.
//
// action = {
//   userId,
//   category,
//   templateKey,
//   variables,
//   channels,
//   inAppData,
//   pushData,
//   metadata,
//   bypassPreferences,   // برای ایمیل‌های تراکنشی
// }
// ============================================================

export const HANDLERS = {
  // ============================================================
  // غ±. کاربر ثبت‌نام کرد → ایمیل خوش‌آمدگویی
  // ============================================================
  "user.registered": async ({ userId }) => {
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, companyName: true, email: true },
    });
    if (!user) return [];

    return [
      {
        userId,
        category: null, // bypass
        templateKey: "welcome",
        variables: {
          userName: user.name || "there",
          companyName: user.companyName || "your company",
          dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
        },
        channels: ["email"],
        bypassPreferences: true, // âœ… همیشه برود
        metadata: { event: "user.registered" },
      },
    ];
  },

  // ============================================================
  // غ². استعلام جدید روی محصول → اطلاع به تأمین‌کننده
  // ============================================================
  "inquiry.created": async ({ inquiryId }) => {
    if (!inquiryId) return [];

    const inquiry = await prisma.productInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        product: { select: { id: true, name: true, slug: true, productNumber: true } },
        user: { select: { id: true, name: true, companyName: true, country: true } },
        supplier: { select: { id: true, name: true, email: true, companyName: true } },
      },
    });
    if (!inquiry || !inquiry.supplier) return [];

    const buyerName = inquiry.user?.companyName || inquiry.user?.name || "A buyer";
    const productUrl = `${process.env.NEXTAUTH_URL}/products/${inquiry.product.productNumber}/${inquiry.product.slug}`;
    const inquiriesUrl = `${process.env.NEXTAUTH_URL}/dashboard/inquiries?tab=supplier`;

    return [
      {
        userId: inquiry.supplier.id,
        category: "inquiry",
        templateKey: "new_inquiry",
        variables: {
          userName: inquiry.supplier.name || "there",
          buyerName,
          productName: inquiry.product.name,
          productUrl,
          inquiriesUrl,
          message: inquiry.message?.slice(0, 200) || "",
        },
        channels: ["email", "push", "inApp"],
        inAppData: {
          type: "new_inquiry",
          title: "New Product Inquiry",
          body: `${buyerName} is interested in "${inquiry.product.name}".`,
          link: "/dashboard/inquiries?tab=supplier",
          icon: "fa-envelope",
          metadata: { inquiryId, productId: inquiry.product.id },
        },
        pushData: {
          title: "New Inquiry",
          body: `${buyerName}: ${inquiry.product.name}`,
          url: inquiriesUrl,
        },
        metadata: { inquiryId, event: "inquiry.created" },
      },
    ];
  },

  // ============================================================
  // غ³. نقل قول جدید → اطلاع به خریدار
  // ============================================================
  "quote.submitted": async ({ quoteId }) => {
    if (!quoteId) return [];

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        supplier: { select: { id: true, name: true, companyName: true } },
        buyer: { select: { id: true, name: true, email: true } },
        request: { select: { id: true, title: true, requestNumber: true, slug: true } },
      },
    });
    if (!quote || !quote.buyer) return [];

    const supplierName = quote.supplier?.companyName || quote.supplier?.name || "A supplier";
    const requestUrl = `${process.env.NEXTAUTH_URL}/requests/${quote.request.requestNumber}/${quote.request.slug}`;

    return [
      {
        userId: quote.buyer.id,
        category: "quote",
        templateKey: "new_quote",
        variables: {
          userName: quote.buyer.name || "there",
          supplierName,
          requestTitle: quote.request.title,
          requestUrl,
          offeredPrice: quote.offeredPrice ? `$${quote.offeredPrice}` : "—",
          message: quote.message?.slice(0, 200) || "",
        },
        channels: ["email", "push", "inApp"],
        inAppData: {
          type: "new_quote",
          title: "New Quote Received",
          body: `${supplierName} submitted a quote on "${quote.request.title}".`,
          link: "/dashboard/requests",
          icon: "fa-file-signature",
          metadata: { quoteId, requestId: quote.request.id },
        },
        pushData: {
          title: "New Quote",
          body: `${supplierName} — ${quote.request.title}`,
          url: requestUrl,
        },
        metadata: { quoteId, event: "quote.submitted" },
      },
    ];
  },
};