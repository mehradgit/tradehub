// src/app/dashboard/saved-products/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SavedTab from "@/components/dashboard/SavedTab";

export default async function SavedProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [savedProducts, savedRequests] = await Promise.all([
    prisma.savedProduct.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            user: {
              select: { id: true, name: true, companyName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedRequest.findMany({
      where: { userId: session.user.id },
      include: {
        request: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            isUrgent: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">
            <i className="fas fa-bookmark me-2" style={{ color: "var(--primary)" }}></i>
            Saved Items
          </h1>
          <p className="text-muted">Products and buying requests you've saved</p>
        </div>
      </div>

      <SavedTab products={savedProducts} requests={savedRequests} />
    </div>
  );
}