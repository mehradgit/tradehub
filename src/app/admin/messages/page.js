// src/app/admin/messages/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";

export const metadata = { title: "Messages | Admin" };

export default async function AdminMessagesPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { page: pageParam = 1, search = "", read = "" } = await searchParams;
  const page = parseInt(pageParam) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = {};
  if (read === "read") where.read = true;
  if (read === "unread") where.read = false;
  if (search) {
    where.content = { contains: search };
  }

  const [messages, totalCount, unreadCount] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    }),
    prisma.message.count({ where }),
    prisma.message.count({ where: { read: false } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <AdminPageHeader
        title="Messages"
        subtitle={`${totalCount} total · ${unreadCount} unread`}
      />

      <AdminFilterBar
        searchPlaceholder="Search messages..."
        filters={[
          {
            name: "read",
            placeholder: "All Messages",
            options: [
              { value: "read", label: "Read" },
              { value: "unread", label: "Unread" },
            ],
          },
        ]}
      />

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Message</th>
                <th>Product</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No messages found.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <Link
                        href={`/admin/users/${msg.sender.id}`}
                        style={{ color: "var(--green2)", fontWeight: 600 }}
                      >
                        {msg.sender.name || msg.sender.email}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${msg.receiver.id}`}
                        style={{ color: "var(--green2)", fontWeight: 600 }}
                      >
                        {msg.receiver.name || msg.receiver.email}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {msg.content?.slice(0, 60)}
                        {msg.content?.length > 60 ? "..." : ""}
                      </span>
                    </td>
                    <td>{msg.product?.name || "—"}</td>
                    <td>
                      <span className={`admin-pill ${msg.read ? "active" : "pending"}`}>
                        {msg.read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td>
                      {new Date(msg.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
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