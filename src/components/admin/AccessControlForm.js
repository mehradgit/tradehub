// src/components/admin/AccessControlForm.js
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "🌍 Everyone (Public)" },
  { value: "loggedIn", label: "🔐 Logged-in Users" },
  { value: "paidPlans", label: "💎 Paid Plans Only" },
];

export default function AccessControlForm() {
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings/access-control").then((res) => res.json()),
      fetch("/api/admin/plans")
        .then((res) => res.json())
        .catch(() => []),
    ])
      .then(([settingsData, plansData]) => {
        setSettings(settingsData);
        const planNames = Array.isArray(plansData)
          ? plansData.map((p) => p.name)
          : ["Basic", "Bronze", "Silver", "Gold"];
        setPlans(planNames);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (path, value) => {
    setSettings((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/access-control", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <p>Loading...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ============ REQUEST PAGE ============ */}
      <SectionCard
        title="Buying Request Page"
        subtitle="Control what visitors can see on a buying request detail page"
      >
        {/* Buyer Info (Reveal + Submit Quote) */}
        <AccessBlock
          label="Buyer Info & Submit Quote"
          description="Revealing buyer info also unlocks submitting a quote. Consumes one quota unit per request."
          section={settings.request.buyerInfo}
          plans={plans}
          onChange={(key, value) =>
            updateField(`request.buyerInfo.${key}`, value)
          }
          showQuotaFields={true}
        />

        {/* Contact Info (بدون سهمیه) */}
        <AccessBlock
          label="Contact Info (Email, Phone, Profile Link)"
          description="Detailed contact info, free after buyer info is revealed"
          section={settings.request.contactInfo}
          plans={plans}
          onChange={(key, value) =>
            updateField(`request.contactInfo.${key}`, value)
          }
          showQuotaFields={false}
        />
      </SectionCard>

      {/* ============ PRODUCT PAGE ============ */}
      <SectionCard
        title="Product Page"
        subtitle="Control supplier info and send request form on product pages"
      >
        {/* ✅ Supplier Info (شامل Reveal + Send Request) */}
        <AccessBlock
          label="Supplier Info & Send Request"
          description="Revealing supplier info also unlocks the send request form. Consumes one inquiry quota per product."
          section={settings.product.supplierInfo}
          plans={plans}
          onChange={(key, value) =>
            updateField(`product.supplierInfo.${key}`, value)
          }
          showQuotaFields={true}
        />
      </SectionCard>
      
      {/* ============ PROFILE PAGE ============ */}
      <SectionCard
        title="Profile Page"
        subtitle="Control what visitors can see on a public profile page"
      >
        <AccessBlock
          label="Contact Info (Email, Phone, Address, Website)"
          description="Detailed contact information (consumes quota per view)"
          section={settings.profile.contactInfo}
          plans={plans}
          onChange={(key, value) =>
            updateField(`profile.contactInfo.${key}`, value)
          }
          showQuotaFields={true}
        />
      </SectionCard>

      {/* ============ PROFILES LIST ============ */}
      <SectionCard
        title="Profiles List (/profiles)"
        subtitle="Control the profiles directory page"
      >
        <ToggleRow
          label="Requires Login"
          checked={settings.profilesList.requiresLogin}
          onChange={(v) => updateField("profilesList.requiresLogin", v)}
        />
        <ToggleRow
          label="Show Contact Info in List"
          description="Not recommended: users can bypass quota by searching the list"
          checked={settings.profilesList.showContactInfo}
          onChange={(v) => updateField("profilesList.showContactInfo", v)}
        />
      </SectionCard>

      {/* ============ SAVE BAR ============ */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          padding: 20,
          background: "white",
          borderRadius: 16,
          border: "1px solid #e2e9e5",
          position: "sticky",
          bottom: 20,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <button
          type="button"
          onClick={() => window.location.reload()}
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "1px solid #e2e9e5",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 32px",
            background: "linear-gradient(135deg, #13795b, #1d9a71)",
            border: "none",
            borderRadius: 10,
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            boxShadow: "0 6px 16px rgba(19,121,91,0.25)",
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ====== Section Card ======
function SectionCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #e2e9e5",
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            font: "800 16px 'Manrope', sans-serif",
            color: "#13251f",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: 12, color: "#71807b", marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

// ====== Access Block ======
function AccessBlock({
  label,
  description,
  section,
  plans,
  onChange,
  showQuotaFields = false, // ✅ پیش‌فرض false
}) {
  return (
    <div
      style={{
        padding: 16,
        background: "#f9fbfa",
        borderRadius: 12,
        border: "1px solid #eef2f0",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#13251f" }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 11, color: "#71807b", marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>

      {/* Visibility */}
      <FieldRow label="Who can view?">
        <select
          value={section.visibility}
          onChange={(e) => onChange("visibility", e.target.value)}
          style={selectStyle}
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldRow>

      {/* Allowed Plans */}
      {section.visibility === "paidPlans" && (
        <FieldRow label="Which plans can view?">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {plans.map((p) => {
              const isSelected = section.allowedPlans?.includes(p);
              return (
                <label
                  key={p}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 50,
                    border: `1px solid ${isSelected ? "#13795b" : "#e2e9e5"}`,
                    background: isSelected ? "#eaf7f1" : "white",
                    color: isSelected ? "#0b5b43" : "#33413d",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newPlans = e.target.checked
                        ? [...(section.allowedPlans || []), p]
                        : (section.allowedPlans || []).filter((x) => x !== p);
                      onChange("allowedPlans", newPlans);
                    }}
                    style={{ display: "none" }}
                  />
                  {p}
                </label>
              );
            })}
          </div>
        </FieldRow>
      )}

      {/* ✅ فیلدهای Quota فقط اگر showQuotaFields = true باشد */}
      {showQuotaFields && (
        <>
          <ToggleRow
            label="Consume quota on reveal"
            description="Each view reduces the monthly quota"
            checked={section.consumeQuotaOnReveal}
            onChange={(v) => onChange("consumeQuotaOnReveal", v)}
          />
          {section.consumeQuotaOnReveal && (
            <FieldRow label="Quota type">
              <select
                value={section.quotaType || "inquiry"}
                onChange={(e) => onChange("quotaType", e.target.value)}
                style={selectStyle}
              >
                <option value="inquiry">Inquiry (استعلام)</option>
                <option value="quote">Quote (پیشنهاد)</option>
                <option value="request">Request (درخواست)</option>
              </select>
            </FieldRow>
          )}
        </>
      )}

      <ToggleRow
        label="Free for content owner"
        description="Owner can always view without consuming quota"
        checked={section.freeForOwner}
        onChange={(v) => onChange("freeForOwner", v)}
      />
      <ToggleRow
        label="Free for admin"
        description="Admin can always view without consuming quota"
        checked={section.freeForAdmin}
        onChange={(v) => onChange("freeForAdmin", v)}
      />
    </div>
  );
}

// ====== Field Row ======
function FieldRow({ label, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 16,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <label style={{ fontSize: 12, fontWeight: 600, color: "#33413d" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ====== Toggle Row ======
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderTop: "1px dashed #eef2f0",
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#33413d" }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 11, color: "#71807b", marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 50,
          background: checked ? "#13795b" : "#cbd5d1",
          border: "none",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        />
      </button>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e2e9e5",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  background: "white",
};
