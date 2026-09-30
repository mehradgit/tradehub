// src/components/support/TicketListItem.js
"use client";

import Link from "next/link";
import SafeText from "@/components/ui/SafeText";
import {
  getCategoryLabel,
  getPriorityColor,
  getStatusColor,
} from "@/utils/ticketHelpers";

export default function TicketListItem({ ticket }) {
  const priorityStyle = getPriorityColor(ticket.priority);
  const statusStyle = getStatusColor(ticket.status);

  const isUnread = ticket.unreadByUser;
  const messageCount = ticket._count?.messages || 0;

  const formattedDate = new Date(ticket.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const detailUrl = `/dashboard/support/${ticket.ticketNumber}`;

  return (
    <>
      <Link href={detailUrl} className="tli-link">
        <div className={`tli-card ${isUnread ? "is-unread" : ""}`}>
          {/* ============================================================
             Icon Side
             ============================================================ */}
          <div className={`tli-icon ${ticket.status}`}>
            <i className="fas fa-headset"></i>
            {isUnread && <span className="tli-unread-dot"></span>}
          </div>

          {/* ============================================================
             Content
             ============================================================ */}
          <div className="tli-content">
            {/* Top Row: Ticket # + Status Badge */}
            <div className="tli-top">
              <div className="tli-number">
                <i className="fas fa-hashtag"></i>
                <SafeText text={ticket.ticketNumber} />
              </div>

              <div className={`tli-status ${ticket.status}`}>
                <i className={`fas ${statusStyle.icon || "fa-circle"}`}></i>
                <span>{statusStyle.label}</span>
              </div>
            </div>

            {/* Subject */}
            <h3 className="tli-subject">{ticket.subject}</h3>

            {/* Meta Row */}
            <div className="tli-meta">
              <span className="tli-meta-item">
                <i className="fas fa-tag"></i>
                <span>{getCategoryLabel(ticket.category)}</span>
              </span>

              <span
                className="tli-meta-item tli-priority"
                style={{
                  color: priorityStyle.color,
                  background: priorityStyle.bg,
                }}
              >
                <i className="fas fa-flag"></i>
                <span>{ticket.priority}</span>
              </span>

              <span className="tli-meta-item">
                <i className="far fa-comments"></i>
                <span>
                  {messageCount}{" "}
                  {messageCount === 1 ? "message" : "messages"}
                </span>
              </span>

              <span className="tli-meta-item">
                <i className="far fa-clock"></i>
                <span>{formattedDate}</span>
              </span>

              {ticket.assignedTo && (
                <span className="tli-meta-item tli-assigned">
                  <i className="fas fa-user-shield"></i>
                  <span>{ticket.assignedTo.name || "Support"}</span>
                </span>
              )}
            </div>
          </div>

          {/* ============================================================
             Right: Arrow
             ============================================================ */}
          <div className="tli-arrow">
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>
      </Link>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .tli-link {
          text-decoration: none;
          color: inherit;
          display: block;
          min-width: 0;
        }

        .tli-card {
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 14px;
          padding: 16px 18px;
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) auto;
          gap: 16px;
          align-items: flex-start;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          min-width: 0;
          position: relative;
        }

        .tli-card:hover {
          border-color: #13795b;
          box-shadow: 0 8px 24px rgba(19, 121, 91, 0.08);
          transform: translateY(-1px);
        }

        .tli-card.is-unread {
          border-left: 4px solid #13795b;
          padding-left: 15px;
          background: linear-gradient(90deg, #f8fdfb 0%, #ffffff 30%);
        }

        /* ============================================================
           Icon
           ============================================================ */
        .tli-icon {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .tli-icon.open {
          background: #eff6ff;
          color: #2563eb;
        }

        .tli-icon.in_progress {
          background: #fff7e6;
          color: #b45309;
        }

        .tli-icon.waiting_user {
          background: #eef0ff;
          color: #4f46e5;
        }

        .tli-icon.resolved {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .tli-icon.closed {
          background: #f1f5f7;
          color: #64748b;
        }

        .tli-unread-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid white;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
          animation: tliPulse 2s ease-in-out infinite;
        }

        @keyframes tliPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        /* ============================================================
           Content
           ============================================================ */
        .tli-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .tli-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tli-number {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
          font-family: "SF Mono", Monaco, monospace;
        }

        .tli-number i {
          font-size: 10px;
        }

        .tli-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tli-status i {
          font-size: 10px;
        }

        .tli-status.open {
          background: #eff6ff;
          color: #2563eb;
        }

        .tli-status.in_progress {
          background: #fff7e6;
          color: #b45309;
        }

        .tli-status.waiting_user {
          background: #eef0ff;
          color: #4f46e5;
        }

        .tli-status.resolved {
          background: #eaf7f1;
          color: #0b5b43;
        }

        .tli-status.closed {
          background: #f1f5f7;
          color: #64748b;
        }

        .tli-subject {
          font-size: 15px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          line-height: 1.4;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.01em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-wrap: break-word;
          transition: color 0.15s ease;
        }

        .tli-link:hover .tli-subject {
          color: #13795b;
        }

        /* ============================================================
           Meta
           ============================================================ */
        .tli-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11.5px;
          color: #64748b;
          align-items: center;
        }

        .tli-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          white-space: nowrap;
        }

        .tli-meta-item i {
          font-size: 10px;
          color: #94a3b8;
        }

        .tli-meta-item.tli-priority {
          padding: 2px 8px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .tli-meta-item.tli-priority i {
          color: inherit;
          font-size: 9px;
        }

        .tli-meta-item.tli-assigned {
          color: #13795b;
          font-weight: 600;
        }

        .tli-meta-item.tli-assigned i {
          color: #13795b;
        }

        /* ============================================================
           Arrow
           ============================================================ */
        .tli-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f8fafc;
          color: #94a3b8;
          flex-shrink: 0;
          transition: all 0.2s ease;
          align-self: center;
        }

        .tli-link:hover .tli-arrow {
          background: #13795b;
          color: white;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(19, 121, 91, 0.3);
        }

        .tli-arrow i {
          font-size: 11px;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 900px) {
          .tli-card {
            grid-template-columns: 44px minmax(0, 1fr);
            gap: 14px;
            padding: 14px;
          }

          .tli-icon {
            width: 44px;
            height: 44px;
            font-size: 16px;
          }

          .tli-arrow {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .tli-card {
            grid-template-columns: 40px minmax(0, 1fr);
            gap: 12px;
            padding: 12px;
            border-radius: 12px;
          }

          .tli-card.is-unread {
            padding-left: 9px;
          }

          .tli-icon {
            width: 40px;
            height: 40px;
            font-size: 15px;
            border-radius: 11px;
          }

          .tli-subject {
            font-size: 14px;
          }

          .tli-meta {
            gap: 10px;
            font-size: 11px;
          }

          .tli-status {
            font-size: 10px;
            padding: 3px 9px;
          }
        }

        @media (max-width: 400px) {
          .tli-meta-item:nth-child(n + 4) {
            display: none;
          }

          .tli-subject {
            font-size: 13.5px;
          }
        }
      `}</style>
    </>
  );
}