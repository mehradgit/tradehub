// src/app/admin/payments/new/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ManualPaymentForm from "@/components/admin/ManualPaymentForm";

export const metadata = { title: "Add Payment | Admin" };

export default async function NewPaymentPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    include: { prices: { orderBy: { duration: "asc" } } },
    orderBy: { maxProducts: "asc" },
  });

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/admin/payments"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Payments
        </Link>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            font: "800 22px 'Manrope', sans-serif",
            color: "#13251f",
            marginBottom: 6,
          }}
        >
          Create Manual Payment
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Manually register a payment on behalf of a user (e.g., offline or
          phone orders).
        </p>
      </div>

      <ManualPaymentForm plans={JSON.parse(JSON.stringify(plans))} />
    </>
  );
}