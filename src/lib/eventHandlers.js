// src/lib/eventHandlers.js
import { prisma } from "@/lib/prisma";
import { alertNewUser } from "@/lib/adminAlerts";

// ============================================================
// helper: site base URL (without a trailing slash)
// If the env var is not set, it falls back to localhost so links do not
// become "undefined/...".
// ============================================================
function baseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return String(raw).replace(/\/+$/, "");
}

// ============================================================
// helper: truncate text for a title/preview
// ============================================================
function truncate(text, max = 140) {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// ============================================================
// Each handler is an async function that receives a payload
// and returns an array of actions.
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
//   bypassPreferences,   // for transactional emails
// }
// ============================================================

export const HANDLERS = {
  // ============================================================
  // 1. User registered → welcome email
  // ============================================================
  "user.registered": async ({ userId }) => {
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, companyName: true, email: true, country: true },
    });
    if (!user) return [];

    // ====== اطلاع تلگرامی ادمین (fire-and-forget) ======
    alertNewUser(user);

    return [
      {
        userId,
        category: null, // bypass
        templateKey: "welcome",
        variables: {
          userName: user.name || "there",
          companyName: user.companyName || "your company",
          dashboardUrl: `${baseUrl()}/dashboard`,
        },
        channels: ["email"],
        bypassPreferences: true, // ✅ always send
        metadata: { event: "user.registered" },
      },
    ];
  },

  // ============================================================
  // 2. New inquiry on a product → notify the supplier
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
    const productUrl = `${baseUrl()}/products/${inquiry.product.productNumber}/${inquiry.product.slug}`;
    const inquiriesUrl = `${baseUrl()}/dashboard/inquiries?tab=supplier`;

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
  // 3. New quote → notify the buyer
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
    const requestUrl = `${baseUrl()}/requests/${quote.request.requestNumber}/${quote.request.slug}`;

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

  // ============================================================
  // 4. New ticket → notify all admins
  // ============================================================
  "ticket.created": async ({ ticketId }) => {
    if (!ticketId) return [];

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, companyName: true } },
      },
    });
    if (!ticket) return [];

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true },
    });
    if (admins.length === 0) return [];

    const requesterName =
      ticket.user?.companyName || ticket.user?.name || "A user";
    const adminUrl = `${baseUrl()}/admin/tickets/${ticket.ticketNumber}`;
    const preview = truncate(ticket.subject, 120);

    return admins.map((admin) => ({
      userId: admin.id,
      category: "ticket",
      templateKey: "new_ticket_admin",
      variables: {
        userName: admin.name || "there",
        ticketNumber: String(ticket.ticketNumber),
        ticketSubject: ticket.subject,
        requesterName,
        ticketCategory: ticket.category,
        ticketPriority: ticket.priority,
        adminUrl,
      },
      channels: ["email", "push", "inApp"],
      inAppData: {
        type: "ticket_reply",
        title: `New support ticket #${ticket.ticketNumber}`,
        body: `${requesterName}: "${preview}"`,
        link: `/admin/tickets/${ticket.ticketNumber}`,
        icon: "fa-headset",
        metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      },
      pushData: {
        title: `New ticket #${ticket.ticketNumber}`,
        body: `${requesterName}: ${truncate(ticket.subject, 80)}`,
        url: adminUrl,
      },
      metadata: { ticketId: ticket.id, event: "ticket.created" },
    }));
  },

  // ============================================================
  // 5. Reply on a ticket
  //    byAdmin=true  → notify the ticket owner
  //    byAdmin=false → notify all admins
  //    An internal note (isInternal) sends no notification at all.
  // ============================================================
  "ticket.replied": async ({ ticketId, messageId, byAdmin = false }) => {
    if (!ticketId) return [];

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, companyName: true } },
      },
    });
    if (!ticket) return [];

    // ===== Message text =====
    let preview = "";
    let senderName = "Support";

    if (messageId) {
      const msg = await prisma.ticketMessage.findUnique({
        where: { id: messageId },
        select: {
          message: true,
          isInternal: true,
          sender: { select: { name: true, companyName: true, email: true } },
        },
      });
      // An internal note is never announced to the user
      if (!msg || msg.isInternal) return [];
      preview = truncate(msg.message, 200);
      if (!byAdmin) {
        senderName =
          msg.sender?.companyName ||
          msg.sender?.name ||
          msg.sender?.email ||
          "User";
      }
    }

    // ===== Admin replied → ticket owner =====
    if (byAdmin) {
      if (!ticket.userId) return [];

      const userUrl = `${baseUrl()}/dashboard/support/${ticket.ticketNumber}`;

      return [
        {
          userId: ticket.userId,
          category: "ticket",
          templateKey: "ticket_reply_user",
          variables: {
            userName: ticket.user?.name || "there",
            companyName: ticket.user?.companyName || "",
            ticketNumber: String(ticket.ticketNumber),
            ticketSubject: ticket.subject,
            messagePreview: preview,
            ticketUrl: userUrl,
          },
          channels: ["email", "push", "inApp"],
          inAppData: {
            type: "ticket_reply",
            title: `New reply on ticket #${ticket.ticketNumber}`,
            body: `Support replied: "${truncate(preview, 120)}"`,
            link: `/dashboard/support/${ticket.ticketNumber}`,
            icon: "fa-headset",
            metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
          },
          pushData: {
            title: `Support replied — #${ticket.ticketNumber}`,
            body: truncate(preview, 90),
            url: userUrl,
          },
          metadata: { ticketId: ticket.id, messageId, event: "ticket.replied" },
        },
      ];
    }

    // ===== User replied → all admins =====
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true },
    });
    if (admins.length === 0) return [];

    const adminUrl = `${baseUrl()}/admin/tickets/${ticket.ticketNumber}`;

    return admins.map((admin) => ({
      userId: admin.id,
      category: "ticket",
      templateKey: "ticket_reply_admin",
      variables: {
        userName: admin.name || "there",
        ticketNumber: String(ticket.ticketNumber),
        ticketSubject: ticket.subject,
        requesterName: senderName,
        messagePreview: preview,
        adminUrl,
      },
      channels: ["email", "push", "inApp"],
      inAppData: {
        type: "ticket_reply",
        title: `Reply on ticket #${ticket.ticketNumber}`,
        body: `${senderName} replied: "${truncate(preview, 120)}"`,
        link: `/admin/tickets/${ticket.ticketNumber}`,
        icon: "fa-headset",
        metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      },
      pushData: {
        title: `Reply on #${ticket.ticketNumber}`,
        body: `${senderName}: ${truncate(preview, 80)}`,
        url: adminUrl,
      },
      metadata: { ticketId: ticket.id, messageId, event: "ticket.replied" },
    }));
  },

  // ============================================================
  // 6. Product review result (approved / rejected)
  // ============================================================
  "product.reviewed": async ({
    productId,
    approved = false,
    rejectionNote = "",
  }) => {
    if (!productId) return [];

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!product?.user) return [];

    const productUrl = `${baseUrl()}/products/${product.productNumber}/${product.slug}`;
    const dashboardUrl = `${baseUrl()}/dashboard/products`;
    const reason = truncate(rejectionNote, 200) || "No reason provided.";

    return [
      {
        userId: product.user.id,
        category: "listing",
        templateKey: approved ? "product_approved" : "product_rejected",
        variables: {
          userName: product.user.name || "there",
          productName: product.name,
          productUrl,
          rejectionNote: reason,
          dashboardUrl,
        },
        channels: ["email", "push", "inApp"],
        inAppData: {
          type: approved ? "product_approved" : "product_rejected",
          title: approved ? "Product Approved" : "Product Rejected",
          body: approved
            ? `Your product "${product.name}" has been approved and is now live.`
            : `Your product "${product.name}" was rejected. Reason: ${reason}`,
          link: "/dashboard/products",
          icon: approved ? "fa-check-circle" : "fa-times-circle",
          metadata: { productId: product.id },
        },
        pushData: {
          title: approved ? "Product approved" : "Product rejected",
          body: truncate(product.name, 80),
          url: dashboardUrl,
        },
        metadata: { productId: product.id, event: "product.reviewed" },
      },
    ];
  },

  // ============================================================
  // 7. Buying request review result (approved / rejected)
  // ============================================================
  "request.reviewed": async ({
    requestId,
    approved = false,
    rejectionNote = "",
  }) => {
    if (!requestId) return [];

    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!buyingRequest?.user) return [];

    const requestUrl = `${baseUrl()}/requests/${buyingRequest.requestNumber}/${buyingRequest.slug}`;
    const dashboardUrl = `${baseUrl()}/dashboard/requests`;
    const reason = truncate(rejectionNote, 200) || "No reason provided.";

    return [
      {
        userId: buyingRequest.user.id,
        category: "listing",
        templateKey: approved ? "request_approved" : "request_rejected",
        variables: {
          userName: buyingRequest.user.name || "there",
          requestTitle: buyingRequest.title,
          requestUrl,
          rejectionNote: reason,
          dashboardUrl,
        },
        channels: ["email", "push", "inApp"],
        inAppData: {
          type: approved ? "request_approved" : "request_rejected",
          title: approved
            ? "Buying Request Approved"
            : "Buying Request Rejected",
          body: approved
            ? `Your buying request "${buyingRequest.title}" has been approved and is now live.`
            : `Your buying request "${buyingRequest.title}" was rejected. Reason: ${reason}`,
          link: "/dashboard/requests",
          icon: approved ? "fa-check-circle" : "fa-times-circle",
          metadata: { requestId: buyingRequest.id },
        },
        pushData: {
          title: approved ? "Request approved" : "Request rejected",
          body: truncate(buyingRequest.title, 80),
          url: dashboardUrl,
        },
        metadata: { requestId: buyingRequest.id, event: "request.reviewed" },
      },
    ];
  },

  // ============================================================
  // 8. Ticket auto-closed → notify the ticket owner
  // ============================================================
  "ticket.auto_closed": async ({ ticketId }) => {
    if (!ticketId) return [];

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!ticket?.user) return [];

    const ticketUrl = `${baseUrl()}/dashboard/support/${ticket.ticketNumber}`;
    const body =
      "This ticket was automatically closed after 7 days of inactivity. Reopen it if you still need help.";

    return [
      {
        userId: ticket.user.id,
        category: "ticket",
        templateKey: "ticket_auto_closed",
        variables: {
          userName: ticket.user.name || "there",
          ticketNumber: String(ticket.ticketNumber),
          ticketSubject: ticket.subject,
          ticketUrl,
        },
        channels: ["email", "push", "inApp"],
        inAppData: {
          type: "ticket_auto_closed",
          title: `Ticket #${ticket.ticketNumber} closed`,
          body,
          link: `/dashboard/support/${ticket.ticketNumber}`,
          icon: "fa-clock",
          metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
        },
        pushData: {
          title: `Ticket #${ticket.ticketNumber} closed`,
          body: "Automatically closed after 7 days of inactivity.",
          url: ticketUrl,
        },
        metadata: { ticketId: ticket.id, event: "ticket.auto_closed" },
      },
    ];
  },

  // ============================================================
  // 9. Subscription expiry reminder → notify the subscription owner
  // ============================================================
  "subscription.expiring": async ({ subscriptionId, daysLeft }) => {
    if (!subscriptionId) return [];

    const sub = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
      },
    });
    if (!sub?.user) return [];

    const billingUrl = `${baseUrl()}/dashboard/billing`;
    const days = Number(daysLeft) || 0;
    const planName = sub.plan?.name || "your plan";
    const endDate = new Date(sub.endDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const urgency =
      days <= 1 ? "Expires tomorrow" : `Expires in ${days} days`;

    return [
      {
        userId: sub.user.id,
        category: "subscription",
        templateKey: "subscription_expiring",
        variables: {
          userName: sub.user.name || "there",
          planName,
          daysLeft: String(days),
          endDate,
          billingUrl,
        },
        channels: ["email", "push", "inApp"],
        inAppData: {
          type: "subscription_expiring",
          title: `${urgency} — ${planName}`,
          body: `Your ${planName} subscription ends on ${endDate}. Renew to keep your access.`,
          link: "/dashboard/billing",
          icon: "fa-hourglass-end",
          metadata: { subscriptionId: sub.id, daysLeft: days },
        },
        pushData: {
          title: urgency,
          body: `Your ${planName} subscription ends on ${endDate}.`,
          url: billingUrl,
        },
        metadata: {
          subscriptionId: sub.id,
          daysLeft: days,
          event: "subscription.expiring",
        },
      },
    ];
  },
};