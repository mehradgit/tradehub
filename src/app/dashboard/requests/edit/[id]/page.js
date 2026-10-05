// src/app/dashboard/requests/edit/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import EditRequestForm from "@/components/dashboard/EditRequestForm";

export default async function EditRequestPage({ params }) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const request = await prisma.buyingRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // Only the owner can edit
  if (request.userId !== session.user.id) {
    redirect("/dashboard/requests");
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">Edit Buying Request</h1>
          <p className="text-muted">Update your buying request information</p>
        </div>
        <a href="/dashboard/requests" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Requests
        </a>
      </div>
      <EditRequestForm request={request} />
    </div>
  );
}