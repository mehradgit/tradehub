// src/components/home/CtaSection.js
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="cta">
      <h2>Start Trading Globally Today</h2>
      <p>
        Join thousands of food suppliers, manufacturers, exporters and buyers.
        Create your business profile and discover new international opportunities.
      </p>
      <Link href="/register" className="btn px-4">
        Create Free Account
        <i className="fa-solid fa-arrow-right ps-2"></i>
      </Link>
    </section>
  );
}