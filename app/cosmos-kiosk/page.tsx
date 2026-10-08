"use client";

import { Suspense } from "react";
import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import KioskAmbientFrame from "@/components/os/kiosk/KioskAmbientFrame";
import KioskSlideshow from "@/components/os/kiosk/KioskSlideshow";
import { KioskRuntimeProvider } from "@/components/os/kiosk/KioskRuntimeContext";
import { ConnectionHealthProvider } from "@/services/kiosk/ConnectionHealthProvider";

export default function CosmosKioskPreviewPage() {
  return (
    <main className="fixed inset-0 z-[100] h-[100dvh] w-[100dvw] overflow-hidden bg-[#02040e] text-white">
      <KioskRuntimeProvider ready={false}>
        <ConnectionHealthProvider>
          <DashboardReadinessProvider criticalWidgetIds={[]}>
            <KioskAmbientFrame>
              <Suspense fallback={<div className="grid h-full place-items-center text-sm text-white/45">Loading kiosk preview…</div>}>
                <KioskSlideshow />
              </Suspense>
            </KioskAmbientFrame>
          </DashboardReadinessProvider>
        </ConnectionHealthProvider>
      </KioskRuntimeProvider>
      <div className="pointer-events-none fixed left-4 top-4 z-[120] rounded-full border border-violet-200/20 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100/75 backdrop-blur">
        Milestone 3 Preview
      </div>
    </main>
  );
}
