export type KioskDiagnosticsRenderState = "normal" | "establishing-session" | "diagnostics";

export function isKioskDiagnosticsRequested(searchParams: Pick<URLSearchParams, "get">, hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase().split(":")[0];
  const allowedHost = normalizedHost === "dev.cosmicpudge.shop" || normalizedHost === "localhost" || normalizedHost === "127.0.0.1";
  return allowedHost && searchParams.get("diagnostics") === "1";
}

export function kioskDiagnosticsRenderState(requested: boolean, runtimeReady: boolean): KioskDiagnosticsRenderState {
  if (!requested) return "normal";
  return runtimeReady ? "diagnostics" : "establishing-session";
}
