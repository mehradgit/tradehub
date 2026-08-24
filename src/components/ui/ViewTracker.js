// src/components/ui/ViewTracker.js
"use client";

import { useEffect, useRef } from "react";

export default function ViewTracker({ type, id }) {
  // جلوگیری از شمارش چندباره در حالت Strict Mode
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!id || trackedRef.current) return;

    const timeout = setTimeout(async () => {
      try {
        await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id }),
        });
        trackedRef.current = true;
      } catch (error) {
        // خطاها را نادیده می‌گیریم تا تجربه کاربری خراب نشود
        console.error("View tracking failed:", error);
      }
    }, 1500); // تأخیر ۱.۵ ثانیه‌ای برای اطمینان از لود کامل صفحه

    return () => clearTimeout(timeout);
  }, [type, id]);

  return null; // چیزی رندر نمی‌کند
}