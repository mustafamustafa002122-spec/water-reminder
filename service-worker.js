// public/service-worker.js
self.addEventListener("push", (event) => {
    event.waitUntil((async () => {
      const data = event.data ? event.data.json() : {};
      const title = data.title || "💧 Water time";
      const options = {
        body: data.body || "Take a few sips ❤️",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: data.url || "/" }
      };
      await self.registration.showNotification(title, options);
    })());
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || "/";
    event.waitUntil(clients.openWindow(url));
  });

async function enableReminders() {
    // Register SW
    const reg = await navigator.serviceWorker.register("/service-worker.js");
  
    // Ask permission (must be from a click/tap)
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Notifications not allowed");
  
    // Subscribe
    const vapidPublicKey = "YOUR_VAPID_PUBLIC_KEY_BASE64URL";
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  
    // Send subscription + settings to your backend
    await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub,
        everyMinutes: 90,
        windowStart: "09:00",
        windowEnd: "23:00",
        tz: "Europe/Istanbul"
      })
    });
  }