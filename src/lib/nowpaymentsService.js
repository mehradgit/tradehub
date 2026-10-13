// src/lib/nowpaymentsService.js
// ============================================================
// NOWPayments Crypto Payment Service
// https://nowpayments.io/documentation
// ============================================================
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { finalizePaidPayment } from "@/lib/paymentService";

const NOWPAYMENTS_API_URL =
  process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

const DEFAULT_PAY_CURRENCY = process.env.NOWPAYMENTS_PAY_CURRENCY || "BTC";
const PRICE_CURRENCY = process.env.NOWPAYMENTS_PRICE_CURRENCY || "USD";

// ============================================================
// Low-level request
// ============================================================
async function apiRequest(path, options = {}) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("NOWPAYMENTS_API_KEY is not configured");
  }

  const res = await fetch(`${NOWPAYMENTS_API_URL}${path}`, {
    ...options,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data.message || `NOWPayments request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

// ============================================================
// Create a payment — returns the checkout URL the user is
// redirected to. The IPN webhook is the source of truth for
// confirmation (the browser redirect can be spoofed).
// ============================================================
export async function createNowPaymentsPayment({
  amount,
  orderId,
  orderDescription,
  successUrl,
  cancelUrl,
  payCurrency = DEFAULT_PAY_CURRENCY,
}) {
  const data = await apiRequest("/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: Number(amount).toFixed(2),
      price_currency: PRICE_CURRENCY,
      pay_currency: payCurrency,
      order_id: String(orderId),
      order_description: orderDescription || "",
      // NOTE: no callback_url — this merchant account rejects
      // it with "callback_url is not allowed". IPNs are sent
      // to the Webhook URL configured in the NOWPayments
      // dashboard (Settings → IPN) for every payment.
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  // NOWPayments returns the checkout page URL in "url"
  // (some API versions also expose "payment_url").
  const paymentUrl = data.url || data.payment_url;

  if (!paymentUrl) {
    throw new Error("No payment URL returned by the gateway");
  }

  return {
    paymentId: data.payment_id,
    paymentUrl,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
  };
}

// ============================================================
// Check payment status (fallback when IPN is delayed)
// ============================================================
export async function getNowPaymentsPayment(paymentId) {
  return apiRequest(`/payment/${encodeURIComponent(paymentId)}`);
}

// ============================================================
// Verify the IPN signature — HMAC-SHA512 of the raw request
// body, hex digest, compared with the x-nowpayments-sig header
// ============================================================
export function verifyNowPaymentsIpn(rawBody, signature) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== signatureBuf.length) return false;

  return timingSafeEqual(expectedBuf, signatureBuf);
}

// ============================================================
// Map NOWPayments status to our internal payment status
// ============================================================
export function mapNowPaymentsStatus(status) {
  switch (String(status).toLowerCase()) {
    case "finished":
      return "paid";
    case "expired":
    case "failed":
      return "failed";
    // "confirming" / "pending" — payment detected, not final yet
    default:
      return "pending";
  }
}

// ============================================================
// Poll pending NOWPayments payments — safety net for IPN.
// BTC confirmations take 10-60 minutes, so payments from
// the last 24 hours are checked. Called by the scheduled
// job "check-nowpayments" (every 5 minutes).
// ============================================================
export async function syncNowPaymentsPayments() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pending = await prisma.payment.findMany({
    where: {
      gatewayName: "nowpayments",
      status: "pending",
      transactionId: { not: null },
      createdAt: { gte: since },
    },
    include: { plan: true },
  });

  let paid = 0;
  let failed = 0;

  for (const payment of pending) {
    try {
      const data = await getNowPaymentsPayment(payment.transactionId);
      const status = mapNowPaymentsStatus(data.payment_status);

      if (status === "paid") {
        await finalizePaidPayment(payment, {
          nowpaymentsPaymentId: data.payment_id,
          nowpaymentsStatus: data.payment_status,
          actuallyPaid: data.actually_paid,
          payCurrency: data.pay_currency,
          confirmedVia: "poller",
          confirmedAt: new Date().toISOString(),
        });
        paid++;
        console.log(
          "[nowpayments] payment confirmed:",
          payment.invoiceNumber
        );
      } else if (status === "failed") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "failed",
            metadata: {
              ...(payment.metadata || {}),
              nowpaymentsStatus: data.payment_status,
              failedAt: new Date().toISOString(),
            },
          },
        });
        failed++;
      }
      // "pending" / "confirming" → keep waiting
    } catch (err) {
      console.error(
        "[nowpayments] sync error for",
        payment.invoiceNumber,
        err.message
      );
    }
  }

  return { checked: pending.length, paid, failed };
}
