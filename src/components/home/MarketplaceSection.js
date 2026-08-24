// src/components/home/MarketplaceSection.js
import Link from "next/link";

export default function MarketplaceSection() {
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
          <div className="company">
            <div className="company-logo"><i className="fa-solid fa-wheat-awn"></i></div>
            <div className="company-info">
              <strong>Golden Harvest Foods</strong>
              <small>Turkey · Grains & Pulses</small>
            </div>
            <Link href="#">View</Link>
          </div>
          <div className="company">
            <div className="company-logo"><i className="fa-solid fa-leaf"></i></div>
            <div className="company-info">
              <strong>Green Valley Organics</strong>
              <small>Spain · Organic Produce</small>
            </div>
            <Link href="#">View</Link>
          </div>
          <div className="company">
            <div className="company-logo"><i className="fa-solid fa-jar"></i></div>
            <div className="company-info">
              <strong>Pure Nature Honey</strong>
              <small>New Zealand · Natural Honey</small>
            </div>
            <Link href="#">View</Link>
          </div>
        </div>

        <div className="market-box">
          <div className="market-title">
            <i className="fa-solid fa-cart-shopping"></i>
            <div>
              <h3>Active Buyers</h3>
              <small>Companies sourcing products</small>
            </div>
          </div>
          <div className="company">
            <div className="company-logo"><i className="fa-solid fa-store"></i></div>
            <div className="company-info">
              <strong>FreshMart Europe</strong>
              <small>Germany · Retail Chain</small>
            </div>
            <Link href="#">View</Link>
          </div>
          <div className="company">
            <div className="company-logo"><i className="fa-solid fa-utensils"></i></div>
            <div className="company-info">
              <strong>Global Food Service</strong>
              <small>UAE · Food Distribution</small>
            </div>
            <Link href="#">View</Link>
          </div>
          <div className="company">
            <div className="company-logo"><i className="fa-solid fa-box"></i></div>
            <div className="company-info">
              <strong>Nature Select Imports</strong>
              <small>Canada · Food Importer</small>
            </div>
            <Link href="#">View</Link>
          </div>
        </div>
      </div>
    </section>
  );
}