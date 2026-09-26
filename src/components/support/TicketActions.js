// src/components/support/TicketActions.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function TicketActions({ ticketId, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const newStatus = status === "closed" ? "open" : "closed";
    const confirmMsg =
      newStatus === "closed"
        ? "Are you sure you want to close this ticket?"
        : "Do you want to reopen this ticket?";

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "closed") {
    return (
      <button
        className="btn btn-outline-primary btn-sm"
        onClick={handleToggle}
        disabled={loading}
      >
        <i className="fas fa-redo me-1"></i>
        {loading ? "Reopening..." : "Reopen Ticket"}
      </button>
    );
  }

  return (
    <button
      className="btn btn-outline-secondary btn-sm"
      onClick={handleToggle}
      disabled={loading}
    >
      <i className="fas fa-check me-1"></i>
      {loading ? "Closing..." : "Close Ticket"}
    </button>
  );
}