"use client";

import Link from "next/link";

export default function AdminPlansTable({ plans }) {
  return (
    <div>
      <h1 className="mb-4">Manage Plans</h1>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Products</th>
            <th>Images/Product</th>
            <th>Requests/Month</th>
            <th>Price (6mo)</th>
            <th>Price (12mo)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => {
            const price6 = plan.prices.find((p) => p.duration === 180);
            const price12 = plan.prices.find((p) => p.duration === 360);
            return (
              <tr key={plan.id}>
                <td>{plan.name}</td>
                <td>{plan.maxProducts === -1 ? "∞" : plan.maxProducts}</td>
                <td>{plan.maxImagesPerProduct}</td>
                <td>{plan.maxRequestsPerMonth === -1 ? "∞" : plan.maxRequestsPerMonth}</td>
                <td>${price6 ? Number(price6.price) : "—"}</td>
                <td>${price12 ? Number(price12.price) : "—"}</td>
                <td>{plan.isActive ? "Active" : "Inactive"}</td>
                <td>
                  <Link href={`/admin/plans/${plan.id}`} className="btn btn-sm btn-primary">
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}