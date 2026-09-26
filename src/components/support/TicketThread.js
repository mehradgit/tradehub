// src/components/support/TicketThread.js
"use client";

import { useSession } from "next-auth/react";

export default function TicketThread({ messages }) {
  const { data: session } = useSession();

  if (!messages || messages.length === 0) {
    return (
      <div className="text-muted text-center py-4">
        No messages yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {messages.map((msg) => {
        const isMine = msg.senderId === session?.user?.id;
        const isAdmin = msg.sender?.isAdmin;

        return (
          <div
            key={msg.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexDirection: isMine ? "row-reverse" : "row",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: isAdmin ? "#13795b" : "var(--primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 14,
                fontWeight: 700,
                overflow: "hidden",
              }}
            >
              {msg.sender?.image ? (
                <img
                  src={msg.sender.image}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : isAdmin ? (
                <i className="fas fa-user-shield"></i>
              ) : (
                (msg.sender?.name || "U").charAt(0).toUpperCase()
              )}
            </div>

            {/* Message bubble */}
            <div
              style={{
                flex: 1,
                maxWidth: "75%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 4,
                  flexDirection: isMine ? "row-reverse" : "row",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--black)",
                  }}
                >
                  {isMine
                    ? "You"
                    : msg.sender?.companyName ||
                      msg.sender?.name ||
                      "Support"}
                </span>
                {isAdmin && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 50,
                      background: "#eaf7f1",
                      color: "#13795b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Support
                  </span>
                )}
                <span style={{ fontSize: 11, color: "var(--gray)" }}>
                  {new Date(msg.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div
                style={{
                  background: isMine ? "var(--primary)" : "white",
                  color: isMine ? "white" : "var(--gray-dark)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  border: isMine ? "none" : "1px solid var(--gray-light)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {msg.message}
              </div>

              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 8,
                    justifyContent: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        width: 80,
                        height: 80,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid var(--gray-light)",
                      }}
                    >
                      <img
                        src={att.filePath}
                        alt={att.fileName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}