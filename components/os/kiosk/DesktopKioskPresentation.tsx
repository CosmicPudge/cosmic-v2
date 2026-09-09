"use client";

import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import { useKioskPresentation } from "@/hooks/os/useKioskPresentation";
import KioskAmbientFrame from "./KioskAmbientFrame";
import KioskSlideshow from "./KioskSlideshow";

export default function DesktopKioskPresentation() {
  const { active, exit } = useKioskPresentation();
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-[100dvw] overflow-hidden bg-[#02040e] text-white" data-desktop-kiosk>
      <DashboardReadinessProvider criticalWidgetIds={[]}>
        <KioskAmbientFrame>
          <KioskSlideshow />
        </KioskAmbientFrame>
      </DashboardReadinessProvider>
      <button
        type="button"
        data-kiosk-exit
        onClick={exit}
        className="absolute bottom-5 right-5 z-[70] rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 shadow-2xl backdrop-blur-md transition hover:bg-black/70 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200"
      >
        Exit Kiosk
      </button>
      <span className="sr-only">Desktop Kiosk Mode. Press Escape or interact to return to Cosmic OS.</span>
    </div>
  );
}
