// src/app/dashboard/support/new/page.js
import Link from "next/link";
import TicketForm from "@/components/support/TicketForm";

export const metadata = { title: "New Ticket | Support" };

export default function NewTicketPage() {
  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/dashboard/support" style={{ color: "var(--primary)" }}>
              Support
            </Link>
          </li>
          <li className="breadcrumb-item active text-muted">New Ticket</li>
        </ol>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <TicketForm />
      </div>
    </div>
  );
}