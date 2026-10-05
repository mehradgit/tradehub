// src/components/ui/ViewTracker.js
"use client";

import { useEffect, useRef } from "react";

export default function ViewTracker({ type, id }) {
  // Prevent double counting in Strict Mode
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
        // Ignore errors so the user experience is not broken
        console.error("View tracking failed:", error);
      }
    }, 1500); // 1.5s delay to make sure the page has fully loaded

    return () => clearTimeout(timeout);
  }, [type, id]);

  return null; // Renders nothing
}