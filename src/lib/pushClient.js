// src/lib/pushClient.js
"use client";

// ====== تبدیل VAPID Key ======
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ====== بررسی پشتیبانی مرورگر ======
export function isPushSupported() {
  if (typeof window === "undefined") return false;

  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// ====== وضعیت فعلی permission ======
export function getNotificationPermission() {
  if (typeof window === "undefined") return "default";
  return Notification.permission; // "default" | "granted" | "denied"
}

// ====== ثبت Service Worker ======
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" }
    );
    return registration;
  } catch (error) {
    console.error("[PushClient] SW registration failed:", error);
    return null;
  }
}

// ====== بررسی وجود subscription فعال ======
export async function getExistingSubscription() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error("[PushClient] getExistingSubscription error:", error);
    return null;
  }
}

// ====== درخواست Permission + Subscribe ======
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  // ۱. درخواست Permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      "Permission denied. Please enable notifications from browser settings."
    );
  }

  // ۲. ثبت Service Worker
  const registration = await navigator.serviceWorker.register(
    "/service-worker.js",
    { scope: "/" }
  );
  await navigator.serviceWorker.ready;

  // ۳. دریافت VAPID Public Key
  const keyRes = await fetch("/api/push/vapid-public-key");
  if (!keyRes.ok) {
    throw new Error("Failed to get VAPID public key");
  }
  const { publicKey } = await keyRes.json();

  // ۴. Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // ۵. ذخیره در سرور
  const saveRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      },
      userAgent: navigator.userAgent,
    }),
  });

  if (!saveRes.ok) {
    throw new Error("Failed to save subscription on server");
  }

  return subscription;
}

// ====== لغو Subscribe ======
export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription();

  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch (err) {
      console.error("[PushClient] unsubscribe error:", err);
    }
  }

  // حذف از سرور
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription?.endpoint }),
  });

  return true;
}

// ====== helper ======
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}