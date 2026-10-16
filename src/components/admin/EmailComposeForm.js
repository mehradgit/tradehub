// src/components/admin/EmailComposeForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Wrap the body in the shared site layout (FoodTradeLink branding)
// so the email always comes from the site's identity.
function emailLayout(content) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e2da; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #13795b; padding: 12px 24px; border-radius: 12px; color: white; font-size: 22px; font-weight: bold;">
          FoodTradeLink
        </div>
      </div>
      ${content}
      <hr style="border: 1px solid #e8e2da; margin: 24px 0;" />
      <p style="color: #7a6e64; font-size: 11px; text-align: center; margin: 0;">
        This message was sent from FoodTradeLink.
      </p>
    </div>
  `;
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--line)",
  borderRadius: "9px",
  fontSize: "13px",
  fontFamily: "inherit",
  color: "var(--text)",
  background: "#fff",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--muted)",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: ".4px",
};

export default function EmailComposeForm() {
  const router = useRouter();
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!toEmail || !subject || !body.trim()) {
      toast.warning("Please fill in the recipient, subject and body.");
      return;
    }
    setBusy(true);
    try {
      const htmlBody = emailLayout(
        `<div style="font-size: 14px; line-height: 1.6; color: #333;">${body
          .trim()
          .split(/\n+/)
          .map((p) => `<p style="margin: 0 0 12px;">${p.replace(/</g, "&lt;")}</p>`)
          .join("")}</div>`
      );

      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, subject, htmlBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Send failed");

      toast.success(data.message || "Email queued");
      setToEmail("");
      setSubject("");
      setBody("");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>To (recipient email)</label>
        <input
          style={inputStyle}
          type="email"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="company@example.com"
          required
        />
      </div>

      <div>
        <label style={labelStyle}>Subject</label>
        <input
          style={inputStyle}
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          required
        />
      </div>

      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          style={{ ...inputStyle, minHeight: 220, resize: "vertical", fontFamily: "inherit" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message here..."
          required
        />
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          The message is sent from the site's email address, wrapped in the
          FoodTradeLink layout.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => {
            setToEmail("");
            setSubject("");
            setBody("");
          }}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #13795b, #0d9469)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Sending..." : "Send Email"}
        </button>
      </div>
    </form>
  );
}
