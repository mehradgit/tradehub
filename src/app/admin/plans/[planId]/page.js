// src/app/admin/plans/[planId]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PlanEditForm from "@/components/admin/PlanEditForm";

export const metadata = { title: "Edit Plan | Admin" };

export default async function EditPlanPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { planId } = await params;

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: { orderBy: { duration: "asc" } } },
  });

  if (!plan) notFound();

  // Serialize Decimal to Number
  const serializedPlan = {
    ...plan,
    prices: plan.prices.map((p) => ({
      ...p,
      price: Number(p.price),
    })),
  };

  return (
    <>
      <Link
        href="/admin/plans"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--green2)",
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        <i className="fa-solid fa-arrow-left"></i> Back to Plans
      </Link>

      <PlanEditForm plan={serializedPlan} />
    </>
  );
}