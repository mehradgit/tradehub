// src/app/dashboard/support/[ticketNumber]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import TicketThread from "@/components/support/TicketThread";
import TicketReplyForm from "@/components/support/TicketReplyForm";
import TicketActions from "@/components/support/TicketActions";
import {
  getCategoryLabel,
  getPriorityColor,
  getStatusColor,
} from "@/utils/ticketHelpers";

export async function generateMetadata({ params }) {
  const { ticketNumber } = await params;
  const num = parseInt(ticketNumber);
  if (isNaN(num)) return { title: "Ticket Not Found" };

  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber: num },
    select: { subject: true },
  });

  return {
    title: ticket ? `${ticket.subject} | Support` : "Ticket Not Found",
  };
}

export default async function TicketDetailPage({ params }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { ticketNumber } = await params;
  const num = parseInt(ticketNumber);
  if (isNaN(num)) notFound();

  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber: num },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              companyName: true,
              image: true,
              isAdmin: true,
            },
          },
          attachments: true,
        },
      },
    },
  });

  if (!ticket) notFound();

  if (ticket.userId !== session.user.id) {
    redirect("/dashboard/support");
  }

  // Mark as read
  if (ticket.unreadByUser) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { unreadByUser: false },
    });
  }

  // Related product/request
  let relatedProduct = null;
  let relatedRequest = null;

  if (ticket.relatedProductId) {
    relatedProduct = await prisma.product.findUnique({
      where: { id: ticket.relatedProductId },
      select: { id: true, name: true, productNumber: true, slug: true },
    });
  }

  if (ticket.relatedRequestId) {
    relatedRequest = await prisma.buyingRequest.findUnique({
      where: { id: ticket.relatedRequestId },
      select: { id: true, title: true, requestNumber: true, slug: true },
    });
  }

  const statusStyle = getStatusColor(ticket.status);
  const priorityStyle = getPriorityColor(ticket.priority);

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/dashboard/support" style={{ color: "var(--primary)" }}>
              Support
            </Link>
          </li>
          <li className="breadcrumb-item active text-muted">
            #{ticket.ticketNumber}
          </li>
        </ol>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header Card */}
        <div className="card shadow-sm border-0 mb-4" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--gray)",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                #{ticket.ticketNumber}
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--black)",
                  margin: "0 0 8px 0",
                }}
              >
                {ticket.subject}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontWeight: 700,
                    background: statusStyle.bg,
                    color: statusStyle.color,
                  }}
                >
                  {statusStyle.label}
                </span>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 50,
                    fontSize: 10,
                    fontWeight: 700,
                    background: priorityStyle.bg,
                    color: priorityStyle.color,
                    textTransform: "uppercase",
                  }}
                >
                  {ticket.priority}
                </span>
                <span style={{ fontSize: 12, color: "var(--gray)" }}>
                  {getCategoryLabel(ticket.category)}
                </span>
              </div>
            </div>
            <TicketActions ticketId={ticket.id} status={ticket.status} />
          </div>

          {/* Related info */}
          {(relatedProduct || relatedRequest) && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--gray-light)",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 13,
              }}
            >
              {relatedProduct && (
                <Link
                  href={`/products/${relatedProduct.productNumber}/${relatedProduct.slug}`}
                  target="_blank"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--primary)",
                  }}
                >
                  <i className="fas fa-box"></i>
                  Product: {relatedProduct.name}
                </Link>
              )}
              {relatedRequest && (
                <Link
                  href={`/requests/${relatedRequest.requestNumber}/${relatedRequest.slug}`}
                  target="_blank"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--primary)",
                  }}
                >
                  <i className="fas fa-shopping-cart"></i>
                  Request: {relatedRequest.title}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="card shadow-sm border-0 mb-4" style={{ padding: 24 }}>
          <TicketThread messages={ticket.messages} />
        </div>

        {/* Reply form */}
        <TicketReplyForm
          ticketId={ticket.id}
          disabled={ticket.status === "closed"}
        />
      </div>
    </div>
  );
}