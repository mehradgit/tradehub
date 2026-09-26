import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    include: { prices: true },
    orderBy: { maxProducts: "asc" },
  });

  // تبدیل Decimal به Number
  const serialized = plans.map((plan) => ({
    ...plan,
    prices: plan.prices.map((price) => ({
      ...price,
      price: Number(price.price),
    })),
  }));

  return NextResponse.json(serialized);
}