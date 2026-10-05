// src/components/admin/ManualPaymentForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

export default function ManualPaymentForm({ plans }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    planId: plans[0]?.id || "",
    duration: plans[0]?.prices?.[0]?.duration || 180,
    amount: plans[0]?.prices?.[0]?.price || 0,
    status: "paid",
    method: "manual",
    description: "",
  });

  // ====== User search ======
  const searchUsers = async () => {
    if (!userSearch.trim() || userSearch.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(userSearch)}`
      );
      if (res.ok) {
        const data = await res.json();
        setUserResults(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUserResults([]);
    setUserSearch("");
  };

  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    const firstPrice = plan?.prices?.[0];
    setFormData((prev) => ({
      ...prev,
      planId,
      duration: firstPrice?.duration || 180,
      amount: firstPrice?.price || 0,
    }));
  };

  const handleDurationChange = (duration) => {
    const plan = plans.find((p) => p.id === formData.planId);
    const price = plan?.prices?.find((p) => p.duration === Number(duration));
    setFormData((prev) => ({
      ...prev,
      duration: Number(duration),
      amount: price?.price || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    if (!formData.planId || !formData.duration || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          planId: formData.planId,
          duration: formData.duration,
          amount: formData.amount,
          status: formData.status,
          method: formData.method,
          description:
            formData.description ||
            `Manual payment for ${selectedUser.companyName || selectedUser.name}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success("Payment created successfully");
      router.push(`/admin/payments/${data.payment.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === formData.planId);

  return (
    <div className="admin-card" style={{ padding: 28, maxWidth: 720 }}>
      <form onSubmit={handleSubmit}>
        {/* User Selection */}
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: "#13251f",
              margin: "0 0 14px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-user"
              style={{ color: "var(--green2)" }}
            ></i>
            Select User <span style={{ color: "#dc2626" }}>*</span>
          </h3>

          {selectedUser ? (
            <div
              style={{
                padding: 16,
                background: "linear-gradient(135deg, #eaf7f1, #d1ede0)",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0b1f18",
                  }}
                >
                  {selectedUser.companyName || selectedUser.name}
                </div>
                <div
                  style={{ fontSize: 11.5, color: "#047857", marginTop: 2 }}
                >
                  {selectedUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: "6px 14px",
                  background: "white",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchUsers();
                    }
                  }}
                  placeholder="Search by email, name, or company..."
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={searchUsers}
                  disabled={searching}
                  style={{
                    padding: "12px 20px",
                    background: "var(--green2)",
                    color: "white",
                    border: 0,
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: searching ? "not-allowed" : "pointer",
                    opacity: searching ? 0.7 : 1,
                  }}
                >
                  {searching ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {userResults.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    background: "white",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {userResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      style={{
                        padding: 12,
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f7",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f9fbfa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "white")
                      }
                    >
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#13251f",
                        }}
                      >
                        {user.companyName || user.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--muted)" }}
                      >
                        {user.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Plan & Duration */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <Label>Plan *</Label>
            <select
              value={formData.planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              style={selectStyle}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Duration *</Label>
            <select
              value={formData.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              style={selectStyle}
            >
              {selectedPlan?.prices?.map((price) => (
                <option key={price.duration} value={price.duration}>
                  {price.duration} days (${price.price})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 24 }}>
          <Label>Amount (USD) *</Label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
            }
            style={inputStyle}
            required
          />
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              marginTop: 6,
            }}
          >
            <i className="fa-solid fa-info-circle me-1"></i>
            You can override the default amount for custom pricing.
          </div>
        </div>

        {/* Status & Method */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <Label>Status *</Label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              style={selectStyle}
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <Label>Payment Method</Label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, method: e.target.value }))
              }
              style={selectStyle}
            >
              <option value="manual">Manual / Offline</option>
              <option value="gateway">Online Gateway</option>
              <option value="coupon_free">Free</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <Label>Description / Note</Label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={3}
            placeholder="Optional note about this payment..."
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            paddingTop: 20,
            borderTop: "1px solid var(--line)",
          }}
        >
          <Link
            href="/admin/payments"
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !selectedUser}
            style={{
              padding: "12px 28px",
              background:
                "linear-gradient(135deg, var(--green2), var(--green))",
              border: 0,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "white",
              cursor:
                loading || !selectedUser ? "not-allowed" : "pointer",
              opacity: loading || !selectedUser ? 0.6 : 1,
              boxShadow: "0 6px 16px rgba(19,121,91,0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Creating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                Create Payment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Label({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--dark)",
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  background: "white",
  color: "var(--text)",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};