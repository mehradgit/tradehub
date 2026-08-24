// src/app/dashboard/inquiries/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import InquiryList from "@/components/dashboard/InquiryList";

export default async function InquiriesPage({ searchParams }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { tab = "buyer", productId } = await searchParams;

  // ====== ساخت شرط WHERE ======
  const where = {
    [tab === "buyer" ? "userId" : "supplierId"]: userId,
  };
  if (productId) {
    where.productId = productId;
  }

  // ====== دریافت درخواست‌ها ======
  const inquiries = await prisma.productInquiry.findMany({
    where,
    select: {
      id: true,
      message: true,
      quantity: true,
      requestedPrice: true,
      status: true,
      createdAt: true,
      read: true,
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          unit: true,
          category: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          phone: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // ====== دریافت نام محصول برای هدر ======
  let productName = "";
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });
    if (product) productName = product.name;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">
            <i className="fas fa-file-invoice me-2" style={{ color: "var(--primary)" }}></i>
            My Inquiries
            {productName && (
              <span className="text-muted" style={{ fontSize: "16px", fontWeight: "400", marginLeft: "10px" }}>
                for "{productName}"
              </span>
            )}
          </h1>
          <p className="text-muted">Manage your product inquiries</p>
        </div>
        {productName && (
          <Link href="/dashboard/inquiries" className="btn btn-outline-secondary btn-sm">
            <i className="fas fa-arrow-left me-2"></i> Back to All
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-3 mb-4 border-bottom pb-2">
        <Link
          href={`/dashboard/inquiries?tab=buyer${productId ? `&productId=${productId}` : ""}`}
          className={`fw-bold text-decoration-none px-3 py-2 rounded-pill ${
            tab === "buyer" ? "bg-primary text-white" : "text-muted"
          }`}
        >
          As Buyer
        </Link>
        <Link
          href={`/dashboard/inquiries?tab=supplier${productId ? `&productId=${productId}` : ""}`}
          className={`fw-bold text-decoration-none px-3 py-2 rounded-pill ${
            tab === "supplier" ? "bg-primary text-white" : "text-muted"
          }`}
        >
          As Supplier
        </Link>
      </div>

      {inquiries.length > 0 ? (
        <InquiryList inquiries={inquiries} tab={tab} />
      ) : (
        <div className="empty-state">
          <i className="fas fa-file-invoice fa-3x text-muted mb-3"></i>
          <h3>No inquiries yet</h3>
          <p className="text-muted">
            {tab === "buyer"
              ? "You haven't sent any product inquiries yet."
              : "You haven't received any product inquiries yet."}
          </p>
          {tab === "buyer" && (
            <Link href="/products" className="btn btn-primary">
              <i className="fas fa-search me-2"></i>Browse Products
            </Link>
          )}
        </div>
      )}
    </div>
  );
}