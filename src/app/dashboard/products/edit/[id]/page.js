// src/app/dashboard/products/edit/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import EditProductForm from "@/components/dashboard/EditProductForm";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  if (product.userId !== session.user.id) {
    redirect("/dashboard/products");
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">Edit Product</h1>
          <p className="text-muted">Update your product information</p>
        </div>
        <a href="/dashboard/products" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Products
        </a>
      </div>
      <EditProductForm product={product} />
    </div>
  );
}
