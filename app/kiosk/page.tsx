import { Suspense } from "react";
import { headers } from "next/headers";
import StandaloneDesktopKiosk from "@/components/os/kiosk/StandaloneDesktopKiosk";
import { isDeveloperKioskEnabled, isDeveloperKioskHost } from "@/services/kiosk/developerKiosk";

export default async function KioskPage() {
  const requestHeaders = await headers();
  const enabled = isDeveloperKioskEnabled() && isDeveloperKioskHost(requestHeaders.get("host") ?? "");
  if (!enabled) return <main className="grid min-h-[100dvh] place-items-center bg-[#02040e] px-6 text-center text-white"><div><p className="text-xs uppercase tracking-[.3em] text-cyan-100/60">Cosmic Kiosk</p><h1 className="mt-4 text-3xl font-semibold">Developer kiosk unavailable</h1><p className="mt-3 text-sm text-white/50">This presentation is limited to the configured developer deployment.</p></div></main>;
  return (
    <Suspense fallback={<main className="fixed inset-0 bg-[#02040e]" aria-busy="true" />}>
      <StandaloneDesktopKiosk />
    </Suspense>
  );
}
