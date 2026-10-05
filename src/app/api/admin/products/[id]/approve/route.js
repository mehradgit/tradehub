// src/app/api/admin/products/[id]/approve/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache"; // ✅
import { dispatchEvent } from "@/lib/eventService";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionNote = "" } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
        productNumber: true,
        slug: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    const isApproving = action === "approve";

    const updated = await prisma.product.update({
      where: { id },
      data: {
        status: isApproving ? "APPROVED" : "REJECTED",
        isVisible: isApproving,
        rejectionNote: isApproving ? null : rejectionNote,
        approvedAt: isApproving ? new Date() : null,
        approvedBy: isApproving ? session.user.id : null,
      },
    });

    // ✅ Notify the product owner via the central event path
    //    (In-App + Web Push + Email, after the response is sent)
    after(async () => {
      const result = await dispatchEvent("product.reviewed", {
        productId: product.id,
        approved: isApproving,
        rejectionNote,
      });
      if (result?.error) {
        console.error("[product.reviewed] dispatch error:", result.error);
      }
    });

    // ✅ Invalidate caches
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.productNumber}/${product.slug}`);

    return NextResponse.json({
      message: isApproving
        ? "Product approved successfully"
        : "Product rejected",
      product: updated,
    });
  } catch (error) {
    console.error("Product approval error:", error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 },
    );
  }
}