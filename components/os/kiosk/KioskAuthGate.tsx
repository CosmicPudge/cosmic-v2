"use client";

import { useCallback } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import DevicePairingScreen from "./DevicePairingScreen";
import KioskSlideshow from "./KioskSlideshow";

export default function KioskAuthGate() {
  const { loading, account, sessionType, refresh } = useCosmicAccount();
  if (loading) return <div className="grid min-h-[100svh] place-items-center text-sm text-white/50">Checking Cosmic device authorization…</div>;
  const revalidateDeviceSession = useCallback(async () => {
    const bootId = new URLSearchParams(window.location.search).get("cosmic-boot") ?? "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`/api/account/session?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(bootId)}`, { credentials: "include", cache: "no-store" });
      const payload = await response.json() as { authenticated?: boolean; sessionType?: string };
      if (response.ok && payload.authenticated === true && payload.sessionType === "device") { await refresh(); return; }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    throw new Error("Device session validation is still pending.");
  }, [refresh]);
  if (!account || sessionType !== "device") return <DevicePairingScreen onAuthenticated={revalidateDeviceSession} />;
  return <KioskSlideshow />;
}
