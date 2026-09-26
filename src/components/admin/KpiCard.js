"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function KpiCard({ id, icon, iconClass, label, value, change, data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: data.map((_, i) => i),
        datasets: [
          {
            data,
            borderColor: "#15966f",
            backgroundColor: "rgba(20,150,111,.07)",
            fill: true,
            tension: 0.45,
            borderWidth: 1.8,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });

    return () => chart.destroy();
  }, [data]);

  return (
    <div className="admin-kpi">
      <div className={`admin-kpi-icon ${iconClass}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <h4>{label}</h4>
      <strong>{value}</strong>
      <span className="change">↑ {change}</span>
      <small>vs. last week</small>
      <canvas ref={canvasRef} className="mini"></canvas>
    </div>
  );
}