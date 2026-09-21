export function isPersonalOsUiRoute(pathname: string) {
  return (pathname === "/os" || pathname.startsWith("/os/"))
    && pathname !== "/os/kiosk"
    && !pathname.startsWith("/os/kiosk/");
}

/** Public page-only access for the browser-local School workspace. */
export function isPersonalSchoolUiRoute(pathname: string) {
  return pathname === "/school" || pathname.startsWith("/school/");
}
