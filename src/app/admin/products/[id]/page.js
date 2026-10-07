// src/app/admin/products/[id]/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductApprovalButtons from "@/components/admin/ProductApprovalButtons";
import { getProductAttributes } from "@/lib/attributesService";
import SafeImage from "@/components/ui/SafeImage";

// ============================================================
// Dynamic specifications (EAV) — formatting for display
//
// getProductAttributes() returns the following for each attribute:
//   { attributeId, key, label, dataType, unit, options, values, value }
// An empty value → null (meaning that row is not rendered)
// ============================================================
function formatAttributeLabel(attr) {
  const base = attr?.label || attr?.key;
  if (!base) return null;
  // The measurement unit goes in parentheses next to the label
  return attr?.unit ? `${base} (${attr.unit})` : String(base);
}

function formatAttributeValue(attr) {
  if (!attr) return null;

  const rawList =
    Array.isArray(attr.values) && attr.values.length > 0
      ? attr.values
      : Array.isArray(attr.value)
        ? attr.value
        : attr.value === null || attr.value === undefined
          ? []
          : [attr.value];

  // Empty rows ("" / null / undefined / []) are not displayed
  const list = rawList.filter(
    (v) =>
      v !== null &&
      v !== undefined &&
      !(typeof v === "string" && v.trim() === "") &&
      !(Array.isArray(v) && v.length === 0),
  );

  if (list.length === 0) return null;

  const unit = attr.unit ? ` ${attr.unit}` : "";

  // boolean → Yes / No
  if (attr.dataType === "boolean" || typeof list[0] === "boolean") {
    const truthy =
      list[0] === true ||
      list[0] === "true" ||
      list[0] === 1 ||
      list[0] === "1";
    return truthy ? "Yes" : "No";
  }

  // number → number (together with the unit, if any)
  if (attr.dataType === "number") {
    const nums = list.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    if (nums.length === 0) return null;
    return `${nums.join(", ")}${unit}`;
  }

  // text | select | multiSelect → strings joined together with ", "
  const parts = list.map((v) => String(v).trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: product ? `${product.name} | Admin` : "Product Not Found",
  };
}

