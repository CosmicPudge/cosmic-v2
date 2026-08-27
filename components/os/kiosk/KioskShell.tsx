"use client";

import {
  type ReactNode,
} from "react";
import { useEffect } from "react";
import { useSystem } from "@/components/os/system/SystemProvider";

export const KIOSK_SESSION_STORAGE_KEY = "cosmic:kiosk-session";

export default function KioskShell({
  children,
}: {
  children: ReactNode;
}) {
  const { snapshot } = useSystem();

  useEffect(() => {
    document.documentElement.dataset.cosmicKiosk = "true";
    document.body.dataset.cosmicKiosk = "true";
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      delete document.documentElement.dataset.cosmicKiosk;
      delete document.body.dataset.cosmicKiosk;
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const compact = snapshot.display.profile === "compact"
    || snapshot.display.profile === "display"
    || (snapshot.display.viewportWidth ?? 0) <= 700
    || (snapshot.display.viewportHeight ?? 0) <= 560;

  return (
    <div
      className="kiosk-shell fixed inset-0 h-[100dvh] min-h-0 w-[100dvw] max-w-none overflow-hidden bg-transparent text-white"
      data-compact={compact}
      data-touch={snapshot.input.touchPrimary}
      data-reduced-motion={snapshot.power.reducedMotion || snapshot.power.effective === "reduced"}
      tabIndex={-1}
      aria-label="Cosmic Kiosk live presentation"
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(1,3,12,.16),transparent_45%,rgba(1,3,12,.22))]" />

      <main className="relative z-10 h-full min-h-0 w-full">
        {children}
      </main>
    </div>
  );
}
