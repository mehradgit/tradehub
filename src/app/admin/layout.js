"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import "./admin.css";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-app">
      {/* Overlay برای بستن سایدبار با کلیک بیرون */}
      {isSidebarOpen && (
        <div className="admin-overlay" onClick={closeSidebar}></div>
      )}

      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <main className="admin-main">
        <AdminTopbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        {children}
      </main>
    </div>
  );
}