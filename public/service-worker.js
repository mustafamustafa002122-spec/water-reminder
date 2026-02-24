self.addEventListener("push", (event) => {
    event.waitUntil((async () => {
      const data = event.data ? event.data.json() : {};
      await self.registration.showNotification(data.title || "💧 Water time", {
        body: data.body || "Take a few sips ❤️",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: data.url || "/" }
      });
    })());
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
  });