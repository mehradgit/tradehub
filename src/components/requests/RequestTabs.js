// src/components/requests/RequestTabs.js
"use client";

import { useState } from "react";

export default function RequestTabs({ request }) {
  const [activeTab, setActiveTab] = useState("details");

  const tabs = [
    { id: "details", label: "Details & Requirements" },
    { id: "shipping", label: "Shipping & Logistics" },
    { id: "questions", label: "Q&A (3)" },
  ];

  return (
    <div className="request-tabs">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Details */}
      <div className={`tab-content ${activeTab === "details" ? "active" : ""}`}>
        <p><strong>Product Requirements:</strong></p>
        <ul>
          <li>100% pure raw honey, unheated, unfiltered</li>
          <li>Moisture content below 18%</li>
          <li>HMF (Hydroxymethylfurfural) level below 40 mg/kg</li>
          <li>Diastase activity above 8</li>
          <li>Glass jars with tamper-evident seals</li>
          <li>Labeling in English with product info and origin</li>
          <li>Samples required before first shipment</li>
        </ul>
        <p style={{ marginTop: "12px" }}><strong>Supplier Requirements:</strong></p>
        <ul>
          <li>Valid organic certification (USDA/EU)</li>
          <li>Export experience to UK/Europe</li>
          <li>Ability to provide lab test reports</li>
          <li>Minimum 2 years in business</li>
          <li>References from existing clients</li>
        </ul>
      </div>

      {/* Tab: Shipping */}
      <div className={`tab-content ${activeTab === "shipping" ? "active" : ""}`}>
        <p><strong>Shipping Preferences:</strong></p>
        <ul>
          <li>FOB from any major port (CIF preferred)</li>
          <li>Shipping by sea freight (20ft container)</li>
          <li>Destination: London, UK (Port of Felixstowe)</li>
          <li>Insurance required</li>
          <li>All import duties and taxes to be covered by buyer</li>
          <li>Delivery timeline: 30–45 days from order confirmation</li>
        </ul>
      </div>

      {/* Tab: Q&A */}
      <div className={`tab-content ${activeTab === "questions" ? "active" : ""}`}>
        <div style={{ marginBottom: "16px" }}>
          <p><strong>Q: Can you accept smaller trial order?</strong></p>
          <p style={{ color: "var(--gray-dark)" }}>
            A: Yes, we are open to a trial order of 200 jars initially. Please include the trial pricing in your quote.
          </p>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <p><strong>Q: Do you require the honey to be organic certified?</strong></p>
          <p style={{ color: "var(--gray-dark)" }}>
            A: Yes, we only accept USDA Organic or EU Organic certified honey. Lab reports must be provided.
          </p>
        </div>
        <div>
          <p><strong>Q: What is your preferred payment terms?</strong></p>
          <p style={{ color: "var(--gray-dark)" }}>
            A: We offer 30% deposit and 70% against shipping documents. Open to discussion for long-term contracts.
          </p>
        </div>
      </div>
    </div>
  );
}