// src/components/support/TicketReplyForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AttachmentUpload from "./AttachmentUpload";

export default function TicketReplyForm({ ticketId, disabled }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          attachments: attachments.map((a) => ({
            fileName: a.fileName,
            filePath: a.filePath,
            fileSize: a.fileSize,
            fileType: a.fileType,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reply");

      toast.success("Reply sent");
      setMessage("");
      setAttachments([]);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <div
        style={{
          padding: 16,
          background: "var(--light)",
          borderRadius: 12,
          textAlign: "center",
          color: "var(--gray)",
          fontSize: 13,
        }}
      >
        <i className="fas fa-lock me-2"></i>
        This ticket is closed. Reopen it to reply.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "white",
        border: "1px solid var(--gray-light)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <label className="form-label fw-semibold mb-2">Your Reply</label>
      <textarea
        className="form-control"
        rows="4"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />

      <div className="mt-3">
        <AttachmentUpload
          attachments={attachments}
          onChange={setAttachments}
          maxFiles={3}
          maxSizeMB={5}
        />
      </div>

      <div className="d-flex justify-content-end mt-3">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !message.trim()}
        >
          {loading ? "Sending..." : "Send Reply"}
          <i className="fas fa-paper-plane ms-2"></i>
        </button>
      </div>
    </form>
  );
}