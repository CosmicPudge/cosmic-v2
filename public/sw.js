const FALLBACK_ROUTE = "/sports";

function safeRoute(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) return FALLBACK_ROUTE;
  let route;
  try { route = decodeURIComponent(value); } catch { return FALLBACK_ROUTE; }
  if (!route.startsWith("/") || route.startsWith("//") || route.includes("\\") || /^(?:https?:|javascript:|data:|blob:)/i.test(route)) return FALLBACK_ROUTE;
  return route === "/sports" || route.startsWith("/sports/event/") ? route : FALLBACK_ROUTE;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload;
  try { payload = event.data ? event.data.json() : {}; } catch { return; }
  if (!payload || typeof payload !== "object" || typeof payload.title !== "string" || typeof payload.body !== "string") return;
  const route = safeRoute(payload.route);
  const tag = typeof payload.tag === "string" && payload.tag.length <= 200 ? payload.tag : typeof payload.signalId === "string" ? payload.signalId : "cosmic-sports";
  event.waitUntil(self.registration.showNotification(payload.title.slice(0, 120), {
    body: payload.body.slice(0, 500),
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag,
    renotify: false,
    data: { route },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = safeRoute(event.notification?.data?.route);
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const sameOrigin = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (sameOrigin && "focus" in sameOrigin) return sameOrigin.focus().then(() => sameOrigin.navigate(route));
    return self.clients.openWindow(route);
  }));
});
