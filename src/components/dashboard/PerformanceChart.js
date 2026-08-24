// src/components/dashboard/PerformanceChart.js
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

export default function PerformanceChart({ viewsData, inquiriesData }) {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Product Views",
        data: viewsData || [450, 590, 520, 730, 680, 910, 1240],
        borderColor: "#e85d3a",
        backgroundColor: "rgba(232, 93, 58, 0.08)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 3,
        pointBackgroundColor: "#e85d3a",
      },
      {
        label: "Inquiries",
        data: inquiriesData || [6, 9, 8, 13, 11, 15, 18],
        borderColor: "#f4b942",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#f4b942",
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
        position: "bottom",
        labels: { usePointStyle: true, padding: 20 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f0f2f1" },
      },
      y1: {
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <Line data={data} options={options} />
    </div>
  );
}