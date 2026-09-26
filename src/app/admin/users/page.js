// src/app/admin/users/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";

export const metadata = { title: "Users | Admin" };

export default async function AdminUsersPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const {
    page: pageParam = 1,
    search = "",
    role = "",
    plan = "",
    status = "",
  } = await searchParams;

  const page = parseInt(pageParam) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { companyName: { contains: search } },
      { country: { contains: search } },
    ];
  }
  if (role) where.role = role;
  if (plan) where.plan = plan;
  if (status === "active") where.registrationComplete = true;
  if (status === "pending") where.registrationComplete = false;

  const [users, totalCount] = await Promise.all([
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
        role: true,
        plan: true,
        registrationComplete: true,
        createdAt: true,
        profileNumber: true,
        slug: true,
        _count: {
          select: {
            products: true,
            buyingRequests: true,
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
        title="Users Management"
        subtitle={`${totalCount} users on the platform`}
        action={
          <button
            style={{
              background: "var(--green2)",
              color: "white",
              border: 0,
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i>
            Add User
          </button>
        }
      />

      <AdminFilterBar
        searchPlaceholder="Search by name, email, company..."
        filters={[
          {
            name: "role",
            placeholder: "All Roles",
            options: [
              { value: "SUPPLIER", label: "Suppliers" },
              { value: "BUYER", label: "Buyers" },
            ],
          },
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
          {
            name: "status",
            placeholder: "All Statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
      />

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Country</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-person">
                        {user.image ? (
                          <img src={user.image} alt={user.name} />
                        ) : (
                          <div className="avatar-letter">
                            {(user.name || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <b>{user.companyName || user.name || "Unnamed"}</b>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.countryCode && (
                        <img
                          src={`https://flagcdn.com/w20/${user.countryCode.toLowerCase()}.png`}
                          alt=""
                          style={{ width: 18, marginRight: 5, verticalAlign: "middle" }}
                        />
                      )}
                      {user.country || "—"}
                    </td>
                    <td>
                      <span className={`admin-pill ${user.role === "SUPPLIER" ? "pending" : ""}`}>
                        {user.role === "SUPPLIER" ? "Supplier" : "Buyer"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${
                        user.plan === "GOLD" ? "premium" :
                        user.plan === "FREE" ? "basic" : "active"
                      }`}>
                        {user.plan || "FREE"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>
                        {user._count.products} products · {user._count.buyingRequests} requests
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${user.registrationComplete ? "active" : "pending"}`}>
                        {user.registrationComplete ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Link
                          href={`/admin/users/${user.id}`}
                          style={{
                            width: 28, height: 28,
                            borderRadius: 7,
                            background: "var(--bg)",
                            color: "var(--muted)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                          }}
                          title="View"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Link>
                        <button
                          style={{
                            width: 28, height: 28,
                            borderRadius: 7,
                            background: "var(--bg)",
                            color: "var(--muted)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            border: 0,
                            cursor: "pointer",
                          }}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      </div>
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