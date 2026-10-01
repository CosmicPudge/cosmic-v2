"use client";

import { useEffect } from "react";
import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import KioskAmbientFrame from "./KioskAmbientFrame";
import KioskSlideshow from "./KioskSlideshow";

export default function StandaloneDesktopKiosk() {
  useEffect(() => {
    document.documentElement.dataset.cosmicKiosk = "true";
    document.body.dataset.cosmicKiosk = "true";
    return () => { delete document.documentElement.dataset.cosmicKiosk; delete document.body.dataset.cosmicKiosk; };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-[100dvw] overflow-hidden bg-[#02040e] text-white" data-desktop-kiosk>
      <DashboardReadinessProvider criticalWidgetIds={[]}>
        <KioskAmbientFrame><KioskSlideshow /></KioskAmbientFrame>
      </DashboardReadinessProvider>
      <span className="sr-only">Cosmic developer kiosk presentation.</span>
    </div>
  );
}
