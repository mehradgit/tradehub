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

  // Read the raw body first so we can log it when the
  // response is not what we expect (e.g. non-JSON or
  // an unexpected shape with a 2xx status).
  const raw = await res.text();

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("[nowpayments] non-JSON response:", res.status, raw);
  }

  if (!res.ok) {
    const message =
      data.message || `NOWPayments request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

// ============================================================
// Create an invoice — the hosted checkout page.
//
// This is NOWPayments' "payment link" API: the response
// contains "invoice_url" (e.g.
// https://nowpayments.io/payment/?iid=4522625843) and the
// customer completes the payment on that page.
//
// NOTE: POST /v1/payment is a different, inline API ("pay
// without leaving your website") whose response has no URL —
// it cannot be used for a redirect flow.
// ============================================================
export async function createNowPaymentsInvoice({
  amount,
  orderId,
  orderDescription,
  ipnUrl,
  successUrl,
  cancelUrl,
  payCurrency,
}) {
  // pay_currency is optional. When omitted, the
  // customer chooses the cryptocurrency on the
  // hosted checkout page (BTC, ETH, USDT, ... —
  // every currency enabled for the account).
  // NOTE: fiat (usd, eur, ...) is only allowed for
  // accounts with fiat payments enabled — this
  // account is crypto-only.
  const body = {
    price_amount: Number(amount).toFixed(2),
    price_currency: PRICE_CURRENCY,
    order_id: String(orderId),
    order_description: orderDescription || "",
    // Per-invoice IPN override. The documented parameter
    // name is ipn_callback_url — NOT callback_url, which
    // the API rejects as an unknown field.
    ipn_callback_url: ipnUrl,
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  if (payCurrency) {
    body.pay_currency = payCurrency;
  }

  const data = await apiRequest("/invoice", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const invoiceUrl = data.invoice_url;

  if (!invoiceUrl) {
    console.error(
      "[nowpayments] create invoice response without url:",
      JSON.stringify(data)
    );
    throw new Error("No invoice URL returned by the gateway");
  }

  return {
    invoiceId: String(data.id),
    invoiceUrl,
    payCurrency: data.pay_currency || payCurrency,
  };
}

// ============================================================
// List the payments created under an invoice.
//
// There is no GET /v1/invoice/:id — an invoice's status is
// derived from the payments linked to it. The response is
// paginated: { data: [...], limit, page, pagesCount, total }.
// ============================================================
export async function getNowPaymentsInvoicePayments(invoiceId) {
  const data = await apiRequest(
    `/payment/?invoiceId=${encodeURIComponent(
      invoiceId
    )}&limit=10&sortBy=created_at&orderBy=desc`
  );

  return Array.isArray(data.data) ? data.data : [];
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
    case "refunded":
      return "failed";
    // "confirming" / "pending" / "partially_paid" — not final yet
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
      // transactionId holds the NOWPayments invoice id (iid).
      // There is no GET /v1/invoice/:id — an invoice's status
      // comes from the payments created under it.
      const invoicePayments = await getNowPaymentsInvoicePayments(
        payment.transactionId
      );

      // Any "finished" payment under the invoice = paid.
      const finished = invoicePayments.find(
        (p) => mapNowPaymentsStatus(p.payment_status) === "paid"
      );

      if (finished) {
        await finalizePaidPayment(payment, {
          nowpaymentsInvoiceId: payment.transactionId,
          nowpaymentsPaymentId: String(finished.payment_id),
          nowpaymentsStatus: finished.payment_status,
          actuallyPaid: finished.actually_paid,
          payCurrency: finished.pay_currency,
          confirmedVia: "poller",
          confirmedAt: new Date().toISOString(),
        });
        paid++;
        console.log(
          "[nowpayments] payment confirmed:",
          payment.invoiceNumber
        );
        continue;
      }

      // Payments exist but ALL failed/expired → the invoice
      // will not be paid. An empty list means the customer
      // has not paid yet — keep waiting.
      const allFailed =
        invoicePayments.length > 0 &&
        invoicePayments.every(
          (p) => mapNowPaymentsStatus(p.payment_status) === "failed"
        );

      if (allFailed) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "failed",
            metadata: {
              ...(payment.metadata || {}),
              nowpaymentsInvoiceId: payment.transactionId,
              nowpaymentsStatus: invoicePayments[0].payment_status,
              failedAt: new Date().toISOString(),
            },
          },
        });
        failed++;
      }
      // otherwise → still waiting for payment/confirmation
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
