// src/components/admin/AdminTicketListItem.js
"use client";

import Link from "next/link";
import {
  getCategoryLabel,
  getPriorityColor,
  getStatusColor,
} from "@/utils/ticketHelpers";

export default function AdminTicketListItem({ ticket }) {
  const priorityStyle = getPriorityColor(ticket.priority);
  const statusStyle = getStatusColor(ticket.status);

  return (
    <Link
      href={`/admin/tickets/${ticket.ticketNumber}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          transition: "all 0.2s ease",
          position: "relative",
          cursor: "pointer",
        }}
        className="admin-ticket-item"
      >
        {/* Unread dot */}
        {ticket.unreadByAdmin && (
          <span
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 0 3px rgba(239,68,68,0.2)",
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
                color: "#82918b",
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              #{ticket.ticketNumber} · {getCategoryLabel(ticket.category)}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#13251f",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 4,
              }}
            >
              {ticket.subject}
            </div>
            <div style={{ fontSize: 12, color: "#71807b" }}>
              <i className="fas fa-user me-1"></i>
              {ticket.user?.companyName || ticket.user?.name || "Unknown"}
            </div>
          </div>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: 50,
              fontSize: 10,
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
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: 11,
            color: "#82918b",
            borderTop: "1px dashed #eef2f0",
            paddingTop: 10,
          }}
        >
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 50,
              fontSize: 9,
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
            {ticket._count?.messages || 0}
          </span>

          <span>
            <i className="far fa-clock me-1"></i>
            {new Date(ticket.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>

          {ticket.assignedTo && (
            <span>
              <i className="fas fa-user-shield me-1"></i>
              {ticket.assignedTo.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}