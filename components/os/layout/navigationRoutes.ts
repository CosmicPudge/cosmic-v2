export function isNavigationRouteActive(pathname: string, route: string) {
  if (route === "/os") return pathname === "/os" || pathname === "/os/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function navigationModuleEnabled(appId: string, modules: Record<string, boolean>) {
  const moduleByApp: Record<string, string | undefined> = {
    sports: "sports",
    finance: "finance",
    school: "school",
    garage: "garage",
    calendar: "calendar",
    projects: "projects",
    notes: "notes",
    gmail: "mail",
    outlook: "mail",
  };
  const moduleName = moduleByApp[appId];
  return moduleName ? modules[moduleName] !== false : true;
}
