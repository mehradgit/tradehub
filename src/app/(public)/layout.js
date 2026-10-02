// src/app/(public)/layout.js
import Layout from "@/components/layout/Layout";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function PublicLayout({ children }) {
  return <Layout>{children}
  <MobileBottomNav />
  </Layout>;
}