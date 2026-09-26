// src/components/dashboard/AnalyticsChart.js
"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsChart({ labels, viewsData, inquiriesData }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Product Views",
        data: viewsData,
        borderColor: "#0f9e6e",
        backgroundColor: "rgba(15, 158, 110, 0.08)",
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#0f9e6e",
        pointHoverBorderColor: "white",
        pointHoverBorderWidth: 2,
      },
      {
        label: "Inquiries",
        data: inquiriesData,
        borderColor: "#f5b544",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 2.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#f5b544",
        pointHoverBorderColor: "white",
        pointHoverBorderWidth: 2,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
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
          boxWidth: 8,
          padding: 16,
          font: { family: "Inter", size: 12, weight: "600" },
          color: "#64748b",
        },
      },
      tooltip: {
        backgroundColor: "#0b1f18",
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: "Inter", size: 12, weight: "700" },
        bodyFont: { family: "Inter", size: 12 },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f7", drawBorder: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
        border: { display: false },
      },
      y1: {
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ height: 320, position: "relative" }}>
      <Line data={data} options={options} />
    </div>
  );
}