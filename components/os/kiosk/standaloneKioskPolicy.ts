export function isLockedStandaloneKioskPath(pathname: string): boolean {
  return pathname === "/kiosk";
}

export function shouldExitLockedStandaloneKioskOnInteraction(
  pathname: string,
  eventType: "pointerdown" | "touchstart" | "click",
): boolean {
  void eventType;
  return !isLockedStandaloneKioskPath(pathname);
}
