// src/components/home/RequestCard.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryCode } from "@/utils/countryHelpers";
import { getCountryViaCode } from "@/lib/countries";

export default function RequestCard({ request }) {
  // ✅ اگر request undefined باشد، چیزی نمایش نده
  if (!request) {
    return null;
  }

  const displayCountry = request.buyerCountry || request.deliveryCountry || null;
  const countryCode = getCountryCode(displayCountry);

  return (
    <Link href={`/requests/${request.requestNumber}/${request.slug}`} className="text-decoration-none">
      <div className={`request-card ${request.isUrgent ? "wanted" : ""}`}>
        <div className="request-header">
          <h3 className="request-title">{request.title}</h3>
          <span
            className={`request-badge ${request.isUrgent ? "wanted-badge" : "verified-badge"}`}
          >
            {request.isUrgent ? "Urgent" : "Verified"}
          </span>
        </div>
        <p className="request-description">{request.description}</p>
        <div className="request-footer">
          <span className="meta-item">
            <i className="far fa-calendar-alt"></i>{" "}
            {new Date(request.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="meta-item">
            <CountryFlag countryCode={getCountryViaCode(displayCountry)} size="14px" />
            <span style={{ marginLeft: "4px" }}>{displayCountry || "—"}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}