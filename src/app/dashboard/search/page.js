// src/app/dashboard/search/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Search Results | Dashboard" };

export default async function SearchPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { q = "" } = await searchParams;
  const query = q.trim();

  if (!query || query.length < 2) {
    return (
      <div className="container py-4">
        <div className="empty-state">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h3>Search Dashboard</h3>
          <p className="text-muted">Type at least 2 characters to search.</p>
        </div>
      </div>
    );
  }

  const userId = session.user.id;

  const [products, requests, tickets, messages] = await Promise.all([
    prisma.product.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query } },
          { shortDesc: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        images: true,
        productNumber: true,
        slug: true,
        category: true,
      },
      take: 20,
    }),
    prisma.buyingRequest.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        requestNumber: true,
        slug: true,
        category: true,
      },
      take: 20,
    }),
    prisma.ticket.findMany({
      where: {
        userId,
        OR: [
          { subject: { contains: query } },
          { ticketNumber: parseInt(query) || -1 },
        ],
      },
      select: {
        id: true,
        subject: true,
        ticketNumber: true,
        status: true,
      },
      take: 20,
    }),
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, content: { contains: query } },
          { receiverId: userId, content: { contains: query } },
        ],
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, name: true, companyName: true } },
        receiver: { select: { id: true, name: true, companyName: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const total =
    products.length + requests.length + tickets.length + messages.length;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-0">
          <i
            className="fas fa-search me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Search Results
        </h1>
        <p className="text-muted">
          {total} results for &quot;{query}&quot;
        </p>
      </div>

      {total === 0 && (
        <div className="empty-state">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h3>No results found</h3>
          <p className="text-muted">Try different keywords.</p>
        </div>
      )}

      {products.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">Products ({products.length})</h3>
          <div className="row g-3">
            {products.map((p) => (
              <div key={p.id} className="col-md-6">
                <Link
                  href={`/products/${p.productNumber}/${p.slug}`}
                  target="_blank"
                  className="text-decoration-none"
                >
                  <div className="card p-3">
                    <div className="fw-bold">{p.name}</div>
                    <div className="text-muted small">{p.category}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {requests.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">Buying Requests ({requests.length})</h3>
          <div className="row g-3">
            {requests.map((r) => (
              <div key={r.id} className="col-md-6">
                <Link
                  href={`/requests/${r.requestNumber}/${r.slug}`}
                  target="_blank"
                  className="text-decoration-none"
                >
                  <div className="card p-3">
                    <div className="fw-bold">{r.title}</div>
                    <div className="text-muted small">{r.category}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {tickets.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">Support Tickets ({tickets.length})</h3>
          <div className="row g-3">
            {tickets.map((t) => (
              <div key={t.id} className="col-md-6">
                <Link
                  href={`/dashboard/support/${t.ticketNumber}`}
                  className="text-decoration-none"
                >
                  <div className="card p-3">
                    <div className="fw-bold">#{t.ticketNumber} · {t.subject}</div>
                    <div className="text-muted small">{t.status}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {messages.length > 0 && (
        <section className="mb-5">
          <h3 className="fw-bold mb-3">Messages ({messages.length})</h3>
          <div className="row g-3">
            {messages.map((m) => {
              const other =
                m.sender?.id !== session.user.id ? m.sender : m.receiver;
              return (
                <div key={m.id} className="col-md-6">
                  <Link
                    href={`/dashboard/messages?userId=${other?.id}`}
                    className="text-decoration-none"
                  >
                    <div className="card p-3">
                      <div className="fw-bold">
                        {other?.companyName || other?.name}
                      </div>
                      <div className="text-muted small">
                        {m.content?.slice(0, 80)}...
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}