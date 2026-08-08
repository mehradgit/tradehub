// src/components/home/BuyingRequests.js
import RequestCard from "./RequestCard";

export default function BuyingRequests({ requests }) {
  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">
          <i className="fas fa-shopping-cart me-2" style={{ color: "var(--color-primary, #e85d3a)" }}></i>
          Buying Requests
        </h3>
        <a href="/requests" className="text-decoration-none fw-semibold">
          View All <i className="fas fa-arrow-right ms-1"></i>
        </a>
      </div>

      <div className="row g-3">
        {requests.map((request) => (
          <div key={request.id} className="col-md-6 col-lg-3">
            <RequestCard request={request} />
          </div>
        ))}
      </div>
    </div>
  );
}