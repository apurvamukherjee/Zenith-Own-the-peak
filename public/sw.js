// Exists only so Android Chrome can show notifications — it rejects
// `new Notification()` and requires ServiceWorkerRegistration.showNotification().
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) =>
    cs.length ? cs[0].focus() : self.clients.openWindow("/")));
});
