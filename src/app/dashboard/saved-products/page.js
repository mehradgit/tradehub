// src/app/dashboard/saved-products/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import SavedProductCard from "@/components/dashboard/SavedProductCard";

export default async function SavedProductsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const savedProducts = await prisma.savedProduct.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Layout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-0">
              <i className="fas fa-bookmark me-2" style={{ color: "var(--primary)" }}></i>
              Saved Products
            </h1>
            <p className="text-muted">Products you've saved for later</p>
          </div>
          <Link href="/products" className="btn btn-primary btn-sm">
            <i className="fas fa-search me-1"></i> Browse Products
          </Link>
        </div>

        {savedProducts.length > 0 ? (
          <div className="row g-3">
            {savedProducts.map(({ product }) => (
              <div key={product.id} className="col-12 col-md-6 col-lg-4">
                <SavedProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-bookmark fa-3x text-muted mb-3"></i>
            <h3>No saved products</h3>
            <p className="text-muted">
              Start saving products you're interested in by clicking the Save button on product pages.
            </p>
            <Link href="/products" className="btn btn-primary">
              <i className="fas fa-search me-2"></i>Browse Products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}