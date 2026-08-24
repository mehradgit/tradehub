// src/app/dashboard/requests/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RequestListItem from "@/components/dashboard/RequestListItem";

export default async function DashboardRequestsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  const requests = await prisma.buyingRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      quantity: true,
      unit: true,
      isUrgent: true,
      isVisible: true,
      deliveryCountry: true,
      createdAt: true,
      views: true,
      requestNumber:true,
      slug:true,
      _count: {
        select: {
          quotes: true,
        },
      },
    },
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">
            <i
              className="fas fa-shopping-cart me-2"
              style={{ color: "var(--primary)" }}
            ></i>
            My Buying Requests
          </h1>
          <p className="text-muted">Manage your buying requests</p>
        </div>
        <Link href="/requests/new" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>Post New Request
        </Link>
      </div>

      {requests.length > 0 ? (
        <div
          className="requests-list"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {requests.map((request) => (
            <RequestListItem key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h3>No buying requests yet</h3>
          <p className="text-muted">
            Start posting buying requests to find the best suppliers.
          </p>
          <Link href="/requests/new" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>Post Your First Request
          </Link>
        </div>
      )}
    </div>
  );
}
