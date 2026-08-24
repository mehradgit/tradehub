// src/app/dashboard/layout.js
"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      
      {/* Overlay برای بستن سایدبار با کلیک بیرون */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 999,
            display: "block",
          }}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <main className="main">
        <Topbar onMenuToggle={toggleSidebar} />
        <section className="content">{children}</section>
      </main>
    </div>
  );
}