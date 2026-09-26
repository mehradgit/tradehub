// src/components/admin/AdminTicketThread.js
"use client";

export default function AdminTicketThread({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#82918b" }}>
        No messages yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {messages.map((msg) => {
        const isAdmin = msg.sender?.isAdmin;
        const isInternal = msg.isInternal;

        return (
          <div
            key={msg.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexDirection: isAdmin ? "row-reverse" : "row",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: isAdmin ? "#13795b" : "#e85d3a",
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
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : isAdmin ? (
                <i className="fas fa-user-shield"></i>
              ) : (
                (msg.sender?.name || "U").charAt(0).toUpperCase()
              )}
            </div>

            {/* Bubble */}
            <div style={{ flex: 1, maxWidth: "75%" }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 4,
                  flexDirection: isAdmin ? "row-reverse" : "row",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#13251f",
                  }}
                >
                  {msg.sender?.companyName ||
                    msg.sender?.name ||
                    (isAdmin ? "Admin" : "User")}
                </span>

                {isAdmin && !isInternal && (
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

                {isInternal && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 50,
                      background: "#fff4dd",
                      color: "#d97706",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    <i className="fas fa-lock me-1"></i>
                    Internal
                  </span>
                )}

                <span style={{ fontSize: 11, color: "#82918b" }}>
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
                  background: isInternal
                    ? "#fffbeb"
                    : isAdmin
                    ? "#13795b"
                    : "white",
                  color: isInternal
                    ? "#78350f"
                    : isAdmin
                    ? "white"
                    : "#33413d",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  border: isInternal
                    ? "1px dashed #fbbf24"
                    : isAdmin
                    ? "none"
                    : "1px solid #e2e9e5",
                }}
              >
                {msg.message}
              </div>

              {msg.attachments?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 8,
                    justifyContent: isAdmin ? "flex-end" : "flex-start",
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
                        width: 70,
                        height: 70,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid #e2e9e5",
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