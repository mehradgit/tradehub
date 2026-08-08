// src/components/dashboard/RecentActivity.js
"use client";

import Link from "next/link";

export default function RecentActivity({ activities }) {
  // فرمت ثابت تاریخ در سمت کلاینت
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // تعیین کلاس status
  const getStatusClass = (status) => {
    const classes = {
      completed: "completed",
      pending: "pending",
      processing: "processing",
      cancelled: "cancelled",
    };
    return classes[status] || "pending";
  };

  return (
    <div className="activity-section">
      <div className="section-header">
        <h3>
          <i className="fas fa-clock"></i> Recent Activity
        </h3>
        <Link href="/dashboard/activity">View All</Link>
      </div>
      <table className="activity-table">
        <thead>
          <tr>
            <th>Activity</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>{activity.activity}</td>
              <td suppressHydrationWarning>
                {formatDate(activity.date)}
              </td>
              <td>
                <span className={`status-badge ${getStatusClass(activity.status)}`}>
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}