// src/components/home/Sidebar.js
import Link from "next/link";
import CountryFlag from "@/components/ui/CountryFlag";

export default function Sidebar({ suppliers, buyers }) {
  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Suppliers */}
      <div className="card border-0 shadow-sm p-3">
        <h5 className="fw-bold mb-3">
          <i
            className="fas fa-star me-2"
            style={{ color: "var(--color-primary, #e85d3a)" }}
          ></i>
          Top Suppliers
        </h5>
        <div className="d-flex flex-column gap-2">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="d-flex align-items-center gap-2 p-2 bg-light rounded-3"
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--color-secondary, #f4b942)",
                }}
              >
                <i className="fas fa-tractor"></i>
              </div>
              <div>
                <div className="fw-semibold small">{supplier.name}</div>
                <div className="small text-muted">
                  <span
                    className="d-inline-block rounded-1 me-1"
                    style={{
                      width: "14px",
                      height: "10px",
                      backgroundImage: `url(https://flagcdn.com/w20/${supplier.countryCode}.png)`,
                      backgroundSize: "cover",
                    }}
                  ></span>
                  {supplier.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Buyers */}
      <div className="card border-0 shadow-sm p-3">
        <h5 className="fw-bold mb-3">
          <i
            className="fas fa-users me-2"
            style={{ color: "var(--color-primary, #e85d3a)" }}
          ></i>
          Active Buyers
        </h5>
        <div className="d-flex flex-column gap-2">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="d-flex align-items-center gap-2 p-2 bg-light rounded-3"
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--color-primary, #e85d3a)",
                }}
              >
                <i className="fas fa-store text-white"></i>
              </div>
              <div>
                <div className="fw-semibold small">{buyer.name}</div>
                <div className="small text-muted">
                  <div className="supplier-country">
                    <CountryFlag countryCode={buyer.countryCode} size="14px" />
                    {buyer.country}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card border-0 shadow-sm p-3">
        <h5 className="fw-bold mb-3">
          <i
            className="fas fa-bolt me-2"
            style={{ color: "var(--color-primary, #e85d3a)" }}
          ></i>
          Quick Links
        </h5>
        <ul className="list-unstyled">
          <li className="mb-2">
            <Link href="/requests/new" className="text-decoration-none">
              <i
                className="fas fa-chevron-right me-2"
                style={{
                  color: "var(--color-primary, #e85d3a)",
                  fontSize: "10px",
                }}
              ></i>
              Post Buying Request
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/products/new" className="text-decoration-none">
              <i
                className="fas fa-chevron-right me-2"
                style={{
                  color: "var(--color-primary, #e85d3a)",
                  fontSize: "10px",
                }}
              ></i>
              Add Your Products
            </Link>
          </li>
          <li className="mb-2">
            <Link href="#" className="text-decoration-none">
              <i
                className="fas fa-chevron-right me-2"
                style={{
                  color: "var(--color-primary, #e85d3a)",
                  fontSize: "10px",
                }}
              ></i>
              Get Verified
            </Link>
          </li>
          <li className="mb-2">
            <Link href="#" className="text-decoration-none">
              <i
                className="fas fa-chevron-right me-2"
                style={{
                  color: "var(--color-primary, #e85d3a)",
                  fontSize: "10px",
                }}
              ></i>
              Trade Assistance
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
