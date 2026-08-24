// src/components/requests/RequestCard.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryCode } from "@/utils/countryHelpers";
import { getCountryViaCode } from "@/lib/countries";

export default function RequestCard({ request }) {
  if (!request) {
    return null;
  }

  const displayCountry = request.buyerCountry || request.deliveryCountry || null;
  const countryCode = getCountryCode(displayCountry);

  const formattedDate = request.createdAt
    ? new Date(request.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <Link href={`/requests/${request.requestNumber}/${request.slug}`} className="text-decoration-none">
      <div className={`request-card ${request.isUrgent ? "wanted" : ""}`}>
        {/* دسته‌بندی */}
        <div className="request-category">
          {request.category || "Uncategorized"}
          {request.subCategory && ` • ${request.subCategory}`}
        </div>

        <div className="request-header">
          <h3 className="request-title">{request.title}</h3>
          {request.isUrgent && (
            <span className="request-badge wanted-badge">Urgent</span>
          )}
        </div>

        {/* ✅ خط نارنجی زیر عنوان */}
        <div className="request-underline" />

        <p className="request-description">{request.description}</p>

        <div className="request-footer">
          <span className="meta-item">
            <i className="far fa-calendar-alt"></i> {formattedDate}
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