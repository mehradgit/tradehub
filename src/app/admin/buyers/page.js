// src/app/admin/buyers/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";

export const metadata = { title: "Buyers | Admin" };

export default async function AdminBuyersPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { page: pageParam = 1, search = "", plan = "" } = await searchParams;
  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = { role: "BUYER" };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { country: { contains: search } },
    ];
  }
  if (plan) where.plan = plan;

  const [buyers, totalCount] = await Promise.all([
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
        _count: {
          select: {
            buyingRequests: true,
            productInquiriesAsBuyer: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <AdminPageHeader
        title="Buyers Management"
        subtitle={`${totalCount} buyers on the platform`}
      />

      <AdminFilterBar
        searchPlaceholder="Search buyers..."
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
                <th>Buyer</th>
                <th>Country</th>
                <th>Plan</th>
                <th>Requests</th>
                <th>Inquiries</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No buyers found.
                  </td>
                </tr>
              ) : (
                buyers.map((buyer) => (
                  <tr key={buyer.id}>
                    <td>
                      <div className="admin-person">
                        {buyer.image ? (
                          <img src={buyer.image} alt={buyer.name} />
                        ) : (
                          <div className="avatar-letter">
                            {(buyer.companyName || buyer.name || "B").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <b>{buyer.companyName || buyer.name}</b>
                          <span>{buyer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {buyer.countryCode && (
                        <img
                          src={`https://flagcdn.com/w20/${buyer.countryCode.toLowerCase()}.png`}
                          alt=""
                          style={{ width: 18, marginRight: 5, verticalAlign: "middle" }}
                        />
                      )}
                      {buyer.country || "—"}
                    </td>
                    <td>
                      <span className={`admin-pill ${
                        buyer.plan === "GOLD" ? "premium" :
                        buyer.plan === "FREE" ? "basic" : "active"
                      }`}>
                        {buyer.plan}
                      </span>
                    </td>
                    <td>{buyer._count.buyingRequests}</td>
                    <td>{buyer._count.productInquiriesAsBuyer}</td>
                    <td>
                      <span className={`admin-pill ${buyer.registrationComplete ? "active" : "pending"}`}>
                        {buyer.registrationComplete ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td>
                      {new Date(buyer.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${buyer.id}`}
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