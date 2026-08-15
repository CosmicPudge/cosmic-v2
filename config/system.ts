import type {
  DeviceClass,
  DeviceProfileOverride,
  InputProfile,
  PerformanceMode,
  PowerProfile,
  SystemDisplayProfile,
} from "@/core/contracts/System";

export const DISPLAY_PROFILE_THRESHOLDS = {
  compactMax: 639,
  regularMax: 1199,
} as const;

export const systemDestinations = [
  { id: "system-overview", name: "System", description: "Device and browser capability overview.", keywords: ["device", "display", "performance"], href: "/system#overview", icon: "⌘" },
  { id: "system-network", name: "Network", description: "Online state and optional connection hints.", keywords: ["online", "offline", "connection", "data saver"], href: "/system#network", icon: "⌁" },
  { id: "system-storage", name: "Storage", description: "Browser-site usage, quota, and persistence.", keywords: ["quota", "local storage", "persistent"], href: "/system#storage", icon: "▤" },
  { id: "system-install", name: "Install Cosmic", description: "PWA installability, standalone mode, and service worker status.", keywords: ["pwa", "home screen", "standalone", "service worker"], href: "/system#install", icon: "⇩" },
  { id: "system-notifications", name: "Notifications", description: "Browser notification support and permission state.", keywords: ["permission", "alerts"], href: "/system#permissions", icon: "◉" },
  { id: "system-diagnostics", name: "System Diagnostics", description: "Copy a privacy-safe capability summary.", keywords: ["debug", "capabilities", "status"], href: "/system#diagnostics", icon: "◇" },
] as const;

export function deriveDisplayProfile(width: number, override: DeviceProfileOverride): SystemDisplayProfile {
  if (override === "display") return "display";
  if (override === "phone") return "compact";
  if (override === "tablet") return "regular";
  if (override === "desktop") return width <= DISPLAY_PROFILE_THRESHOLDS.regularMax ? "regular" : "wide";
  if (width <= 0) return "regular";
  if (width <= DISPLAY_PROFILE_THRESHOLDS.compactMax) return "compact";
  if (width <= DISPLAY_PROFILE_THRESHOLDS.regularMax) return "regular";
  return "wide";
}

export function deriveDeviceClass(
  width: number,
  profile: SystemDisplayProfile,
  input: InputProfile,
  override: DeviceProfileOverride,
): DeviceClass {
  if (override !== "automatic") return override;
  if (profile === "display") return "display";
  if (profile === "compact" && (input.touch || input.coarsePointer)) return "phone";
  if (width <= DISPLAY_PROFILE_THRESHOLDS.regularMax && input.touchPrimary) return "tablet";
  if (width > 0) return "desktop";
  return "unknown";
}

export function derivePowerProfile(input: {
  preference: PerformanceMode;
  reducedEffects: boolean;
  reducedMotion: boolean;
  saveData?: boolean;
  deviceMemoryGB?: number;
  logicalProcessors?: number;
  deviceClass: DeviceClass;
}): PowerProfile {
  if (input.preference !== "automatic") return input.preference;
  if (
    input.reducedEffects ||
    input.reducedMotion ||
    input.saveData === true ||
    (input.deviceMemoryGB !== undefined && input.deviceMemoryGB <= 2) ||
    (input.logicalProcessors !== undefined && input.logicalProcessors <= 2)
  ) return "reduced";
  if (
    input.deviceClass === "phone" ||
    input.deviceClass === "display" ||
    (input.deviceMemoryGB !== undefined && input.deviceMemoryGB <= 4) ||
    (input.logicalProcessors !== undefined && input.logicalProcessors <= 4)
  ) return "balanced";
  return "full";
}
