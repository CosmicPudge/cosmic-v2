export function isPersonalOsUiRoute(pathname: string) {
  return (pathname === "/os" || pathname.startsWith("/os/"))
    && pathname !== "/os/kiosk"
    && !pathname.startsWith("/os/kiosk/");
}
