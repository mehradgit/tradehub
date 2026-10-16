// src/components/admin/EmailComposeForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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
      // Raw text only — the server wraps it in the shared layout
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, subject, body: body.trim() }),
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
          global layout (header, logo and footer links).
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
