"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function GrowthChart() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Users",
            data: [1200, 1550, 2040, 2390, 3160, 4420],
            borderColor: "#0b8a63",
            backgroundColor: "rgba(11,138,99,.08)",
            fill: true,
            tension: 0.38,
            borderWidth: 2,
            pointRadius: 2.5,
            pointBackgroundColor: "#0b8a63",
          },
          {
            label: "Products",
            data: [700, 1120, 1450, 1640, 2210, 3480],
            borderColor: "#4388e9",
            backgroundColor: "rgba(67,136,233,.05)",
            fill: true,
            tension: 0.38,
            borderWidth: 2,
            pointRadius: 2.5,
            pointBackgroundColor: "#4388e9",
          },
          {
            label: "Inquiries",
            data: [430, 760, 1010, 1120, 1450, 2380],
            borderColor: "#8b55e7",
            backgroundColor: "rgba(139,85,231,.04)",
            fill: true,
            tension: 0.38,
            borderWidth: 2,
            pointRadius: 2.5,
            pointBackgroundColor: "#8b55e7",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 6,
              padding: 12,
              font: { size: 8 },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#edf1ef" },
            ticks: {
              color: "#87948f",
              font: { size: 7 },
              callback: (v) => (v >= 1000 ? v / 1000 + "K" : v),
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#87948f", font: { size: 7 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, []);

  return (
    <div className="admin-chart">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}