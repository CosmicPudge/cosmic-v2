export type DeviceClass = "desktop" | "tablet" | "phone" | "display" | "unknown";
export type DeviceProfileOverride = "automatic" | "desktop" | "tablet" | "phone" | "display";
export type SystemDisplayProfile = "compact" | "regular" | "wide" | "display";
export type SystemOrientation = "portrait" | "landscape";
export type PerformanceMode = "automatic" | "full" | "balanced" | "reduced";
export type PowerProfile = Exclude<PerformanceMode, "automatic">;
export type PermissionStateValue = PermissionState | NotificationPermission | "unsupported" | "unknown";

export interface DeviceProfile {
  deviceClass: DeviceClass;
  override: DeviceProfileOverride;
  platform: string;
  browser: string;
  logicalProcessors?: number;
  deviceMemoryGB?: number;
}

export interface DisplayProfile {
  profile: SystemDisplayProfile;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
  orientation: SystemOrientation;
  colorDepth?: number;
}

export interface InputProfile {
  touch: boolean;
  touchPrimary: boolean;
  hover: boolean;
  finePointer: boolean;
  coarsePointer: boolean;
  keyboardLikely: boolean;
}

export interface NetworkProfile {
  online: boolean;
  informationSupported: boolean;
  effectiveType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;
}

export interface BatteryProfile {
  supported: boolean;
  charging?: boolean;
  level?: number;
  chargingTimeSeconds?: number;
  dischargingTimeSeconds?: number;
}

export interface PowerProfileState {
  preference: PerformanceMode;
  effective: PowerProfile;
  reducedMotion: boolean;
  reducedEffects: boolean;
  battery: BatteryProfile;
}

export interface StorageProfile {
  localStorageAvailable: boolean;
  indexedDBSupported: boolean;
  storageManagerSupported: boolean;
  estimateAvailable: boolean;
  usageBytes?: number;
  quotaBytes?: number;
  persistent?: boolean;
}

export interface InstallProfile {
  mode: "browser" | "standalone";
  installable: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerRegistered: boolean;
  offlineCapable: boolean;
  iosHomeScreenGuidance: boolean;
}

export interface SystemCapabilities {
  battery: boolean;
  networkInformation: boolean;
  serviceWorker: boolean;
  notifications: boolean;
  geolocation: boolean;
  permissions: boolean;
  mediaSession: boolean;
  wakeLock: boolean;
  fullscreen: boolean;
  webShare: boolean;
  clipboard: boolean;
  storageManager: boolean;
  camera: boolean;
  microphone: boolean;
}

export interface SystemPermissions {
  notifications: PermissionStateValue;
  geolocation: PermissionStateValue;
  camera: PermissionStateValue;
  microphone: PermissionStateValue;
}

export interface SystemSnapshot {
  ready: boolean;
  visible: boolean;
  device: DeviceProfile;
  display: DisplayProfile;
  input: InputProfile;
  network: NetworkProfile;
  power: PowerProfileState;
  storage: StorageProfile;
  install: InstallProfile;
  capabilities: SystemCapabilities;
  permissions: SystemPermissions;
}
