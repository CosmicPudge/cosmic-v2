"use client";

import { useCallback } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import DevicePairingScreen from "./DevicePairingScreen";
import KioskSlideshow from "./KioskSlideshow";
import KioskAmbientFrame from "./KioskAmbientFrame";
import KioskDeviceSetupGate from "./KioskDeviceSetupGate";

function authLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[kiosk-auth] ${message}`);
}

export default function KioskAuthGate() {
  const { loading, account, sessionType, deviceId, refresh } = useCosmicAccount();
  const revalidateDeviceSession = useCallback(async () => {
    const bootId = new URLSearchParams(window.location.search).get("cosmic-boot") ?? "";
    authLog("revalidate-start");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`/api/account/session?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(bootId)}`, { credentials: "include", cache: "no-store" });
      const payload = await response.json() as { authenticated?: boolean; sessionType?: string; authenticatedBootId?: string };
      const bootMatch = payload.authenticatedBootId === bootId;
      authLog(`attempt=${attempt + 1} httpStatus=${response.status} authenticated=${payload.authenticated === true} sessionType=${payload.sessionType ?? "none"} authenticatedBootId=${payload.authenticatedBootId ?? "null"} expectedBootId=${bootId}`);
      if (response.ok && payload.authenticated === true && payload.sessionType === "device" && bootMatch) {
        authLog("account-refresh");
        await refresh();
        authLog("authenticated");
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    throw new Error("Device session validation is still pending.");
  }, [refresh]);
  if (loading) return <div className="grid min-h-[100dvh] place-items-center text-sm text-white/50">Checking Cosmic device authorization…</div>;
  if (!account || sessionType !== "device") return <DevicePairingScreen onAuthenticated={revalidateDeviceSession} />;
  return (
    // Kiosk widgets need the readiness context, but kiosk presentation does not
    // gate mounting on dashboard-critical readiness.
    <KioskDeviceSetupGate deviceId={deviceId!}>
      <DashboardReadinessProvider criticalWidgetIds={[]}>
        <KioskAmbientFrame>
          <KioskSlideshow />
        </KioskAmbientFrame>
      </DashboardReadinessProvider>
    </KioskDeviceSetupGate>
  );
}
