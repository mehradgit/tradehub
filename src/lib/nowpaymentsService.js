// src/lib/nowpaymentsService.js
// ============================================================
// NOWPayments Crypto Payment Service
// https://nowpayments.io/documentation
// ============================================================
import { createHmac, timingSafeEqual } from "node:crypto";

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
  ipnUrl,
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
      callback_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  return {
    paymentId: data.payment_id,
    paymentUrl: data.payment_url,
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
