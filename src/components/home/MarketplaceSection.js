// src/components/home/MarketplaceSection.js
import Link from "next/link";

export default function MarketplaceSection({ suppliers = [], buyers = [] }) {
  return (
    <section className="section mb-5">
      <div className="section-heading">
        <div>
          <h2>Meet the Marketplace</h2>
          <p>Discover active suppliers and buyers from around the world.</p>
        </div>
      </div>
      <div className="market-layout">
        <div className="market-box">
          <div className="market-title">
            <i className="fa-solid fa-building"></i>
            <div>
              <h3>Top Suppliers</h3>
              <small>Verified food businesses</small>
            </div>
          </div>
          {suppliers.map((s) => (
            <div className="company" key={s.id}>
              <div className="company-logo">
                <i className="fa-solid fa-wheat-awn"></i>
              </div>
              <div className="company-info">
                <strong>{s.companyName || s.name}</strong>
                <small>
                  {s.country || "—"} · {s._count.products} products
                </small>
              </div>
              <Link href={`/profiles/${s.profileNumber}/${s.slug}`}>View</Link>
            </div>
          ))}
        </div>

        <div className="market-box">
          <div className="market-title">
            <i className="fa-solid fa-cart-shopping"></i>
            <div>
              <h3>Active Buyers</h3>
              <small>Companies sourcing products</small>
            </div>
          </div>
          {buyers.map((b) => (
            <div className="company" key={b.id}>
              <div className="company-logo">
                <i className="fa-solid fa-store"></i>
              </div>
              <div className="company-info">
                <strong>{b.companyName || b.name}</strong>
                <small>
                  {b.country || "—"} · {b._count.buyingRequests} requests
                </small>
              </div>
              <Link href={`/profiles/${b.profileNumber}/${b.slug}`}>View</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}