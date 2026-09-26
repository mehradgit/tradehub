// src/app/admin/requests/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import RequestApprovalButtons from "@/components/admin/RequestApprovalButtons";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const request = await prisma.buyingRequest.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: request ? `${request.title} | Admin` : "Request Not Found",
  };
}

export default async function AdminRequestDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { id } = await params;

  const request = await prisma.buyingRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          country: true,
          countryCode: true,
          phone: true,
          website: true,
          profileNumber: true,
          slug: true,
        },
      },
      _count: {
        select: { quotes: true },
      },
    },
  });

  if (!request) notFound();

  // Parse attachments
  let attachments = [];
  if (request.attachments) {
    if (Array.isArray(request.attachments)) {
      attachments = request.attachments;
    } else if (typeof request.attachments === "string") {
      try {
        attachments = JSON.parse(request.attachments);
      } catch {
        attachments = [];
      }
    }
  }

  const getStatusInfo = () => {
    if (request.status === "PENDING") {
      return {
        label: "Pending Review",
        icon: "fa-clock",
        bg: "#fff7e6",
        color: "#b45309",
        border: "#fde68a",
      };
    }
    if (request.status === "REJECTED") {
      return {
        label: "Rejected",
        icon: "fa-times-circle",
        bg: "#fef2f2",
        color: "#b91c1c",
        border: "#fecaca",
      };
    }
    if (request.status === "APPROVED") {
      if (!request.isVisible)
        return {
          label: "Hidden",
          icon: "fa-eye-slash",
          bg: "#f1f5f9",
          color: "#475569",
          border: "#cbd5e1",
        };
      return {
        label: "Approved",
        icon: "fa-check-circle",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
      };
    }
    return {
      label: "Active",
      icon: "fa-check-circle",
      bg: "#ecfdf5",
      color: "#047857",
      border: "#a7f3d0",
    };
  };

  const status = getStatusInfo();
  const buyerName =
    request.user.companyName || request.user.name || "Anonymous Buyer";

  const Section = ({ title, icon, children }) => (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div className="admin-card-head">
        <div className="admin-title">
          <i
            className={`fa-solid ${icon}`}
            style={{ color: "var(--green2)", marginRight: 8 }}
          ></i>
          {title}
        </div>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, fullWidth = false }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "var(--muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "var(--text)",
          fontWeight: 500,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );

  const FieldGrid = ({ children, cols = 3 }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 20,
      }}
    >
      {children}
    </div>
  );

  return (
    <>
      {/* Back Link */}
      <Link
        href="/admin/requests"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--green2)",
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        <i className="fa-solid fa-arrow-left"></i> Back to Requests
      </Link>

      {/* Header */}
      <div
        className="admin-card"
        style={{
          padding: 24,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1
            style={{
              font: "800 20px Manrope",
              color: "var(--dark)",
              margin: 0,
            }}
          >
            {request.title}
          </h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>
            #{request.requestNumber} · {request.category}
            {request.subCategory && ` · ${request.subCategory}`}
          </p>
          <div
            style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 50,
                background: status.bg,
                color: status.color,
                border: `1px solid ${status.border}`,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <i className={`fas ${status.icon}`} style={{ fontSize: 11 }}></i>
              {status.label}
            </span>

            {request.isUrgent && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 50,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <i
                  className="fas fa-exclamation-circle"
                  style={{ fontSize: 10 }}
                ></i>
                Urgent
              </span>
            )}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 50,
                background: "var(--bg)",
                color: "var(--muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <i className="fas fa-eye" style={{ fontSize: 10 }}></i>
              {request.views || 0} views
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 50,
                background: "var(--bg)",
                color: "var(--muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <i className="fas fa-file-signature" style={{ fontSize: 10 }}></i>
              {request._count.quotes} quotes
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={`/requests/${request.requestNumber}/${request.slug}`}
            target="_blank"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--line)",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="fa-solid fa-external-link-alt"></i> Public Page
          </Link>
          <RequestApprovalButtons request={request} />
        </div>
      </div>

      {/* Rejection Note */}
      {request.status === "REJECTED" && request.rejectionNote && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <i
            className="fa-solid fa-exclamation-triangle"
            style={{ color: "#dc2626", fontSize: 18, marginTop: 2 }}
          ></i>
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#991b1b",
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              Rejection Reason
            </div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>
              {request.rejectionNote}
            </div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Section title="Attachments" icon="fa-paperclip">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {attachments.map((img, i) => (
              <a
                key={i}
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  display: "block",
                }}
              >
                <img
                  src={img}
                  alt={`Attachment ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Request Details */}
      <Section title="Request Details" icon="fa-info-circle">
        <FieldGrid cols={2}>
          <Field label="Title" value={request.title} />
          <Field label="Category" value={request.category} />
          <Field label="Sub-Category" value={request.subCategory} />
          <Field
            label="Posted"
            value={new Date(request.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </FieldGrid>

        <div style={{ marginTop: 20 }}>
          <Field label="Description" value={request.description} fullWidth />
        </div>
      </Section>

      {/* Quantity & Budget */}
      <Section title="Quantity & Budget" icon="fa-tag">
        <FieldGrid cols={4}>
          <Field
            label="Quantity"
            value={`${request.quantity} ${request.unit}`}
          />
          <Field
            label="Budget Range"
            value={request.budgetRange || "Negotiable"}
          />
          <Field label="Currency" value={request.currency} />
          <Field
            label="Deadline"
            value={
              request.deadline
                ? new Date(request.deadline).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Flexible"
            }
          />
        </FieldGrid>
      </Section>

      {/* Shipping & Requirements */}
      <Section title="Pricing & Requirements" icon="fa-tag">
        <FieldGrid cols={3}>
          <Field label="Budget Range" value={request.budgetRange} />
          <Field
            label="Target Price"
            value={
              request.isPriceNegotiable
                ? "Negotiable"
                : request.targetPrice
                  ? `$${request.targetPrice} / ${request.unit}`
                  : null
            }
          />
          <Field label="Payment Terms" value={request.paymentTerms} />
        </FieldGrid>

        <div style={{ marginTop: 20 }}>
          <FieldGrid cols={2}>
            <Field
              label="Suppliers From"
              value={
                Array.isArray(request.supplierCountries) &&
                request.supplierCountries.length > 0
                  ? request.supplierCountries.includes("WORLDWIDE")
                    ? "Worldwide"
                    : request.supplierCountries.join(", ")
                  : "Worldwide"
              }
            />
            <Field label="Certifications" value={request.certifications} />
          </FieldGrid>
        </div>
      </Section>
      {/* Buyer Information */}
      <Section title="Buyer Information" icon="fa-user-tie">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--green2), var(--green))",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {buyerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, color: "var(--dark)" }}
            >
              {buyerName}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {request.user.email}
            </div>
          </div>
          <Link
            href={`/admin/users/${request.user.id}`}
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              background: "var(--bg)",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--green2)",
              textDecoration: "none",
            }}
          >
            View Profile <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <FieldGrid cols={3}>
          <Field
            label="Country"
            value={
              request.user.countryCode ? (
                <span>
                  <img
                    src={`https://flagcdn.com/w20/${request.user.countryCode.toLowerCase()}.png`}
                    style={{
                      width: 16,
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  {request.user.country}
                </span>
              ) : (
                request.user.country
              )
            }
          />
          <Field label="Phone" value={request.user.phone} />
          <Field label="Website" value={request.user.website} />
        </FieldGrid>
      </Section>

      {/* Metadata */}
      <Section title="Metadata" icon="fa-info">
        <FieldGrid cols={3}>
          <Field
            label="Created"
            value={new Date(request.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Field
            label="Last Updated"
            value={new Date(request.updatedAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Field
            label="Visibility"
            value={request.isVisible ? "Visible to public" : "Hidden"}
          />
        </FieldGrid>
      </Section>
    </>
  );
}
