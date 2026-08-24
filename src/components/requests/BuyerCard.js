// src/components/request/BuyerCard.js
import CountryFlag from "@/components/ui/CountryFlag";
import { getCountryCode } from "@/utils/countryHelpers";

export default function BuyerCard({ user }) {
  const displayName = user?.companyName || user?.name || "Anonymous Buyer";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const userCountryCode = getCountryCode(user?.countryCode || user?.country);

  return (
    <div className="buyer-card">
      <div className="buyer-card-cover">
        {user?.image || user?.logo ? (
          <img src={user?.image || user?.logo} alt={displayName} />
        ) : (
          <div className="buyer-card-cover-placeholder">
            <i className="fas fa-user-circle"></i>
          </div>
        )}
      </div>
      <div className="buyer-card-body">
        <div className="buyer-avatar">
          {user?.image || user?.logo ? (
            <img src={user?.image || user?.logo} alt={displayName} />
          ) : (
            <span className="buyer-initials">{initials}</span>
          )}
        </div>
        <h3 className="buyer-name">{displayName}</h3>
        <div className="buyer-location">
          <CountryFlag countryCode={userCountryCode} size="16px" />
          <span>{user?.country || "Location not specified"}</span>
        </div>
        <div className="buyer-member-since">
          <i className="fas fa-calendar-alt"></i>
          Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
        </div>
        <div className="buyer-divider"></div>
        <div className="buyer-actions">
          <button className="btn btn-submit-quote">
            <i className="fas fa-paper-plane"></i> Submit Quote
          </button>
          <button className="btn btn-save">
            <i className="fas fa-bookmark"></i> Save
          </button>
        </div>
      </div>
    </div>
  );
}