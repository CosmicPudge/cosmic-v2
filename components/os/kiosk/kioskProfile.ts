import type { KioskDensity, KioskDisplayProfile, KioskPointer } from "@/core/contracts/Kiosk";
import { kioskApiUrl } from "@/services/kioskRequest";

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
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const root = document.querySelector<HTMLElement>(".kiosk-shell")?.getBoundingClientRect();
  const scene = document.querySelector<HTMLElement>(".kiosk-slideshow, .kiosk-sports-view, .kiosk-setup-preview")?.getBoundingClientRect();
  if (process.env.NODE_ENV !== "production") {
    console.info(`[kiosk-viewport] viewport=${viewportWidth}x${viewportHeight} visual=${visual ? `${Math.round(visual.width)}x${Math.round(visual.height)}` : "none"} root=${root ? `${Math.round(root.x)},${Math.round(root.y)},${Math.round(root.width)}x${Math.round(root.height)}` : "missing"} scene=${scene ? `${Math.round(scene.x)},${Math.round(scene.y)},${Math.round(scene.width)}x${Math.round(scene.height)}` : "missing"} document=${document.documentElement.clientWidth}x${document.documentElement.clientHeight} overflow=${Math.max(0, document.documentElement.scrollWidth - viewportWidth)}x${Math.max(0, document.documentElement.scrollHeight - viewportHeight)}`);
  }
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
    ...(window.screen?.orientation?.type ? { screenOrientation: window.screen.orientation.type } : {}),
    overflowX: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
    overflowY: Math.max(0, document.documentElement.scrollHeight - viewportHeight),
    setupVersion,
    ...(timezone ? { timezone } : {}),
  };
}

export function observeKioskDisplay(setupVersion: number, onChange: (profile: KioskDisplayProfile) => void) {
  let timer: number | undefined;
  const schedule = () => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => onChange(measureKioskDisplay(setupVersion)), 150);
  };
  window.addEventListener("resize", schedule);
  window.addEventListener("orientationchange", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  schedule();
  return () => {
    if (timer) window.clearTimeout(timer);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("orientationchange", schedule);
    window.visualViewport?.removeEventListener("resize", schedule);
  };
}

export function kioskProfileUrl() {
  return kioskApiUrl("/api/devices/kiosk-profile");
}
