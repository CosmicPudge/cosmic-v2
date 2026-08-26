export function kioskApiUrl(path: string): string {
  if (typeof window === "undefined" || window.location.pathname !== "/os/kiosk") return path;

  const url = new URL(path, window.location.origin);
  const bootId = new URLSearchParams(window.location.search).get("cosmic-boot");
  url.searchParams.set("cosmic-kiosk", "1");
  if (bootId) url.searchParams.set("cosmic-boot", bootId);
  return `${url.pathname}${url.search}`;
}
