"use client";

import {
  type ReactNode,
} from "react";
import { useSystem } from "@/components/os/system/SystemProvider";

export const KIOSK_SESSION_STORAGE_KEY = "cosmic:kiosk-session";

export default function KioskShell({
  children,
}: {
  children: ReactNode;
}) {
  const { snapshot } = useSystem();

  const compact = snapshot.display.profile === "compact"
    || snapshot.display.profile === "display"
    || (snapshot.display.viewportWidth ?? 0) <= 700
    || (snapshot.display.viewportHeight ?? 0) <= 560;

  return (
    <div
      className="kiosk-shell relative min-h-[100svh] overflow-hidden bg-transparent text-white"
      data-compact={compact}
      data-touch={snapshot.input.touchPrimary}
      data-reduced-motion={snapshot.power.reducedMotion || snapshot.power.effective === "reduced"}
      tabIndex={-1}
      aria-label="Cosmic Kiosk live presentation"
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(1,3,12,.16),transparent_45%,rgba(1,3,12,.22))]" />

      <main className="relative z-10 min-h-[100svh]">
        {children}
      </main>
    </div>
  );
}
