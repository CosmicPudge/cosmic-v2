"use client";

import { usePathname } from "next/navigation";
import { useSettingsData } from "@/components/apps/settings/SettingsProvider";
import { useSystem } from "@/components/os/system/SystemProvider";

import CosmicBackground from "./CosmicBackground";

const GLOBAL_BACKGROUND_DISABLED_ROUTES = new Set([
  "/dev/background",
]);

export default function GlobalCosmicBackground() {
  const pathname = usePathname();
  const settings = useSettingsData();
  const { snapshot } = useSystem();

  if (GLOBAL_BACKGROUND_DISABLED_ROUTES.has(pathname)) {
    return null;
  }

  const isAmbient = pathname === "/os/ambient";
  const selectedMotion = settings.data.appearance.reducedEffects || snapshot.power.reducedMotion
    ? "off"
    : snapshot.power.effective === "reduced"
      ? settings.data.background.motion === "off" ? "off" : "subtle"
      : snapshot.power.effective === "balanced" && settings.data.background.motion === "normal"
        ? "subtle"
        : settings.data.background.motion;
  const selectedIntensity = snapshot.power.effective === "reduced"
    ? "low"
    : snapshot.power.effective === "balanced" && settings.data.background.intensity === "high"
      ? "normal"
      : settings.data.background.intensity;
  const ambientIntensity = selectedIntensity === "low"
    ? "normal"
    : "high";
  const ambientMotion = selectedMotion === "off" ? "off" : "subtle";

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      data-cosmic-global-background
    >
      <CosmicBackground
        variant={isAmbient ? "ambient" : "dashboard"}
        intensity={snapshot.power.effective === "reduced" ? "low" : isAmbient ? ambientIntensity : selectedIntensity}
        motion={isAmbient ? ambientMotion : selectedMotion}
        reducedMotion={snapshot.power.reducedMotion}
      />
    </div>
  );
}
