"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function SettingsForm() {
  const router = useRouter();
  const [durations, setDurations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscriptionDurations) {
          setDurations(data.subscriptionDurations);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionDurations: durations }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      router.refresh();
    } else {
      toast.error(data.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="mb-4">Settings</h1>
      <div className="card p-4">
        <h5>Subscription Durations (days)</h5>
        <p className="text-muted">
          Enter durations separated by commas. Example: 180, 360
        </p>
        <input
          type="text"
          className="form-control mb-3"
          value={durations.join(", ")}
          onChange={(e) => setDurations(e.target.value.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n)))}
        />
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}