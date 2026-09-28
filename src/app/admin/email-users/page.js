// src/app/admin/email-users/page.js
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function EmailUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // فرم ساخت کاربر
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // مودال تغییر رمز
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ===== دریافت لیست =====
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/email-users");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else toast.error(data.message);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===== ساخت کاربر =====
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/admin/email-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`✅ ${data.email} created`);
        setEmail("");
        setPassword("");
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  // ===== تغییر رمز =====
  const openPasswordModal = (userEmail) => {
    setSelectedEmail(userEmail);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      const res = await fetch("/api/admin/email-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedEmail,
          action: "change-password",
          password: newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Password changed");
        setShowPasswordModal(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to change password");
    }
  };

  // ===== فعال/غیرفعال =====
  const toggleActive = async (userEmail, currentActive) => {
    try {
      const res = await fetch("/api/admin/email-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          action: "toggle-active",
          active: !currentActive,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  // ===== حذف کاربر =====
  const handleDelete = async (userEmail) => {
    if (!confirm(`Delete ${userEmail}?\n\nاین کار ایمیل‌ها را هم پاک می‌کند.`)) return;

    try {
      const res = await fetch(
        `/api/admin/email-users?email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (res.ok) {
        toast.success("🗑️ User deleted");
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* هدر */}
      <div className="mb-4">
        <h1 className="fw-bold mb-1">📧 Email Users</h1>
        <p className="text-muted mb-0">
          مدیریت کاربران ایمیل دامنهٔ bulkfoodtrade.ir
        </p>
      </div>

      {/* فرم ساخت کاربر */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">➕ Create New Email</h5>
          <form onSubmit={handleCreate}>
            <div className="row g-2">
              <div className="col-md-5">
                <input
                  type="email"
                  className="form-control"
                  placeholder="user@bulkfoodtrade.ir"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="col-md-2">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* جدول کاربران */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              Existing Users ({users.length})
            </h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={fetchUsers}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              هنوز کاربری ساخته نشده
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>ID</th>
                    <th>Email</th>
                    <th style={{ width: "100px" }}>Status</th>
                    <th style={{ width: "300px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        <code>{u.email}</code>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.active
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {u.active ? "✅ Active" : "⛔ Disabled"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openPasswordModal(u.email)}
                            title="Change password"
                          >
                            🔑 Password
                          </button>
                          <button
                            className={`btn btn-sm ${
                              u.active
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() =>
                              toggleActive(u.email, u.active)
                            }
                          >
                            {u.active ? "⛔ Disable" : "✅ Enable"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(u.email)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* مودال تغییر رمز */}
      {showPasswordModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowPasswordModal(false)}
          />
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    🔑 Change Password
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowPasswordModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    تغییر رمز برای:{" "}
                    <code>{selectedEmail}</code>
                  </p>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="New password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    minLength={8}
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleChangePassword}
                    disabled={newPassword.length < 8}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}