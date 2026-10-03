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