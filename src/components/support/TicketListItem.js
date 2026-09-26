// src/components/support/TicketListItem.js
"use client";

import Link from "next/link";
import {
  getCategoryLabel,
  getPriorityColor,
  getStatusColor,
} from "@/utils/ticketHelpers";

export default function TicketListItem({ ticket }) {
  const priorityStyle = getPriorityColor(ticket.priority);
  const statusStyle = getStatusColor(ticket.status);

  return (
    <Link
      href={`/dashboard/support/${ticket.ticketNumber}`}  // ✅ بدون slug
      className="text-decoration-none"
    >
      <div
        style={{
          background: "white",
          border: "1px solid var(--gray-light)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          transition: "all 0.2s ease",
          boxShadow: "var(--shadow)",
          position: "relative",
        }}
        className="hover-shadow"
      >
        {ticket.unreadByUser && (
          <span
            style={{
              position: "absolute",
              top: 16,
              left: 8,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--primary)",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--gray)",
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              #{ticket.ticketNumber}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--black)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ticket.subject}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}
            >
              {getCategoryLabel(ticket.category)}
            </div>
          </div>

          <span
            style={{
              padding: "4px 12px",
              borderRadius: 50,
              fontSize: 11,
              fontWeight: 700,
              background: statusStyle.bg,
              color: statusStyle.color,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {statusStyle.label}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: 12,
            color: "var(--gray)",
            borderTop: "1px dashed var(--gray-light)",
            paddingTop: 10,
          }}
        >
          <span
            style={{
              padding: "2px 10px",
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

          <span>
            <i className="fas fa-comments me-1"></i>
            {ticket._count?.messages || 0} messages
          </span>

          <span>
            <i className="far fa-clock me-1"></i>
            {new Date(ticket.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>

          {ticket.assignedTo && (
            <span>
              <i className="fas fa-user-shield me-1"></i>
              {ticket.assignedTo.name || "Support"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}