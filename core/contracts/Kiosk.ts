export const CURRENT_KIOSK_SETUP_VERSION = 1;

export type KioskOrientation = "landscape" | "portrait";
export type KioskDensity = "compact" | "standard" | "large";
export type KioskPointer = "coarse" | "fine" | "unknown";
export type KioskLocationSource = "detected" | "account" | "manual";
export type KioskSetupPreview = "normal" | "fit" | "clock" | "weather" | "calendar";

export interface KioskDisplayProfile {
  viewportWidth: number;
  viewportHeight: number;
  clientWidth: number;
  clientHeight: number;
  physicalScreenWidth?: number;
  physicalScreenHeight?: number;
  availableScreenWidth?: number;
  availableScreenHeight?: number;
  devicePixelRatio: number;
  aspectRatio: number;
  orientation: KioskOrientation;
  density: KioskDensity;
  touch: boolean;
  pointer: KioskPointer;
  visualViewportWidth?: number;
  visualViewportHeight?: number;
  visualViewportScale?: number;
  overflowX: number;
  overflowY: number;
  setupVersion: number;
  timezone?: string;
}

export interface KioskDeviceProfile {
  deviceId: string;
  deviceName?: string;
  setupCompleted: boolean;
  setupVersion: number;
  uiScale: number;
  display?: KioskDisplayProfile;
  timezone?: string;
  clockFormat?: "12h" | "24h";
  location?: { latitude: number; longitude: number; label?: string; region?: string; country?: string; timezone?: string; source: KioskLocationSource };
  reportedTimezone?: string;
  timezoneOverride?: string;
  effectiveTimezone?: string;
  nightDimEnabled: boolean;
  nightDimStart: string;
  nightDimEnd: string;
  nightDimOpacity: number;
  setupPreview?: KioskSetupPreview;
  nightDimPreview: boolean;
  updatedAt?: string;
}
