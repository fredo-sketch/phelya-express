/* Service worker Phelya Express: menerima Web Push dan membuka halaman terkait saat notifikasi diklik. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { title: "Phelya Express", body: event.data ? event.data.text() : "" };
  }
  const judul = d.title || "Phelya Express";
  event.waitUntil(
    self.registration.showNotification(judul, {
      body: d.body || "",
      tag: d.tag || undefined,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: typeof d.url === "string" && d.url.startsWith("/") ? d.url : "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === url && "focus" in c) return c.focus();
      }
      for (const c of list) {
        if ("navigate" in c && "focus" in c) return c.navigate(url).then((x) => x && x.focus());
      }
      return self.clients.openWindow(url);
    }),
  );
});
