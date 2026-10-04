// scripts/seed-email-templates.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================================
// قالب‌های پیش‌فرض فاز ۱
// ============================================================
const TEMPLATES = [
  // ---------- Welcome ----------
  {
    key: "welcome",
    name: "Welcome Email",
    description: "Sent immediately after a user completes registration",
    category: "transactional",
    subject: "Welcome to FoodTradeLink, {{userName}}!",
    variables: ["userName", "companyName", "dashboardUrl"],
    htmlBody: `
      <div style="text-align: center; padding: 20px 0;">
        <h2 style="color: #13251f; margin: 0 0 10px; font-family: Manrope, sans-serif;">
          Welcome to FoodTradeLink 🎉
        </h2>
        <p style="color: #71807b; font-size: 15px; line-height: 1.6; max-width: 440px; margin: 0 auto;">
          Hi {{userName}},<br/>
          Your account at <strong>{{companyName}}</strong> is ready.
          Start connecting with verified food buyers and suppliers worldwide.
        </p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}"
           style="display: inline-block; background: linear-gradient(135deg, #13795b, #1d9a71);
                  color: white; padding: 14px 40px; border-radius: 50px;
                  text-decoration: none; font-weight: 700; font-size: 15px;">
          Go to Dashboard →
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Need help? Contact support@FoodTradeLink.com
      </p>
    `,
  },

  // ---------- New Inquiry (به تأمین‌کننده) ----------
  {
    key: "new_inquiry",
    name: "New Product Inquiry",
    description: "Sent to supplier when a buyer sends an inquiry",
    category: "behavioral",
    subject: "New inquiry for {{productName}}",
    variables: ["userName", "buyerName", "productName", "productUrl", "inquiriesUrl", "message"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">New Product Inquiry</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        <strong>{{buyerName}}</strong> is interested in your product <strong>{{productName}}</strong>.
      </p>
      <div style="background: #f8fdfb; border-left: 3px solid #13795b; padding: 14px 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; color: #33413d; font-size: 14px; line-height: 1.6;">
          {{message}}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{inquiriesUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          View Inquiry →
        </a>
      </div>
    `,
  },

  // ---------- New Quote (به خریدار) ----------
  {
    key: "new_quote",
    name: "New Quote Received",
    description: "Sent to buyer when a supplier submits a quote",
    category: "behavioral",
    subject: "New quote for {{requestTitle}}",
    variables: ["userName", "supplierName", "requestTitle", "requestUrl", "offeredPrice", "message"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">New Quote Received</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        <strong>{{supplierName}}</strong> submitted a quote on your request
        <strong>{{requestTitle}}</strong>.
      </p>
      <table style="width: 100%; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #71807b;">Offered Price:</td>
          <td style="padding: 8px 0; color: #13251f; font-weight: 700;">{{offeredPrice}}</td>
        </tr>
      </table>
      <div style="background: #f8fdfb; border-left: 3px solid #13795b; padding: 14px 18px; border-radius: 10px;">
        <p style="margin: 0; color: #33413d; font-size: 14px; line-height: 1.6;">
          {{message}}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{requestUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          View Request →
        </a>
      </div>
    `,
  },

  // ---------- New Ticket (به ادمین‌ها) ----------
  {
    key: "new_ticket_admin",
    name: "New Support Ticket (Admin)",
    description: "Sent to all admins when a user opens a support ticket",
    category: "system",
    subject: "[Ticket #{{ticketNumber}}] {{ticketSubject}}",
    variables: [
      "userName",
      "ticketNumber",
      "ticketSubject",
      "requesterName",
      "ticketCategory",
      "ticketPriority",
      "adminUrl",
    ],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">New Support Ticket</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        <strong>{{requesterName}}</strong> opened a new support ticket.
      </p>
      <table style="width: 100%; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #71807b;">Ticket:</td>
          <td style="padding: 8px 0; color: #13251f; font-weight: 700;">#{{ticketNumber}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71807b;">Category:</td>
          <td style="padding: 8px 0; color: #13251f;">{{ticketCategory}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71807b;">Priority:</td>
          <td style="padding: 8px 0; color: #13251f;">{{ticketPriority}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71807b;">Subject:</td>
          <td style="padding: 8px 0; color: #13251f;">{{ticketSubject}}</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{adminUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          Open Ticket →
        </a>
      </div>
    `,
  },

  // ---------- Ticket Reply (به کاربر) ----------
  {
    key: "ticket_reply_user",
    name: "Support Replied",
    description: "Sent to the ticket owner when support replies",
    category: "transactional",
    subject: "New reply on ticket #{{ticketNumber}}",
    variables: [
      "userName",
      "companyName",
      "ticketNumber",
      "ticketSubject",
      "messagePreview",
      "ticketUrl",
    ],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Support Replied</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Our support team replied to your ticket
        <strong>#{{ticketNumber}}</strong> — {{ticketSubject}}.
      </p>
      <div style="background: #f8fdfb; border-left: 3px solid #13795b; padding: 14px 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; color: #33413d; font-size: 14px; line-height: 1.6;">
          {{messagePreview}}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{ticketUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          View Conversation →
        </a>
      </div>
    `,
  },

  // ---------- Ticket Reply (به ادمین‌ها) ----------
  {
    key: "ticket_reply_admin",
    name: "User Replied to Ticket (Admin)",
    description: "Sent to all admins when a user replies to a ticket",
    category: "system",
    subject: "[Ticket #{{ticketNumber}}] New reply from {{requesterName}}",
    variables: [
      "userName",
      "ticketNumber",
      "ticketSubject",
      "requesterName",
      "messagePreview",
      "adminUrl",
    ],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">New Reply on Ticket</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        <strong>{{requesterName}}</strong> replied to ticket
        <strong>#{{ticketNumber}}</strong> — {{ticketSubject}}.
      </p>
      <div style="background: #f8fdfb; border-left: 3px solid #13795b; padding: 14px 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; color: #33413d; font-size: 14px; line-height: 1.6;">
          {{messagePreview}}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{adminUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          Open Ticket →
        </a>
      </div>
    `,
  },

  // ---------- Product Approved ----------
  {
    key: "product_approved",
    name: "Product Approved",
    description: "Sent to the supplier when their product is approved",
    category: "transactional",
    subject: "Your product is live: {{productName}}",
    variables: ["userName", "productName", "productUrl", "dashboardUrl"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Product Approved ✅</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Great news — your product <strong>{{productName}}</strong> has been
        approved and is now visible to buyers on FoodTradeLink.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{productUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          View Product →
        </a>
      </div>
      <p style="color: #71807b; font-size: 13px; line-height: 1.6;">
        Tip: add more photos and a detailed description to receive more inquiries.
        You can manage it from your
        <a href="{{dashboardUrl}}" style="color: #13795b;">dashboard</a>.
      </p>
    `,
  },

  // ---------- Product Rejected ----------
  {
    key: "product_rejected",
    name: "Product Rejected",
    description: "Sent to the supplier when their product is rejected",
    category: "transactional",
    subject: "Action needed: {{productName}}",
    variables: ["userName", "productName", "rejectionNote", "dashboardUrl"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Product Needs Changes</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Your product <strong>{{productName}}</strong> was not approved yet.
        You can fix the issue and submit it again.
      </p>
      <div style="background: #fff8e8; border-left: 3px solid #b45309; padding: 14px 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; color: #33413d; font-size: 14px; line-height: 1.6;">
          <strong>Reason:</strong> {{rejectionNote}}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{dashboardUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          Edit Product →
        </a>
      </div>
    `,
  },

  // ---------- Request Approved ----------
  {
    key: "request_approved",
    name: "Buying Request Approved",
    description: "Sent to the buyer when their request is approved",
    category: "transactional",
    subject: "Your buying request is live: {{requestTitle}}",
    variables: ["userName", "requestTitle", "requestUrl", "dashboardUrl"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Buying Request Approved ✅</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Your buying request <strong>{{requestTitle}}</strong> has been approved
        and is now visible to suppliers worldwide.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{requestUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          View Request →
        </a>
      </div>
      <p style="color: #71807b; font-size: 13px; line-height: 1.6;">
        Suppliers can now send you quotes. You will be notified for each new quote.
      </p>
    `,
  },

  // ---------- Request Rejected ----------
  {
    key: "request_rejected",
    name: "Buying Request Rejected",
    description: "Sent to the buyer when their request is rejected",
    category: "transactional",
    subject: "Action needed: {{requestTitle}}",
    variables: ["userName", "requestTitle", "rejectionNote", "dashboardUrl"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Buying Request Needs Changes</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Your buying request <strong>{{requestTitle}}</strong> was not approved yet.
        You can fix the issue and submit it again.
      </p>
      <div style="background: #fff8e8; border-left: 3px solid #b45309; padding: 14px 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; color: #33413d; font-size: 14px; line-height: 1.6;">
          <strong>Reason:</strong> {{rejectionNote}}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{dashboardUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          Edit Request →
        </a>
      </div>
    `,
  },

  // ---------- Ticket Auto Closed ----------
  {
    key: "ticket_auto_closed",
    name: "Ticket Auto-Closed",
    description: "Sent when a resolved ticket is closed automatically",
    category: "transactional",
    subject: "Ticket #{{ticketNumber}} was closed",
    variables: ["userName", "ticketNumber", "ticketSubject", "ticketUrl"],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Ticket Closed</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Your support ticket <strong>#{{ticketNumber}}</strong>
        ({{ticketSubject}}) was automatically closed after 7 days of inactivity.
      </p>
      <p style="color: #71807b; font-size: 14px; line-height: 1.6;">
        Still need help? Just reply on the ticket and it will be reopened.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{ticketUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          Open Ticket →
        </a>
      </div>
    `,
  },

  // ---------- Subscription Expiring ----------
  {
    key: "subscription_expiring",
    name: "Subscription Expiry Reminder",
    description:
      "Sent 7, 3 and 1 day(s) before an active subscription expires",
    category: "transactional",
    subject: "Your {{planName}} plan expires in {{daysLeft}} day(s)",
    variables: [
      "userName",
      "planName",
      "daysLeft",
      "endDate",
      "billingUrl",
    ],
    htmlBody: `
      <h2 style="color: #13251f; margin: 0 0 16px;">Your subscription is ending</h2>
      <p style="color: #33413d; font-size: 15px; line-height: 1.6;">
        Hi {{userName}},<br/>
        Your <strong>{{planName}}</strong> subscription will expire on
        <strong>{{endDate}}</strong> — that is <strong>{{daysLeft}} day(s)</strong> from now.
      </p>
      <p style="color: #33413d; font-size: 14px; line-height: 1.6;">
        To keep your current limits — product listings, image quotas and
        buyer/supplier contact access — renew before that date.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{billingUrl}}" style="display: inline-block; background: #13795b;
           color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none;
           font-weight: 700; font-size: 14px;">
          Renew Subscription →
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        If you have already renewed, you can ignore this message.
      </p>
    `,
  },
];

async function main() {
  console.log("🌱 Seeding email templates...\n");

  for (const tpl of TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        subject: tpl.subject,
        variables: tpl.variables,
        // توجه: htmlBody را در update عوض نمی‌کنیم
        // تا ویرایش‌های ادمین از بین نرود
      },
      create: {
        key: tpl.key,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        subject: tpl.subject,
        htmlBody: tpl.htmlBody,
        variables: tpl.variables,
        isActive: true,
      },
    });
    console.log(`   ✅ ${tpl.key}`);
  }

  console.log("\n✨ Done!");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());