// src/app/dashboard/settings/page.js
import PushNotificationToggle from "@/components/dashboard/PushNotificationToggle";

export const metadata = { title: "Settings | Dashboard" };

export default function SettingsPage() {
  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-0">
          <i
            className="fas fa-gear me-2"
            style={{ color: "var(--primary)" }}
          ></i>
          Settings
        </h1>
        <p className="text-muted">Manage your account preferences</p>
      </div>

      <div style={{ maxWidth: 800 }}>
        <div className="card shadow-sm border-0 p-4 mb-4">
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--black)",
              marginBottom: 16,
            }}
          >
            Notifications
          </h3>

          <PushNotificationToggle />
        </div>
      </div>
    </div>
  );
}