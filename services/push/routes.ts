const FALLBACK_ROUTE = "/sports";

export function safePushRoute(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) return FALLBACK_ROUTE;
  let route: string;
  try { route = decodeURIComponent(value); } catch { return FALLBACK_ROUTE; }
  if (!route.startsWith("/") || route.startsWith("//") || route.includes("\\") || /^(?:https?:|javascript:|data:|blob:)/i.test(route)) return FALLBACK_ROUTE;
  if (route !== "/sports" && !route.startsWith("/sports/event/")) return FALLBACK_ROUTE;
  return route;
}
