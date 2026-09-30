// src/components/dashboard/InquiriesClient.js
"use client";

import Link from "next/link";
import InquiryListItem from "./InquiryListItem";

export default function InquiriesClient({
  inquiries = [],
  tab = "buyer",
  productId = null,
  productName = "",
  counts = { buyer: 0, supplier: 0 },
}) {
  const tabs = [
    { id: "buyer", label: "As Buyer", icon: "fa-shopping-cart", count: counts.buyer },
    { id: "supplier", label: "As Supplier", icon: "fa-store", count: counts.supplier },
  ];

  const buildHref = (targetTab) => {
    const params = new URLSearchParams();
    params.set("tab", targetTab);
    if (productId) params.set("productId", productId);
    return `/dashboard/inquiries?${params.toString()}`;
  };

  return (
    <>
      <div className="ip-page">
        {/* ============================================================
           Header
           ============================================================ */}
        <div className="ip-header">
          <div className="ip-header-left">
            <h1>
              <i className="fas fa-file-invoice"></i>
              My Inquiries
            </h1>
            <p>
              {productName
                ? `Showing inquiries for "${productName}"`
                : "Track your product inquiries and their responses"}
            </p>
          </div>

          {productId && (
            <Link href="/dashboard/inquiries" className="ip-clear-btn">
              <i className="fas fa-times"></i>
              <span>Clear Filter</span>
            </Link>
          )}
        </div>

        {/* ============================================================
           Tabs
           ============================================================ */}
        <div className="ip-tabs-wrapper">
          <div className="ip-tabs">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={buildHref(t.id)}
                className={`ip-tab ${tab === t.id ? "active" : ""}`}
              >
                <i className={`fas ${t.icon}`}></i>
                <span>{t.label}</span>
                <span className="ip-tab-count">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ============================================================
           List
           ============================================================ */}
        {inquiries.length > 0 ? (
          <div className="ip-list">
            {inquiries.map((inquiry) => (
              <InquiryListItem key={inquiry.id} inquiry={inquiry} tab={tab} />
            ))}
          </div>
        ) : (
          <div className="ip-empty">
            <i className="fas fa-inbox"></i>
            <h3>
              {tab === "buyer"
                ? "No inquiries as buyer"
                : "No inquiries as supplier"}
            </h3>
            <p>
              {tab === "buyer"
                ? "When you send a product inquiry, it will appear here."
                : "When buyers contact you about your products, they'll appear here."}
            </p>
            {tab === "buyer" && (
              <Link href="/products" className="ip-empty-btn">
                <i className="fas fa-search"></i>
                Browse Products
              </Link>
            )}
            {tab === "supplier" && (
              <Link href="/dashboard/products" className="ip-empty-btn">
                <i className="fas fa-box"></i>
                View My Products
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
         Styles
         ============================================================ */}
      <style jsx>{`
        .ip-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ============================================================
           Header
           ============================================================ */
        .ip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ip-header-left {
          min-width: 0;
        }

        .ip-header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ip-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .ip-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .ip-clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          background: white;
          border: 1px solid #e8edf0;
          color: #64748b;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
        }

        .ip-clear-btn:hover {
          border-color: #dc2626;
          color: #dc2626;
          background: #fef2f2;
        }

        /* ============================================================
           Tabs
           ============================================================ */
        .ip-tabs-wrapper {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          margin: 0 -4px;
          padding: 0 4px;
        }

        .ip-tabs-wrapper::-webkit-scrollbar {
          height: 4px;
        }

        .ip-tabs-wrapper::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        .ip-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          background: #f1f5f7;
          border-radius: 14px;
          min-width: 100%;
        }

        :global(.ip-tab) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
          flex-shrink: 0;
          text-decoration: none;
        }

        :global(.ip-tab i) {
          font-size: 12px;
        }

        :global(.ip-tab:hover) {
          color: #0b1f18;
          background: rgba(255, 255, 255, 0.6);
        }

        :global(.ip-tab.active) {
          background: white;
          color: #13795b;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
        }

        .ip-tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 20px;
          padding: 0 7px;
          background: rgba(100, 116, 139, 0.12);
          color: #64748b;
          border-radius: 50px;
          font-size: 10.5px;
          font-weight: 800;
          transition: all 0.2s ease;
        }

        :global(.ip-tab.active) .ip-tab-count {
          background: #eaf7f1;
          color: #0b5b43;
        }

        /* ============================================================
           List
           ============================================================ */
        .ip-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ============================================================
           Empty State
           ============================================================ */
        .ip-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          background: white;
          border: 1px dashed #e8edf0;
          border-radius: 18px;
          color: #94a3b8;
          gap: 10px;
        }

        .ip-empty i {
          font-size: 48px;
          opacity: 0.35;
          margin-bottom: 6px;
        }

        .ip-empty h3 {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .ip-empty p {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
          max-width: 360px;
          line-height: 1.5;
        }

        .ip-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          margin-top: 12px;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.25);
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .ip-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(19, 121, 91, 0.35);
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 900px) {
          .ip-header-left h1 {
            font-size: 20px;
          }

          .ip-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          :global(.ip-tab) {
            padding: 9px 14px;
            font-size: 12.5px;
            gap: 6px;
          }

          :global(.ip-tab i) {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .ip-page {
            gap: 16px;
          }

          .ip-header-left h1 {
            font-size: 18px;
          }

          .ip-header-left p {
            font-size: 12.5px;
          }

          .ip-clear-btn {
            padding: 8px 14px;
            font-size: 12.5px;
          }

          .ip-list {
            gap: 12px;
          }

          :global(.ip-tab) {
            padding: 8px 12px;
            font-size: 12px;
          }

          .ip-tab-count {
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            font-size: 10px;
          }

          .ip-empty {
            padding: 40px 18px;
          }

          .ip-empty i {
            font-size: 40px;
          }

          .ip-empty h3 {
            font-size: 15px;
          }

          .ip-empty p {
            font-size: 12.5px;
          }
        }
      `}</style>
    </>
  );
}