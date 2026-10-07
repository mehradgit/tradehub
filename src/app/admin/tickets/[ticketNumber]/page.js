// src/app/admin/tickets/[ticketNumber]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AdminTicketThread from "@/components/admin/AdminTicketThread";
import AdminTicketReplyForm from "@/components/admin/AdminTicketReplyForm";
import AdminTicketControls from "@/components/admin/AdminTicketControls";
import {
  getCategoryLabel,
  getPriorityColor,
  getStatusColor,
} from "@/utils/ticketHelpers";
import SafeImage from "@/components/ui/SafeImage";

export async function generateMetadata({ params }) {
  const { ticketNumber } = await params;
  const num = parseInt(ticketNumber);
  if (isNaN(num)) return { title: "Ticket Not Found | Admin" };
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber: num },
    select: { subject: true },
  });
  return {
    title: ticket ? `#${num} · ${ticket.subject} | Admin` : "Ticket Not Found",
  };
}

export default async function AdminTicketDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { ticketNumber } = await params;
  const num = parseInt(ticketNumber);
  if (isNaN(num)) notFound();

  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber: num },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          country: true,
          countryCode: true,
          image: true,
          plan: true,
          profileNumber: true,
          slug: true,
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: {
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

  if (ticket.unreadByAdmin) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { unreadByAdmin: false },
    });
  }

  // Related info
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

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const statusStyle = getStatusColor(ticket.status);
  const priorityStyle = getPriorityColor(ticket.priority);

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/admin/tickets"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Tickets
        </Link>
      </div>

      {/* Header Card */}
      <div className="admin-card" style={{ padding: 24, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              TICKET #{ticket.ticketNumber} · {getCategoryLabel(ticket.category)}
            </div>
            <h1
              style={{
                font: "800 22px 'Manrope', sans-serif",
                color: "#13251f",
                margin: "0 0 8px 0",
              }}
            >
              {ticket.subject}
            </h1>
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
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                Created{" "}
                {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* User info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 14,
            background: "#f9fbfa",
            borderRadius: 10,
            border: "1px solid #eef2f0",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#13795b",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 15,
              overflow: "hidden",
            }}
          >
            {ticket.user?.image ? (
              <SafeImage
                src={ticket.user.image}
                alt=""
                fallbackType="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              (ticket.user?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#13251f",
              }}
            >
              {ticket.user?.companyName || ticket.user?.name || "Unknown"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {ticket.user?.email}
              {ticket.user?.country && ` · ${ticket.user.country}`}
              {ticket.user?.plan && ` · Plan: ${ticket.user.plan}`}
            </div>
          </div>
          {ticket.user?.profileNumber && ticket.user?.slug && (
            <Link
              href={`/profiles/${ticket.user.profileNumber}/${ticket.user.slug}`}
              target="_blank"
              style={{
                fontSize: 11,
                padding: "6px 14px",
                background: "#eaf7f1",
                color: "#13795b",
                borderRadius: 50,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View Profile →
            </Link>
          )}
        </div>

        {/* Related info */}
        {(relatedProduct || relatedRequest) && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px dashed #eef2f0",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 12,
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
                  color: "var(--green2)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <i className="fa-solid fa-box"></i>
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
                  color: "var(--green2)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <i className="fa-solid fa-shopping-cart"></i>
                Request: {relatedRequest.title}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 16 }}>
        <AdminTicketControls ticket={ticket} admins={admins} />
      </div>

      {/* Thread */}
      <div className="admin-card" style={{ padding: 24, marginBottom: 16 }}>
        <h3
          style={{
            font: "800 15px 'Manrope', sans-serif",
            color: "#13251f",
            margin: "0 0 20px 0",
          }}
        >
          Conversation ({ticket.messages.length})
        </h3>
        <AdminTicketThread messages={ticket.messages} />
      </div>

      {/* Reply form */}
      <AdminTicketReplyForm ticketId={ticket.id} />
    </>
  );
}