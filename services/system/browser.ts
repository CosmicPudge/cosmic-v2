import type {
  BatteryProfile,
  DeviceProfileOverride,
  InputProfile,
  NetworkProfile,
  StorageProfile,
  SystemCapabilities,
  SystemPermissions,
  SystemSnapshot,
} from "@/core/contracts/System";
import { deriveDeviceClass, deriveDisplayProfile, derivePowerProfile } from "@/config/system";

export interface NetworkInformationLike extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface BatteryManagerLike extends EventTarget {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
}

interface NavigatorWithOptionalApis extends Navigator {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
  getBattery?: () => Promise<BatteryManagerLike>;
  standalone?: boolean;
  userAgentData?: { platform?: string };
}

export interface BrowserSystemState {
  visible: boolean;
  platform: string;
  browser: string;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
  orientation: "portrait" | "landscape";
  colorDepth?: number;
  input: InputProfile;
  network: NetworkProfile;
  battery: BatteryProfile;
  storage: StorageProfile;
  standalone: boolean;
  installable: boolean;
  iosHomeScreenGuidance: boolean;
  serviceWorkerRegistered: boolean;
  permissions: SystemPermissions;
  capabilities: SystemCapabilities;
  logicalProcessors?: number;
  deviceMemoryGB?: number;
}

const emptyInput: InputProfile = {
  touch: false,
  touchPrimary: false,
  hover: false,
  finePointer: false,
  coarsePointer: false,
  keyboardLikely: true,
};

export const initialBrowserSystemState: BrowserSystemState = {
  visible: true,
  platform: "Checking…",
  browser: "Checking…",
  orientation: "landscape",
  input: emptyInput,
  network: { online: true, informationSupported: false },
  battery: { supported: false },
  storage: {
    localStorageAvailable: false,
    indexedDBSupported: false,
    storageManagerSupported: false,
    estimateAvailable: false,
  },
  standalone: false,
  installable: false,
  iosHomeScreenGuidance: false,
  serviceWorkerRegistered: false,
  permissions: { notifications: "unknown", geolocation: "unknown" },
  capabilities: {
    battery: false,
    networkInformation: false,
    serviceWorker: false,
    notifications: false,
    geolocation: false,
    permissions: false,
    mediaSession: false,
    wakeLock: false,
    fullscreen: false,
    webShare: false,
    clipboard: false,
    storageManager: false,
  },
};

