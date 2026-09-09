export function resolveKioskIdleTimeout(configuredTimeout: number, requestedTimeout: number | null, development: boolean) {
  if (!development) return configuredTimeout;
  return requestedTimeout !== null && Number.isFinite(requestedTimeout) && requestedTimeout >= 250
    ? requestedTimeout
    : configuredTimeout;
}

export function shouldWakeDesktopKiosk(active: boolean, isExitControl: boolean, entry: "manual" | "idle" = "idle") {
  return active && entry === "idle" && !isExitControl;
}
