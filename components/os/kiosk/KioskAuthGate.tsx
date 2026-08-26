"use client";

import { useCosmicAccount } from "@/components/account/AccountProvider";
import DevicePairingScreen from "./DevicePairingScreen";
import KioskSlideshow from "./KioskSlideshow";

export default function KioskAuthGate() {
  const { loading, account, sessionType, refresh } = useCosmicAccount();
  if (loading) return <div className="grid min-h-[100svh] place-items-center text-sm text-white/50">Checking Cosmic device authorization…</div>;
  if (!account || sessionType !== "device") return <DevicePairingScreen onAuthenticated={refresh} />;
  return <KioskSlideshow />;
}
