import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ApprovalsTable from "@/components/admin/ApprovalsTable";

export const metadata = { title: "Pending Approvals | Admin" };

export default async function AdminApprovalsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const [products, requests, counts] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, companyName: true, email: true, profileNumber: true, slug: true },
        },
      },
    }),
    prisma.buyingRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, companyName: true, email: true, profileNumber: true, slug: true },
        },
      },
    }),
    Promise.all([
      prisma.product.count({ where: { status: "PENDING" } }),
      prisma.buyingRequest.count({ where: { status: "PENDING" } }),
    ]),
  ]);

  const [productCount, requestCount] = counts;

  // Serialize dates
  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    approvedAt: p.approvedAt?.toISOString() || null,
  }));

  const serializedRequests = requests.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deadline: r.deadline?.toISOString() || null,
    approvedAt: r.approvedAt?.toISOString() || null,
  }));

  return (
    <>
      <AdminPageHeader
        title="Pending Approvals"
        subtitle={`${productCount + requestCount} items waiting for review`}
      />

      {/* Stats */}
      <div className="admin-kpis" style={{ marginBottom: 16, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon green-bg"><i className="fa-solid fa-box"></i></div>
          <h4>Pending Products</h4>
          <strong>{productCount}</strong>
        </div>
        <div className="admin-kpi" style={{ minHeight: "auto", padding: 16 }}>
          <div className="admin-kpi-icon orange-bg"><i className="fa-solid fa-shopping-cart"></i></div>
          <h4>Pending Requests</h4>
          <strong>{requestCount}</strong>
        </div>
      </div>

      <ApprovalsTable products={serializedProducts} requests={serializedRequests} />
    </>
  );
}