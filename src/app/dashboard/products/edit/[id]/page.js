// src/app/dashboard/products/edit/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getProductAttributes } from "@/lib/attributesService";
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

  // ============================================================
  // اتریبیوت‌های پویا (EAV) سمت سرور خوانده می‌شوند
  //
  // چرا: prisma.product.findUnique ستون‌های اسکالر را برمی‌گرداند و
  // رابطه‌ی attributes را شامل نمی‌شود. اگر فرم ویرایش آن را
  // کلاینت‌ساید می‌گرفت، در فاصله‌ی تغییر دسته یک race ایجاد می‌شد
  // که ممکن است مقادیر دسته‌ی قبلی ذخیره شوند.
  // ============================================================
  let attributes = [];
  try {
    attributes = await getProductAttributes(id);
  } catch (err) {
    console.error("[edit-product] getProductAttributes failed:", err);
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
      <EditProductForm product={{ ...product, attributes }} />
    </div>
  );
}
