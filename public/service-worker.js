// public/service-worker.js
// ====== Service Worker for Web Push Notifications ======

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ====== دریافت Push از سرور ======
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("[SW] Push received but no data");
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    data = {
      title: "New Notification",
      body: event.data.text(),
    };
  }

  const title = data.title || "FoodHub";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      url: data.url || "/dashboard/notifications",
      notificationId: data.notificationId || null,
    },
    tag: data.tag || "foodhub-notification",
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ====== کلیک روی نوتیفیکیشن ======
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // اگر تب باز از سایت هست، همان را focus کن
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // در غیر این صورت، تب جدید باز کن
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});