// src/components/requests/RequestCard.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryCode } from "@/utils/countryHelpers";

export default function RequestCard({ request }) {
  const isUrgent = request.isUrgent;
  const budget = request.budgetRange || "Negotiable";
  const date = new Date(request.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // کشور مورد نمایش (اولویت با deliveryCountry، سپس country کاربر)
  const displayCountry = request.deliveryCountry || request.user?.country || null;
  const countryCode = getCountryCode(displayCountry);

  return (
    <Link href={`/requests/${request.id}`} className="text-decoration-none">
      <div className={`request-card ${isUrgent ? "wanted" : ""}`}>
        <div className="request-header">
          <h3 className="request-title">{request.title}</h3>
          <span className={`request-badge ${isUrgent ? "urgent" : "verified"}`}>
            {isUrgent ? "Urgent" : "Verified"}
          </span>
        </div>
        <p className="request-description">{request.description}</p>
        <div className="request-meta">
          <span className="meta-item">
            <i className="fas fa-tag"></i>
            <span className="budget">{budget}</span>
          </span>
          <span className="meta-item">
            <CountryFlag countryCode={countryCode} size="14px" />
            <span style={{ marginLeft: "4px" }}>{displayCountry || "—"}</span>
          </span>
          <span className="meta-item">
            <i className="far fa-calendar-alt"></i>
            {date}
          </span>
        </div>
      </div>
    </Link>
  );
}