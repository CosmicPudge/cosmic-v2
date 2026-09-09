"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import KioskAmbientFrame from "./KioskAmbientFrame";
import KioskSlideshow from "./KioskSlideshow";

export default function StandaloneDesktopKiosk() {
  const router = useRouter();
  useEffect(() => {
    const exit = () => router.replace("/os");
    window.addEventListener("keydown", exit, { capture: true });
    window.addEventListener("pointerdown", exit, { capture: true });
    window.addEventListener("touchstart", exit, { capture: true });
    return () => {
      window.removeEventListener("keydown", exit, true);
      window.removeEventListener("pointerdown", exit, true);
      window.removeEventListener("touchstart", exit, true);
    };
  }, [router]);
  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-[100dvw] overflow-hidden bg-[#02040e] text-white" data-desktop-kiosk>
      <DashboardReadinessProvider criticalWidgetIds={[]}>
        <KioskAmbientFrame><KioskSlideshow /></KioskAmbientFrame>
      </DashboardReadinessProvider>
      <button type="button" data-kiosk-exit onClick={() => router.replace("/os")} className="absolute bottom-5 right-5 z-[70] rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 shadow-2xl backdrop-blur-md transition hover:bg-black/70 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200">Exit Kiosk</button>
      <span className="sr-only">Desktop Kiosk Mode. Press Escape to return to Cosmic OS.</span>
    </div>
  );
}
