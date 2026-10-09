"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useKioskDeviceLocation from "@/hooks/os/useKioskDeviceLocation";

import ClockWidget from "@/components/os/widgets/clock/ClockWidget";
import WeatherWidget from "@/components/os/widgets/weather/WeatherWidget";
import CalendarWidget from "@/components/os/widgets/calendar/CalendarWidget";
import SchoolCalendarKioskWidget from "@/components/os/widgets/school/SchoolCalendarKioskWidget";
import SportsKioskOverview from "@/components/os/widgets/sports/SportsKioskOverview";
import CosmosMusicKioskScene from "@/components/os/widgets/music/CosmosMusicKioskScene";
import CosmosGarageKioskScene from "@/components/os/widgets/garage/CosmosGarageKioskScene";
import CosmosNotesKioskScene from "@/components/os/widgets/notes/CosmosNotesKioskScene";
import CosmosTasksKioskScene from "@/components/os/widgets/tasks/CosmosTasksKioskScene";
import CosmosAIKioskScene from "@/components/os/widgets/assistant/CosmosAIKioskScene";
import CosmosSystemKioskScene from "@/components/os/widgets/system/CosmosSystemKioskScene";
import { WidgetProvider } from "@/components/os/ui/widget/WidgetContext";

const BUILD_SLIDES = [
  { id: "clock", component: ClockWidget },
  { id: "weather", component: WeatherWidget },
  { id: "calendar", component: CalendarWidget },
  { id: "school-calendar", component: SchoolCalendarKioskWidget },
  { id: "sports", component: SportsKioskOverview },
  { id: "music", component: CosmosMusicKioskScene },
  { id: "garage", component: CosmosGarageKioskScene },
  { id: "notes", component: CosmosNotesKioskScene },
  { id: "tasks", component: CosmosTasksKioskScene },
  { id: "cosmic-ai", component: CosmosAIKioskScene },
  { id: "system", component: CosmosSystemKioskScene },
] as const;

const ROTATION_MS = 120_000;
const SWIPE_THRESHOLD_PX = 55;

/**
 * M3 visual rebuild shell.
 *
 * Only approved/rebuilt scenes belong here. Each completed reference is added
 * to this list. The active set currently contains Clock and Weather.
 */
export default function KioskSlideshow() {
  useKioskDeviceLocation();
  const searchParams = useSearchParams();
  const preview = process.env.NODE_ENV !== "production" ? searchParams.get("slide") : null;
  const forcedIndex = BUILD_SLIDES.findIndex((slide) => slide.id === preview);
  const [index, setIndex] = useState(forcedIndex >= 0 ? forcedIndex : 0);
  const [rotationEpoch, setRotationEpoch] = useState(0);
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);

  const goTo = useCallback((direction: 1 | -1) => {
    setIndex((current) => (current + direction + BUILD_SLIDES.length) % BUILD_SLIDES.length);
    setRotationEpoch((value) => value + 1);
  }, []);

  useEffect(() => {
    if (forcedIndex >= 0) {
      setIndex(forcedIndex);
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % BUILD_SLIDES.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [forcedIndex, rotationEpoch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo]);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    pointerStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== event.pointerId) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;

    goTo(dx < 0 ? 1 : -1);
  };

  const onPointerCancel = () => {
    pointerStart.current = null;
  };

  const active = BUILD_SLIDES[index] ?? BUILD_SLIDES[0];
  const ActiveSlide = active.component;

  return (
    <main
      className="fixed inset-0 h-[100dvh] w-[100dvw] touch-pan-y overflow-hidden bg-black"
      data-kiosk-rebuild={active.id}
      data-kiosk-part="11-of-11"
      data-kiosk-slide-index={index}
      data-kiosk-slide-count={BUILD_SLIDES.length}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        key={active.id}
        className="h-full w-full animate-[kiosk-rebuild-slide-in_420ms_cubic-bezier(.22,.61,.36,1)] motion-reduce:animate-none"
      >
        <WidgetProvider size="medium" presentation="kiosk" active>
          <ActiveSlide />
        </WidgetProvider>
      </div>

      <div className="cosmos-kiosk-slide-dots" aria-label={`Slide ${index + 1} of ${BUILD_SLIDES.length}`}>
        {BUILD_SLIDES.map((slide, slideIndex) => (
          <span key={slide.id} className={slideIndex === index ? "is-active" : ""} />
        ))}
      </div>
    </main>
  );
}
