// src/components/dashboard/NotificationListener.js
"use client";

import { useEffect } from "react";

export default function NotificationListener() {
  useEffect(() => {
    let lastKnownCount = 0;

    const checkForUpdates = async () => {
      try {
        const res = await fetch("/api/user/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          const newCount = data.unreadCount || 0;

          if (newCount !== lastKnownCount) {
            lastKnownCount = newCount;
            window.dispatchEvent(new Event("notifications-updated"));
          }
        }
      } catch (err) {
        // silent
      }
    };

    checkForUpdates();
    const interval = setInterval(checkForUpdates, 60000); // هر 60 ثانیه

    return () => clearInterval(interval);
  }, []);

  return null;
}