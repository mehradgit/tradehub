// src/app/admin/suppliers/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";

export const metadata = { title: "Suppliers | Admin" };

export default async function AdminSuppliersPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { page: pageParam = 1, search = "", plan = "" } = await searchParams;
  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = { role: "SUPPLIER" };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { country: { contains: search } },
    ];
  }
  if (plan) where.plan = plan;

  const [suppliers, totalCount, verifiedCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        companyName: true,
        country: true,
        countryCode: true,
        plan: true,
        registrationComplete: true,
        createdAt: true,
        profileNumber: true,
        slug: true,
        _count: {
          select: {
            products: { where: { isVisible: true } },
            productInquiriesAsSupplier: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({
      where: { role: "SUPPLIER", plan: { in: ["GOLD", "SILVER"] } },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <AdminPageHeader
        title="Suppliers Management"
        subtitle={`${totalCount} suppliers · ${verifiedCount} verified`}
      />

      <AdminFilterBar
        searchPlaceholder="Search suppliers..."
        filters={[
          {
            name: "plan",
            placeholder: "All Plans",
            options: [
              { value: "FREE", label: "Basic" },
              { value: "BRONZE", label: "Bronze" },
              { value: "SILVER", label: "Silver" },
              { value: "GOLD", label: "Gold" },
            ],
          },
        ]}
      />

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Country</th>
                <th>Plan</th>
                <th>Products</th>
                <th>Inquiries</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div className="admin-person">
                        {supplier.image ? (
                          <img src={supplier.image} alt={supplier.name} />
                        ) : (
                          <div className="avatar-letter">
                            {(supplier.companyName || supplier.name || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <b>{supplier.companyName || supplier.name}</b>
                          <span>{supplier.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {supplier.countryCode && (
                        <img
                          src={`https://flagcdn.com/w20/${supplier.countryCode.toLowerCase()}.png`}
                          alt=""
                          style={{ width: 18, marginRight: 5, verticalAlign: "middle" }}
                        />
                      )}
                      {supplier.country || "—"}
                    </td>
                    <td>
                      <span className={`admin-pill ${
                        supplier.plan === "GOLD" ? "premium" :
                        supplier.plan === "FREE" ? "basic" : "active"
                      }`}>
                        {supplier.plan}
                      </span>
                    </td>
                    <td>{supplier._count.products}</td>
                    <td>{supplier._count.productInquiriesAsSupplier}</td>
                    <td>
                      <span className={`admin-pill ${supplier.registrationComplete ? "active" : "pending"}`}>
                        {supplier.registrationComplete ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td>
                      {new Date(supplier.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${supplier.id}`}
                        style={{
                          width: 28, height: 28,
                          borderRadius: 7, background: "var(--bg)",
                          color: "var(--muted)", display: "grid",
                          placeItems: "center", fontSize: 11,
                        }}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </Link>
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