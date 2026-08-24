// src/components/home/BuyingRequests.js
import Link from "next/link";
import RequestCard from "./RequestCard";

export default function BuyingRequests({ requests }) {
  console.log(requests)
  return (
    <div className="featured-products-section">
      {/* ====== هدر با عنوان، زیرنویس و لینک ====== */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fas fa-shopping-cart"></i> Buying Requests
          </h2>
          <p className="section-subtitle">
            Connect with buyers actively looking for food products.
          </p>
        </div>
        <Link href="/requests" className="section-more">
          View All <i className="fas fa-arrow-right"></i>
        </Link>
      </div>

      {/* گرید درخواست‌ها */}
      <div className="requests-grid">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}