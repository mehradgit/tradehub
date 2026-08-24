// src/app/api/track-view/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "product") {
      await prisma.product.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } else if (type === "request") {
      await prisma.buyingRequest.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}