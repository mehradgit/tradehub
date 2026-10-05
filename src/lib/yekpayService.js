// src/lib/yekpayService.js
// ============================================================
// YekPay Payment Gateway Service
// https://docs.yekpay.com
// ============================================================

const YEKPAY_BASE_URL =
    process.env.YEKPAY_BASE_URL || "https://gate.ypsapi.com/api/payment";


// src/lib/yekpayService.js

// ============================================================
// Choose the environment based on an environment variable
// ============================================================
const IS_SANDBOX = process.env.YEKPAY_SANDBOX === "true";

const ENDPOINTS = IS_SANDBOX
    ? {
        request: "https://api.ypsapi.com/api/sandbox/request",
        start: "https://api.ypsapi.com/api/sandbox/payment",
        verify: "https://api.ypsapi.com/api/sandbox/verify",
    }
    : {
        request: "https://gate.ypsapi.com/api/payment/request",
        start: "https://gate.ypsapi.com/api/payment/start",
        verify: "https://gate.ypsapi.com/api/payment/verify",
    };

// ============================================================
// Payment Request
// ============================================================
export async function requestYekPayPayment({
    amount,
    orderNumber,
    callbackUrl,
    description,
    user,
}) {
    const merchantId = process.env.YEKPAY_MERCHANT_ID;
    const fromCurrencyCode = parseInt(
        process.env.YEKPAY_FROM_CURRENCY || "364",
        10
    );
    const toCurrencyCode = parseInt(process.env.YEKPAY_TO_CURRENCY || "840", 10);

    if (!merchantId) {
        throw new Error("YEKPAY_MERCHANT_ID is not configured");
    }

    const rate = parseFloat(process.env.YEKPAY_RATE || "1");
    const finalAmount = Number(amount) * rate;

    const payload = {
        merchantId,
        fromCurrencyCode,
        toCurrencyCode,
        email: user.email || "",
        mobile: user.mobile || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        country: user.country || "IR",
        city: user.city || "",
        description: description || "",
        amount: finalAmount.toFixed(2),
        orderNumber: String(orderNumber),
        callback: callbackUrl,
    };

    const res = await fetch(ENDPOINTS.request, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (Number(data.Code) !== 100) {
        throw new Error(
            `YekPay error (${data.Code}): ${data.Message || "Unknown error"}`
        );
    }

    return {
        authority: data.Authority,
        paymentUrl: `${ENDPOINTS.start}/${data.Authority}`,
    };
}

// ============================================================
// Verify Payment
// ============================================================
export async function verifyYekPayPayment(authority) {
    const merchantId = process.env.YEKPAY_MERCHANT_ID;

    if (!merchantId) {
        throw new Error("YEKPAY_MERCHANT_ID is not configured");
    }

    const res = await fetch(ENDPOINTS.verify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, authority }),
    });

    const data = await res.json();

    if (Number(data.Code) !== 100) {
        throw new Error(
            `YekPay verify error (${data.Code}): ${data.Message || "Unknown error"}`
        );
    }

    return {
        reference: data.Reference,
        gateway: data.Gateway,
        orderNo: data.OrderNo,
        amount: data.Amount,
        currency: data.Currency,
        raw: data,
    };
}