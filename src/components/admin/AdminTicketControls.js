// src/components/admin/AdminTicketControls.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "@/utils/ticketHelpers";

export default function AdminTicketControls({ ticket, admins }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateTicket = async (updates) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Ticket updated");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = admins.find((a) => a.id === ticket.assignedToId);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        padding: 16,
        background: "#f9fbfa",
        borderRadius: 12,
        border: "1px solid #eef2f0",
      }}
    >
      {/* Status */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            color: "#82918b",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Status
        </label>
        <select
          value={ticket.status}
          onChange={(e) => updateTicket({ status: e.target.value })}
          disabled={loading}
          style={selectStyle}
        >
          {TICKET_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            color: "#82918b",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Priority
        </label>
        <select
          value={ticket.priority}
          onChange={(e) => updateTicket({ priority: e.target.value })}
          disabled={loading}
          style={selectStyle}
        >
          {TICKET_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assigned To */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            color: "#82918b",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Assigned To
        </label>
        <select
          value={ticket.assignedToId || ""}
          onChange={(e) =>
            updateTicket({ assignedToId: e.target.value || null })
          }
          disabled={loading}
          style={selectStyle}
        >
          <option value="">— Unassigned —</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e2e9e5",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "inherit",
  background: "white",
  outline: "none",
  cursor: "pointer",
};