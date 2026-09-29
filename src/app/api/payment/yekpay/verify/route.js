// src/app/api/payment/yekpay/verify/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyYekPayPayment } from "@/lib/yekpayService";
import { createSubscriptionFromPayment } from "@/lib/paymentService";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

// ============================================================
// HTML با ریدایرکت خودکار (کار می‌کند برای POST و GET)
// ============================================================
function htmlRedirect(url, message = "Redirecting...") {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${url}" />
  <title>${message}</title>
</head>
<body style="font-family:sans-serif;padding:40px;text-align:center;">
  <p>${message}</p>
  <p><a href="${url}">Click here if not redirected</a></p>
  <script>window.location.href = ${JSON.stringify(url)};</script>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

// ============================================================
// منطق مشترک تأیید
// ============================================================
async function handleVerify(authority, status, baseUrl) {
  // ====== بررسی پارامترها ======
  if (!authority) {
    return `${baseUrl}/dashboard/billing?error=missing_authority`;
  }

  // ====== پیدا کردن Payment ======
  const payment = await prisma.payment.findFirst({
    where: { transactionId: authority },
    include: { plan: true },
  });

  if (!payment) {
    return `${baseUrl}/dashboard/billing?error=payment_not_found`;
  }

  // ====== اگر قبلاً پرداخت شده ======
  if (payment.status === "paid") {
    return `${baseUrl}/dashboard/billing/invoice/${payment.id}`;
  }

  // ====== اگر کاربر لغو کرده ======
  if (String(status) === "0") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return `${baseUrl}/dashboard/billing?error=payment_cancelled`;
  }

  // ====== تأیید با YekPay ======
  let verifyResult;
  try {
    verifyResult = await verifyYekPayPayment(authority);
  } catch (err) {
    console.error("YekPay verify error:", err);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return `${baseUrl}/dashboard/billing?error=verify_failed`;
  }

  // ====== علامت‌گذاری به‌عنوان پرداخت‌شده ======
  const paidPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      referenceNumber: verifyResult.reference || payment.referenceNumber,
      metadata: {
        ...(payment.metadata || {}),
        yekpayReference: verifyResult.reference,
        yekpayGateway: verifyResult.gateway,
        yekpayOrderNo: verifyResult.orderNo,
        yekpayAmount: verifyResult.amount,
        yekpayCurrency: verifyResult.currency,
      },
    },
  });

  // ====== ساخت اشتراک ======
  await createSubscriptionFromPayment(paidPayment);

  // ====== به‌روزرسانی پلن کاربر ======
  await prisma.user.update({
    where: { id: payment.userId },
    data: { plan: payment.plan.name.toUpperCase() },
  });

  return `${baseUrl}/dashboard/billing/invoice/${payment.id}`;
}

// ============================================================
// POST — YekPay این‌جا callback می‌زند
// ============================================================
export async function POST(request) {
  const baseUrl = getBaseUrl();
  try {
    const formData = await request.formData();
    const status = formData.get("Status") ?? formData.get("status");
    const authority = formData.get("Authority") ?? formData.get("authority");

    const redirectUrl = await handleVerify(authority, status, baseUrl);
    return htmlRedirect(redirectUrl, "Payment processed. Redirecting...");
  } catch (error) {
    console.error("YekPay verify POST error:", error);
    return htmlRedirect(
      `${baseUrl}/dashboard/billing?error=server_error`,
      "Something went wrong. Redirecting..."
    );
  }
}

// ============================================================
// GET — پشتیبانی از مرورگرهایی که با GET برمی‌گردند
// ============================================================
export async function GET(request) {
  const baseUrl = getBaseUrl();
  try {
    const { searchParams } = new URL(request.url);
    const authority =
      searchParams.get("Authority") || searchParams.get("authority");
    const status = searchParams.get("Status") || searchParams.get("status");

    const redirectUrl = await handleVerify(authority, status, baseUrl);
    return htmlRedirect(redirectUrl, "Payment processed. Redirecting...");
  } catch (error) {
    console.error("YekPay verify GET error:", error);
    return htmlRedirect(
      `${baseUrl}/dashboard/billing?error=server_error`,
      "Something went wrong. Redirecting..."
    );
  }
}