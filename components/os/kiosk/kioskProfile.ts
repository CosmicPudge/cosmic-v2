import type { KioskDensity, KioskDisplayProfile, KioskPointer } from "@/core/contracts/Kiosk";

export function classifyKioskDensity(width: number, height: number, aspectRatio: number): KioskDensity {
  if (height <= 560 || (height <= 640 && aspectRatio >= 1.45)) return "compact";
  if (height >= 1000 || width >= 1800) return "large";
  return "standard";
}

export function measureKioskDisplay(setupVersion: number): KioskDisplayProfile {
  const visual = window.visualViewport;
  const viewportWidth = Math.max(1, Math.round(window.innerWidth));
  const viewportHeight = Math.max(1, Math.round(window.innerHeight));
  const aspectRatio = viewportWidth / viewportHeight;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const touch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const pointer: KioskPointer = coarse ? "coarse" : fine ? "fine" : "unknown";
  return {
    viewportWidth,
    viewportHeight,
    clientWidth: Math.max(1, document.documentElement.clientWidth),
    clientHeight: Math.max(1, document.documentElement.clientHeight),
    ...(window.screen?.width ? { physicalScreenWidth: window.screen.width } : {}),
    ...(window.screen?.height ? { physicalScreenHeight: window.screen.height } : {}),
    ...(window.screen?.availWidth ? { availableScreenWidth: window.screen.availWidth } : {}),
    ...(window.screen?.availHeight ? { availableScreenHeight: window.screen.availHeight } : {}),
    devicePixelRatio: window.devicePixelRatio || 1,
    aspectRatio,
    orientation: viewportWidth >= viewportHeight ? "landscape" : "portrait",
    density: classifyKioskDensity(viewportWidth, viewportHeight, aspectRatio),
    touch,
    pointer,
    ...(visual ? { visualViewportWidth: Math.round(visual.width), visualViewportHeight: Math.round(visual.height), visualViewportScale: visual.scale } : {}),
    overflowX: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
    overflowY: Math.max(0, document.documentElement.scrollHeight - viewportHeight),
    setupVersion,
  };
}

export function kioskProfileUrl() {
  const params = new URLSearchParams(window.location.search);
  params.set("cosmic-kiosk", "1");
  return `/api/devices/kiosk-profile?${params.toString()}`;
}
