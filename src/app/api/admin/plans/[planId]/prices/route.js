import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await params; // ✅ await params

  const body = await request.json(); // { prices: [{duration, price}] }

  try {
    for (const price of body.prices) {
      // Convert price to a number if it is a string
      const priceValue =
        typeof price.price === "string" ? parseFloat(price.price) : price.price;

      // Validate duration
      const duration = parseInt(price.duration, 10);
      if (isNaN(duration)) continue;

      await prisma.planPrice.upsert({
        where: {
          planId_duration: { planId, duration },
        },
        update: { price: priceValue },
        create: { planId, duration, price: priceValue },
      });
    }
    return NextResponse.json({ message: "Prices updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update prices" }, { status: 500 });
  }
}