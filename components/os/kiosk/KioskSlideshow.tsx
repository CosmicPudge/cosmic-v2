"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import ClockWidget from "@/components/os/widgets/clock/ClockWidget";
import WeatherWidget from "@/components/os/widgets/weather/WeatherWidget";
import { WidgetProvider } from "@/components/os/ui/widget/WidgetContext";

const BUILD_SLIDES = [
  { id: "clock", component: ClockWidget },
  { id: "weather", component: WeatherWidget },
] as const;

/**
 * M3 visual rebuild shell.
 *
 * Only approved/rebuilt scenes belong here. We add them one at a time and
 * keep the legacy presentation out of the active kiosk path.
 */
export default function KioskSlideshow() {
  const searchParams = useSearchParams();
  const preview = process.env.NODE_ENV !== "production" ? searchParams.get("slide") : null;
  const forcedIndex = BUILD_SLIDES.findIndex((slide) => slide.id === preview);
  const [index, setIndex] = useState(forcedIndex >= 0 ? forcedIndex : 0);

  useEffect(() => {
    if (forcedIndex >= 0) {
      setIndex(forcedIndex);
      return;
    }

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % BUILD_SLIDES.length),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, [forcedIndex]);

  const active = BUILD_SLIDES[index] ?? BUILD_SLIDES[0];
  const ActiveSlide = active.component;

  return (
    <main
      className="fixed inset-0 h-[100dvh] w-[100dvw] overflow-hidden bg-black"
      data-kiosk-rebuild={active.id}
      data-kiosk-part="2-of-11"
    >
      <WidgetProvider size="medium" presentation="kiosk" active>
        <ActiveSlide />
      </WidgetProvider>
    </main>
  );
}
