"use client";

import ClockWidget from "@/components/os/widgets/clock/ClockWidget";
import { WidgetProvider } from "@/components/os/ui/widget/WidgetContext";

/**
 * M3 visual rebuild shell.
 *
 * The legacy multi-slide presentation has intentionally been removed from the
 * active kiosk path. We are rebuilding the kiosk one approved reference at a
 * time. Part 1/11 is Clock, so Clock is the only scene rendered here until it
 * is approved at 100%.
 *
 * Device auth, pairing, health, and Pi runtime infrastructure stay outside
 * this component and are preserved.
 */
export default function KioskSlideshow() {
  return (
    <main
      className="fixed inset-0 h-[100dvh] w-[100dvw] overflow-hidden bg-black"
      data-kiosk-rebuild="clock"
      data-kiosk-part="1-of-11"
    >
      <WidgetProvider size="medium" presentation="kiosk" active>
        <ClockWidget />
      </WidgetProvider>
    </main>
  );
}