export default async function AdminProductDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const { id } = await params;

  const product = await prisma.product.findUnique({
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
        select: { inquiries: true },
      },
    },
  });

  if (!product) notFound();

  // Parse images
  const images = Array.isArray(product.images) ? product.images : [];

  // ====== Dynamic specifications (EAV) ======
  // If the attribute table/service is unavailable, the admin page must not break.
  let attributes = [];
  try {
    attributes = await getProductAttributes(product.id);
  } catch (err) {
    console.error("[admin-product] getProductAttributes failed:", err);
    attributes = [];
  }

  // Only rows that have both a displayable label and a displayable value
  const attributeRows = attributes
    .map((attr) => ({
      id: attr?.attributeId || attr?.key,
      label: formatAttributeLabel(attr),
      value: formatAttributeValue(attr),
    }))
    .filter((row) => row.label && row.value !== null);

  // Status info
  const getStatusInfo = () => {
    if (product.status === "PENDING") {
      return { label: "Pending Review", icon: "fa-clock", bg: "#fff7e6", color: "#b45309", border: "#fde68a" };
    }
    if (product.status === "REJECTED") {
      return { label: "Rejected", icon: "fa-times-circle", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    }
    if (product.status === "APPROVED") {
      if (!product.isVisible) return { label: "Hidden", icon: "fa-eye-slash", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
      return { label: "Approved", icon: "fa-check-circle", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    }
    return { label: "Active", icon: "fa-check-circle", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  };

  const status = getStatusInfo();

  // Helper to render a section
  const Section = ({ title, icon, children }) => (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div className="admin-card-head">
        <div className="admin-title">
          <i className={`fa-solid ${icon}`} style={{ color: "var(--green2)", marginRight: 8 }}></i>
          {title}
        </div>
      </div>
      {children}
    </div>
  );

  // Helper for field row
  const Field = ({ label, value, fullWidth = false }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, wordBreak: "break-word" }}>
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
        href="/admin/products"
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
        <i className="fa-solid fa-arrow-left"></i> Back to Products
      </Link>

      {/* Header with status and actions */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 280 }}>
          {images.map((img, i) => (
            <a key={i} href={img} target="_blank" rel="noopener noreferrer" style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              objectFit: "cover",
              border: "1px solid var(--line)",
            }}>
              <SafeImage
                src={img}
                alt={`${product.name} ${i + 1}`}
                fallbackType="product"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </a>
          ))}
          <div>
            <h1 style={{ font: "800 20px Manrope", color: "var(--dark)", margin: 0 }}>
              {product.name}
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>
              #{product.productNumber} · {product.category}
              {product.subCategory && ` · ${product.subCategory}`}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
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
                {product.views || 0} views
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
                <i className="fas fa-envelope" style={{ fontSize: 10 }}></i>
                {product._count.inquiries} inquiries
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={`/products/${product.productNumber}/${product.slug}`}
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
          <ProductApprovalButtons product={product} />
        </div>
      </div >

      {/* Rejection Note */}
      {
        product.status === "REJECTED" && product.rejectionNote && (
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
            <i className="fa-solid fa-exclamation-triangle" style={{ color: "#dc2626", fontSize: 18, marginTop: 2 }}></i>
            <div>
              <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 13, marginBottom: 4 }}>
                Rejection Reason
              </div>
              <div style={{ fontSize: 13, color: "#7f1d1d" }}>{product.rejectionNote}</div>
            </div>
          </div>
        )
      }

      {/* Images */}
      {
        images.length > 0 && (
          <Section title="Product Images" icon="fa-images">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {images.map((img, i) => (
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
                    alt={`${product.name} ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </a>
              ))}
            </div>
          </Section>
        )
      }

      {/* Basic Information */}
      <Section title="Basic Information" icon="fa-info-circle">
        <FieldGrid cols={2}>
          <Field label="Product Name" value={product.name} />
          <Field label="Category" value={product.category} />
          <Field label="Sub-Category" value={product.subCategory} />
          <Field label="Origin" value={product.origin} />
        </FieldGrid>

        <div style={{ marginTop: 20 }}>
          <Field
            label="Short Description"
            value={product.shortDesc}
            fullWidth
          />
        </div>
      </Section>

      {/* Full Description */}
      {
        product.fullDesc && (
          <Section title="Full Description" icon="fa-align-left">
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "var(--text)",
              }}
              dangerouslySetInnerHTML={{ __html: product.fullDesc }}
            />
          </Section>
        )
      }

      {/* Pricing & Inventory */}
      <Section title="Pricing & Inventory" icon="fa-tag">
        <FieldGrid cols={4}>
          <Field label="Price" value={`$${product.price}`} />
          <Field label="Currency" value={product.currency} />
          <Field label="Unit" value={product.unit} />
          <Field label="MOQ" value={product.moq} />
        </FieldGrid>

        <div style={{ marginTop: 20 }}>
          <FieldGrid cols={3}>
            <Field
              label="Stock"
              value={product.stock !== null ? product.stock : "Not specified"}
            />
            <Field
              label="Lead Time"
              value={product.leadTime ? `${product.leadTime} days` : null}
            />
            <Field label="Badge" value={product.badge} />
          </FieldGrid>
        </div>
      </Section>

      {/* Shipping & Additional Info */}
      <Section title="Shipping & Additional Info" icon="fa-ship">
        <FieldGrid cols={2}>
          <Field label="Shipping Terms" value={product.shippingTerms} />
          <Field label="Packaging" value={product.packaging} />
          <Field label="Certifications" value={product.certifications} />
          <Field label="Country of Origin" value={product.country} />
        </FieldGrid>
      </Section>

      {/* Technical Specifications — dynamic (EAV) */}
      {
        attributeRows.length > 0 && (
          <Section title="Specifications" icon="fa-list-alt">
            <FieldGrid cols={2}>
              {attributeRows.map((row, index) => (
                <Field
                  key={row.id || index}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </FieldGrid>
          </Section>
        )
      }

      {/* Supplier Information */}
      <Section title="Supplier Information" icon="fa-building">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            className="avatar-letter"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--green2), var(--green))",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {(product.user.companyName || product.user.name || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--dark)" }}>
              {product.user.companyName || product.user.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {product.user.email}
            </div>
          </div>
          <Link
            href={`/admin/users/${product.user.id}`}
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
              product.user.countryCode ? (
                <span>
                  <img
                    src={`https://flagcdn.com/w20/${product.user.countryCode.toLowerCase()}.png`}
                    style={{ width: 16, marginRight: 6, verticalAlign: "middle" }}
                  />
                  {product.user.country}
                </span>
              ) : (
                product.user.country
              )
            }
          />
          <Field label="Phone" value={product.user.phone} />
          <Field label="Website" value={product.user.website} />
        </FieldGrid>
      </Section>

      {/* Metadata */}
      <Section title="Metadata" icon="fa-info">
        <FieldGrid cols={3}>
          <Field
            label="Created"
            value={new Date(product.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Field
            label="Last Updated"
            value={new Date(product.updatedAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Field
            label="Visibility"
            value={product.isVisible ? "Visible to public" : "Hidden"}
          />
        </FieldGrid>
      </Section>
    </>
  );
}