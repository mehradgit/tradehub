// src/app/admin/email-users/page.js
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function EmailUsersPage() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/email-users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/email-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success(`Email ${data.email} created!`);
      setEmail("");
      setPassword("");
      fetchUsers();
    } else {
      toast.error(data.message);
    }
  };

  const handleDelete = async (email) => {
    if (!confirm(`Delete ${email}?`)) return;

    const res = await fetch(`/api/admin/email-users?email=${email}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("Deleted!");
      fetchUsers();
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="container py-4">
      <h1>Email Users</h1>

      <form onSubmit={handleCreate} className="mb-4">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "..." : "Create"}
            </button>
          </div>
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.active ? "✅" : "❌"}</td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(u.email)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}