// src/components/dashboard/InvoicePrintButton.js
"use client";

export default function InvoicePrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        onClick={handlePrint}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          background: "linear-gradient(135deg, #0f9e6e, #0a7d55)",
          color: "white",
          border: "none",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 6px 16px rgba(15,158,110,0.25)",
        }}
      >
        <i className="fas fa-print"></i> Print / Save PDF
      </button>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container,
          .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            padding: 20px !important;
          }
          button {
            display: none !important;
          }
          a {
            text-decoration: none !important;
          }
        }
      `}</style>
    </>
  );
}