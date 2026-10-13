// src/app/api/payments/nowpayments/ipn/route.js
// ============================================================
// NOWPayments Instant Payment Notification (webhook)
// NOWPayments POSTs payment status updates here. There is no
// session/auth — the HMAC-SHA512 signature is the proof.
// Set this URL in the NOWPayments dashboard → Settings → IPN.
// ============================================================
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  verifyNowPaymentsIpn,
  mapNowPaymentsStatus,
} from "@/lib/nowpaymentsService";
import { createSubscriptionFromPayment } from "@/lib/paymentService";

export async function POST(request) {
  try {
    // ====== Read the RAW body first — the signature covers
    // the exact bytes, so it must be read before any parsing ======
    const rawBody = await request.text();
    const signature = request.headers.get("x-nowpayments-sig");

    if (!verifyNowPaymentsIpn(rawBody, signature)) {
      console.error("NOWPayments IPN: invalid signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(rawBody);
    const paymentId = String(data.payment_id || "");
    const orderId = String(data.order_id || "");
    const status = mapNowPaymentsStatus(data.payment_status);

    if (!paymentId) {
      return NextResponse.json({ message: "Missing payment_id" }, { status: 400 });
    }

    // ====== Find the payment (NOWPayments payment_id is
    // stored on the Payment record as transactionId) ======
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ transactionId: paymentId }, { invoiceNumber: orderId }],
      },
      include: { plan: true },
    });

    if (!payment) {
      console.error("NOWPayments IPN: payment not found", {
        paymentId,
        orderId,
      });
      return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    // ====== Already processed (idempotent — NOWPayments retries) ======
    if (payment.status === "paid") {
      return NextResponse.json({ message: "Already paid" }, { status: 200 });
    }

    // ====== Not final yet — keep waiting for "finished" ======
    if (status === "pending") {
      return NextResponse.json({ message: "Pending" }, { status: 200 });
    }

    // ====== Expired / failed ======
    if (status === "failed") {
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
      return NextResponse.json({ message: "Failed" }, { status: 200 });
    }

    // ====== Paid — mark, activate the subscription, update the plan ======
    const paidPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        metadata: {
          ...(payment.metadata || {}),
          nowpaymentsPaymentId: paymentId,
          nowpaymentsStatus: data.payment_status,
          actuallyPaid: data.actually_paid,
          payCurrency: data.pay_currency,
          paidAt: new Date().toISOString(),
        },
      },
    });

    await createSubscriptionFromPayment(paidPayment);

    await prisma.user.update({
      where: { id: payment.userId },
      data: { plan: payment.plan.name.toUpperCase() },
    });

    console.log("NOWPayments IPN: payment paid", payment.invoiceNumber);
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("NOWPayments IPN error:", error);
    // Non-2xx makes NOWPayments retry — safe because of the
    // "already paid" idempotency check above
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
