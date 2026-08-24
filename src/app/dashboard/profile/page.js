// src/app/dashboard/profile/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      country: true,
      countryCode: true,
      businessType: true,
      phone: true,
      bio: true,
      address: true,
      website: true,
      companyEmail: true,
      employeeCount: true,
      role: true,
      plan: true,
      createdAt: true,
      logo: true,
      coverImage: true,
    },
  });

  if (!user) redirect("/dashboard");

  const initials = (user.name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = user.role === "SUPPLIER" ? "Supplier" : "Buyer";
  const planLabel = user.plan || "FREE";
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">
            <i className="fas fa-building me-2" style={{ color: "var(--primary)" }}></i>
            Company Profile
          </h1>
          <p className="text-muted">Your public business profile</p>
        </div>
        <Link href="/dashboard/edit-profile" className="btn btn-primary btn-sm">
          <i className="fas fa-pen me-2"></i> Edit Profile
        </Link>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-4">
        <div className="row g-4">
          <div className="col-md-4 text-center">
            <div
              className="rounded-circle mx-auto mb-3"
              style={{
                width: "150px",
                height: "150px",
                background: user.logo ? `url(${user.logo})` : "var(--primary)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "3px solid var(--gray-light)",
              }}
            >
              {!user.logo && (
                <div className="d-flex align-items-center justify-content-center h-100 text-white fs-1 fw-bold">
                  {initials}
                </div>
              )}
            </div>
            <h4 className="fw-bold">{user.companyName || user.name}</h4>
            <p className="text-muted small">{roleLabel} • {planLabel} Plan</p>
            <p className="text-muted small">Member since {joinDate}</p>
          </div>
          <div className="col-md-8">
            <div className="row g-3">
              <div className="col-6">
                <div className="text-muted small fw-bold">Full Name</div>
                <div className="fw-semibold">{user.name || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Email</div>
                <div className="fw-semibold">{user.email}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Company Name</div>
                <div className="fw-semibold">{user.companyName || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Country</div>
                <div className="fw-semibold">{user.country || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Business Type</div>
                <div className="fw-semibold">{user.businessType || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Phone</div>
                <div className="fw-semibold">{user.phone || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Company Email</div>
                <div className="fw-semibold">{user.companyEmail || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Website</div>
                <div className="fw-semibold">
                  {user.website ? (
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                      {user.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </div>
              </div>
              <div className="col-12">
                <div className="text-muted small fw-bold">Address</div>
                <div className="fw-semibold">{user.address || "—"}</div>
              </div>
              <div className="col-12">
                <div className="text-muted small fw-bold">Bio</div>
                <div className="fw-semibold">{user.bio || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold">Employees</div>
                <div className="fw-semibold">{user.employeeCount || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}