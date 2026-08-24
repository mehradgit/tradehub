// src/components/dashboard/InquiryList.js
"use client";

import InquiryListItem from "./InquiryListItem";

export default function InquiryList({ inquiries, tab }) {
  return (
    <div className="inquiries-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {inquiries.map((inquiry) => (
        <InquiryListItem key={inquiry.id} inquiry={inquiry} tab={tab} />
      ))}
    </div>
  );
}