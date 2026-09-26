// src/app/admin/coupons/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CouponManager from "@/components/admin/CouponManager";

export const metadata = { title: "Coupons | Admin" };

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const [coupons, plans] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { usages: true } },
      },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { maxProducts: "asc" },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Coupons & Discounts"
        subtitle={`${coupons.length} coupons available`}
      />
      <CouponManager
        initialCoupons={JSON.parse(JSON.stringify(coupons))}
        plans={plans}
      />
    </>
  );
}