// src/components/admin/AdminTicketReplyForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AttachmentUpload from "@/components/support/AttachmentUpload";

export default function AdminTicketReplyForm({ ticketId }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          isInternal,
          attachments: attachments.map((a) => ({
            fileName: a.fileName,
            filePath: a.filePath,
            fileSize: a.fileSize,
            fileType: a.fileType,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(isInternal ? "Internal note added" : "Reply sent");
      setMessage("");
      setAttachments([]);
      setIsInternal(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e9e5",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#13251f",
          }}
        >
          {isInternal ? "Internal Note" : "Reply to User"}
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            color: isInternal ? "#d97706" : "#82918b",
          }}
        >
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#d97706" }}
          />
          <i className="fas fa-lock"></i> Internal note
        </label>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          isInternal
            ? "Internal note (visible to admins only)..."
            : "Type your reply to the user..."
        }
        rows={5}
        style={{
          width: "100%",
          padding: 12,
          border: `1.5px solid ${isInternal ? "#fbbf24" : "#e2e9e5"}`,
          borderRadius: 10,
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          resize: "vertical",
          background: isInternal ? "#fffbeb" : "white",
        }}
      />

      <div style={{ marginTop: 12 }}>
        <AttachmentUpload
          attachments={attachments}
          onChange={setAttachments}
          maxFiles={3}
          maxSizeMB={5}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 16,
        }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          style={{
            padding: "10px 24px",
            background: isInternal
              ? "linear-gradient(135deg, #f59e0b, #d97706)"
              : "linear-gradient(135deg, #13795b, #1d9a71)",
            border: "none",
            borderRadius: 10,
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading || !message.trim() ? "not-allowed" : "pointer",
            opacity: loading || !message.trim() ? 0.6 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm"></span>
              Sending...
            </>
          ) : (
            <>
              <i className={`fas ${isInternal ? "fa-lock" : "fa-paper-plane"}`}></i>
              {isInternal ? "Add Internal Note" : "Send Reply"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}