function browserLabel(userAgent: string) {
  if (/Edg\//.test(userAgent)) return "Microsoft Edge (best effort)";
  if (/CriOS\//.test(userAgent)) return "Chrome on iOS (best effort)";
  if (/FxiOS\//.test(userAgent)) return "Firefox on iOS (best effort)";
  if (/Chrome\//.test(userAgent)) return "Chrome (best effort)";
  if (/Firefox\//.test(userAgent)) return "Firefox (best effort)";
  if (/Safari\//.test(userAgent)) return "Safari (best effort)";
  return "Browser (best effort)";
}

function localStorageAvailable() {
  try {
    const key = "cosmic.system.storage-check";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readBrowserSystemState(previous = initialBrowserSystemState): BrowserSystemState {
  const extendedNavigator = navigator as NavigatorWithOptionalApis;
  const connection = extendedNavigator.connection;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hover = window.matchMedia("(hover: hover)").matches;
  const touch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || extendedNavigator.standalone === true;
  const platform = extendedNavigator.userAgentData?.platform || navigator.platform || "Unavailable";
  const userAgent = navigator.userAgent;
  const iosLike = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return {
    ...previous,
    visible: document.visibilityState !== "hidden",
    platform: `${platform} (browser-reported)`,
    browser: browserLabel(userAgent),
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth >= window.innerHeight ? "landscape" : "portrait",
    colorDepth: window.screen?.colorDepth,
    input: {
      touch,
      touchPrimary: touch && coarsePointer,
      hover,
      finePointer,
      coarsePointer,
      keyboardLikely: finePointer || !coarsePointer,
    },
    network: {
      online: navigator.onLine,
      informationSupported: Boolean(connection),
      ...(connection?.effectiveType ? { effectiveType: connection.effectiveType } : {}),
      ...(typeof connection?.downlink === "number" ? { downlinkMbps: connection.downlink } : {}),
      ...(typeof connection?.rtt === "number" ? { rttMs: connection.rtt } : {}),
      ...(typeof connection?.saveData === "boolean" ? { saveData: connection.saveData } : {}),
    },
    standalone,
    iosHomeScreenGuidance: iosLike && !standalone,
    capabilities: {
      battery: typeof extendedNavigator.getBattery === "function",
      networkInformation: Boolean(connection),
      serviceWorker: "serviceWorker" in navigator,
      notifications: "Notification" in window,
      geolocation: "geolocation" in navigator,
      permissions: "permissions" in navigator,
      mediaSession: "mediaSession" in navigator,
      wakeLock: "wakeLock" in navigator,
      fullscreen: typeof document.documentElement.requestFullscreen === "function",
      webShare: typeof navigator.share === "function",
      clipboard: Boolean(navigator.clipboard?.writeText),
      storageManager: "storage" in navigator,
    },
    logicalProcessors: navigator.hardwareConcurrency || undefined,
    deviceMemoryGB: extendedNavigator.deviceMemory,
    storage: {
      ...previous.storage,
      localStorageAvailable: localStorageAvailable(),
      indexedDBSupported: "indexedDB" in window,
      storageManagerSupported: "storage" in navigator,
    },
    permissions: {
      ...previous.permissions,
      notifications: "Notification" in window ? Notification.permission : "unsupported",
      geolocation: "geolocation" in navigator ? previous.permissions.geolocation : "unsupported",
    },
  };
}

export async function readStorageProfile(current: StorageProfile): Promise<StorageProfile> {
  if (!("storage" in navigator)) return current;
  try {
    const [estimate, persistent] = await Promise.all([
      navigator.storage.estimate().catch(() => null),
      navigator.storage.persisted?.().catch(() => undefined),
    ]);
    return {
      ...current,
      storageManagerSupported: true,
      estimateAvailable: estimate !== null,
      ...(typeof estimate?.usage === "number" ? { usageBytes: estimate.usage } : {}),
      ...(typeof estimate?.quota === "number" ? { quotaBytes: estimate.quota } : {}),
      ...(typeof persistent === "boolean" ? { persistent } : {}),
    };
  } catch {
    return current;
  }
}

export function toBatteryProfile(battery: BatteryManagerLike): BatteryProfile {
  return {
    supported: true,
    charging: battery.charging,
    level: battery.level,
    chargingTimeSeconds: Number.isFinite(battery.chargingTime) ? battery.chargingTime : undefined,
    dischargingTimeSeconds: Number.isFinite(battery.dischargingTime) ? battery.dischargingTime : undefined,
  };
}

export function createSystemSnapshot(
  raw: BrowserSystemState,
  settings: {
    performanceMode: import("@/core/contracts/System").PerformanceMode;
    deviceProfileOverride: DeviceProfileOverride;
    reducedEffects: boolean;
  },
  ready: boolean,
): SystemSnapshot {
  const width = raw.viewportWidth ?? 0;
  const displayProfile = deriveDisplayProfile(width, settings.deviceProfileOverride);
  const deviceClass = deriveDeviceClass(width, displayProfile, raw.input, settings.deviceProfileOverride);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effective = derivePowerProfile({
    preference: settings.performanceMode,
    reducedEffects: settings.reducedEffects,
    reducedMotion,
    saveData: raw.network.saveData,
    deviceMemoryGB: raw.deviceMemoryGB,
    logicalProcessors: raw.logicalProcessors,
    deviceClass,
  });

  return {
    ready,
    visible: raw.visible,
    device: {
      deviceClass,
      override: settings.deviceProfileOverride,
      platform: raw.platform,
      browser: raw.browser,
      logicalProcessors: raw.logicalProcessors,
      deviceMemoryGB: raw.deviceMemoryGB,
    },
    display: {
      profile: displayProfile,
      screenWidth: raw.screenWidth,
      screenHeight: raw.screenHeight,
      viewportWidth: raw.viewportWidth,
      viewportHeight: raw.viewportHeight,
      devicePixelRatio: raw.devicePixelRatio,
      orientation: raw.orientation,
      colorDepth: raw.colorDepth,
    },
    input: raw.input,
    network: raw.network,
    power: {
      preference: settings.performanceMode,
      effective,
      reducedMotion,
      reducedEffects: settings.reducedEffects,
      battery: raw.battery,
    },
    storage: raw.storage,
    install: {
      mode: raw.standalone ? "standalone" : "browser",
      installable: raw.installable,
      serviceWorkerSupported: raw.capabilities.serviceWorker,
      serviceWorkerRegistered: raw.serviceWorkerRegistered,
      offlineCapable: false,
      iosHomeScreenGuidance: raw.iosHomeScreenGuidance,
    },
    capabilities: raw.capabilities,
    permissions: raw.permissions,
  };
}

export function formatBytes(value?: number) {
  if (value === undefined) return "Unavailable";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** exponent).toFixed(exponent > 1 ? 1 : 0)} ${units[exponent]}`;
}
