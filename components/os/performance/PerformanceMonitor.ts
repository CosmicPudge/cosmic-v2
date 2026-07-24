import {
  DefaultPerformanceProfile,
  PerformanceProfile,
  PerformanceProfiles,
  PerformanceTier,
} from "./PerformanceProfiles";

export interface DeviceCapabilities {
  cores: number;
  memory: number;
  width: number;
  height: number;
  pixelRatio: number;
  touch: boolean;
  reducedMotion: boolean;
  batterySaver: boolean;
}

export class PerformanceMonitor {
  private readonly capabilities: DeviceCapabilities;

  constructor() {
    // Safe defaults for SSR / build
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined"
    ) {
      this.capabilities = {
        cores: 4,
        memory: 4,
        width: 1920,
        height: 1080,
        pixelRatio: 1,
        touch: false,
        reducedMotion: false,
        batterySaver: false,
      };

      return;
    }

    this.capabilities = {
      cores: navigator.hardwareConcurrency ?? 4,

      memory:
        (
          navigator as Navigator & {
            deviceMemory?: number;
          }
        ).deviceMemory ?? 4,

      width: window.innerWidth,

      height: window.innerHeight,

      pixelRatio: window.devicePixelRatio,

      touch:
        navigator.maxTouchPoints > 0 ||
        "ontouchstart" in window,

      reducedMotion:
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches,

      batterySaver: false,
    };

    void this.detectBatterySaver();
  }

  private async detectBatterySaver() {
    if (
      typeof navigator === "undefined"
    ) {
      return;
    }

    try {
      const batteryApi = (
        navigator as Navigator & {
          getBattery?: () => Promise<{
            charging: boolean;
            level: number;
            chargingTime: number;
            dischargingTime: number;
            saveMode?: boolean;
          }>;
        }
      ).getBattery;

      if (!batteryApi) return;

      const battery = await batteryApi();

      this.capabilities.batterySaver =
        battery.saveMode === true;
    } catch {
      // Ignore unsupported browsers.
    }
  }

  getCapabilities(): DeviceCapabilities {
    return this.capabilities;
  }

  determineTier(): PerformanceTier {
    const c = this.capabilities;

    if (c.touch && c.width < 700) {
      return "mobile";
    }

    if (c.touch && c.width < 1100) {
      return "tablet";
    }

    if (c.cores >= 12 && c.memory >= 16) {
      return "workstation";
    }

    if (c.cores >= 8 && c.memory >= 8) {
      return "desktop";
    }

    if (c.cores >= 4) {
      return "laptop";
    }

    return "mobile";
  }

  getProfile(): PerformanceProfile {
    const tier = this.determineTier();

    return (
      PerformanceProfiles[tier] ??
      DefaultPerformanceProfile
    );
  }
}