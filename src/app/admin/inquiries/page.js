// src/app/admin/inquiries/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import SafeImage from "@/components/ui/SafeImage";

export const metadata = { title: "Inquiries | Admin" };

export default async function AdminInquiriesPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { page: pageParam = 1, search = "", status = "" } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { message: { contains: search } },
      { product: { name: { contains: search } } },
    ];
  }

  const [inquiries, totalCount] = await Promise.all([
    prisma.productInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, images: true } },
        user: { select: { id: true, name: true, email: true, companyName: true } },
        supplier: { select: { id: true, name: true, companyName: true } },
      },
    }),
    prisma.productInquiry.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const statusPill = (status) => {
    const map = {
      pending: { cls: "pending", label: "Pending" },
      responded: { cls: "active", label: "Responded" },
      accepted: { cls: "active", label: "Accepted" },
      rejected: { cls: "suspended", label: "Rejected" },
    };
    const s = map[status] || { cls: "basic", label: status };
    return <span className={`admin-pill ${s.cls}`}>{s.label}</span>;
  };

  return (
    <>
      <AdminPageHeader
        title="Product Inquiries"
        subtitle={`${totalCount} inquiries on the platform`}
      />

      <AdminFilterBar
        searchPlaceholder="Search inquiries..."
        filters={[
          {
            name: "status",
            placeholder: "All Statuses",
            options: [
              { value: "pending", label: "Pending" },
              { value: "responded", label: "Responded" },
              { value: "accepted", label: "Accepted" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
      />

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Buyer</th>
                <th>Supplier</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <tr key={inq.id}>
                    <td>
                      <div className="admin-person">
                        <SafeImage
                          src={inq.product?.images?.[0]}
                          alt={inq.product?.name}
                          fallbackType="product"
                          style={{ borderRadius: 8, width: 40, height: 40, objectFit: "cover" }}
                        />
                        <b>{inq.product?.name || "—"}</b>
                      </div>
                    </td>
                    <td>{inq.user?.companyName || inq.user?.name}</td>
                    <td>{inq.supplier?.companyName || inq.supplier?.name}</td>
                    <td>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {inq.message?.slice(0, 40)}...
                      </span>
                    </td>
                    <td>{statusPill(inq.status)}</td>
                    <td>
                      {new Date(inq.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination currentPage={page} totalPages={totalPages} />
      </div>
    </>
  );
}