"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useSettingsData } from "@/components/apps/settings/SettingsProvider";
import type { SystemSnapshot } from "@/core/contracts/System";
import {
  createSystemSnapshot,
  initialBrowserSystemState,
  readBrowserSystemState,
  readStorageProfile,
  toBatteryProfile,
  type BatteryManagerLike,
  type BrowserSystemState,
  type NetworkInformationLike,
} from "@/services/system/browser";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithSystemApis extends Navigator {
  connection?: NetworkInformationLike;
  getBattery?: () => Promise<BatteryManagerLike>;
}

interface SystemContextValue {
  snapshot: SystemSnapshot;
  promptInstall(): Promise<"accepted" | "dismissed" | "unavailable">;
  requestNotifications(): Promise<NotificationPermission | "unsupported">;
  requestPersistentStorage(): Promise<boolean | null>;
  enterFullscreen(): Promise<boolean>;
  refreshStorage(): Promise<void>;
  copyDiagnostics(): Promise<boolean>;
}

const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsData();
  const [raw, setRaw] = useState<BrowserSystemState>(initialBrowserSystemState);
  const [ready, setReady] = useState(false);
  const installPromptRef = useRef<InstallPromptEvent | null>(null);

  const refreshStorage = useCallback(async () => {
    const storage = await readStorageProfile(raw.storage);
    setRaw((current) => ({ ...current, storage }));
  }, [raw.storage]);

  useEffect(() => {
    let active = true;
    let battery: BatteryManagerLike | undefined;
    let geolocationPermission: PermissionStatus | undefined;
    let cameraPermission: PermissionStatus | undefined;
    let microphonePermission: PermissionStatus | undefined;
    const onCameraPermissionChange = () => {
      if (cameraPermission) syncMediaPermission("camera", cameraPermission);
    };
    const onMicrophonePermissionChange = () => {
      if (microphonePermission) syncMediaPermission("microphone", microphonePermission);
    };
    const extendedNavigator = navigator as NavigatorWithSystemApis;
    const connection = extendedNavigator.connection;
    const queries = [
      window.matchMedia("(pointer: fine)"),
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(hover: hover)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(display-mode: standalone)"),
    ];

    const sync = () => setRaw((current) => readBrowserSystemState(current));
    const syncBattery = () => {
      if (battery) setRaw((current) => ({ ...current, battery: toBatteryProfile(battery!) }));
    };
    const syncGeolocationPermission = () => {
      if (geolocationPermission) {
        setRaw((current) => ({
          ...current,
          permissions: { ...current.permissions, geolocation: geolocationPermission!.state },
        }));
      }
    };
    const syncMediaPermission = (kind: "camera" | "microphone", permission: PermissionStatus) => {
      setRaw((current) => ({ ...current, permissions: { ...current.permissions, [kind]: permission.state } }));
    };
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as InstallPromptEvent;
      setRaw((current) => ({ ...current, installable: true }));
    };
    const onInstalled = () => {
      installPromptRef.current = null;
      setRaw((current) => ({ ...current, installable: false, standalone: true }));
    };

    const initial = window.setTimeout(() => {
      sync();
      setReady(true);
    }, 0);
    void readStorageProfile(readBrowserSystemState().storage).then((storage) => {
      if (active) setRaw((current) => ({ ...current, storage }));
    });
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        if (active) setRaw((current) => ({ ...current, serviceWorkerRegistered: Boolean(registration) }));
      }).catch(() => undefined);
    }
    if (extendedNavigator.getBattery) {
      void extendedNavigator.getBattery().then((value) => {
        if (!active) return;
        battery = value;
        syncBattery();
        ["chargingchange", "levelchange", "chargingtimechange", "dischargingtimechange"].forEach((name) => battery?.addEventListener(name, syncBattery));
      }).catch(() => undefined);
    }
    if (navigator.permissions && "geolocation" in navigator) {
      void navigator.permissions.query({ name: "geolocation" }).then((permission) => {
        if (!active) return;
        geolocationPermission = permission;
        syncGeolocationPermission();
        permission.addEventListener("change", syncGeolocationPermission);
      }).catch(() => undefined);
    }
    const mediaDevices = (navigator as unknown as { mediaDevices?: MediaDevices }).mediaDevices;
    if (navigator.permissions && mediaDevices) {
      void navigator.permissions.query({ name: "camera" as PermissionName }).then((permission) => {
        if (!active) return;
        cameraPermission = permission;
        syncMediaPermission("camera", permission);
        permission.addEventListener("change", onCameraPermissionChange);
      }).catch(() => undefined);
      void navigator.permissions.query({ name: "microphone" as PermissionName }).then((permission) => {
        if (!active) return;
        microphonePermission = permission;
        syncMediaPermission("microphone", permission);
        permission.addEventListener("change", onMicrophonePermissionChange);
      }).catch(() => undefined);
    }

    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    document.addEventListener("visibilitychange", sync);
    queries.forEach((query) => query.addEventListener("change", sync));
    connection?.addEventListener("change", sync);

    return () => {
      active = false;
      window.clearTimeout(initial);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("visibilitychange", sync);
      queries.forEach((query) => query.removeEventListener("change", sync));
      connection?.removeEventListener("change", sync);
      geolocationPermission?.removeEventListener("change", syncGeolocationPermission);
      cameraPermission?.removeEventListener("change", onCameraPermissionChange);
      microphonePermission?.removeEventListener("change", onMicrophonePermissionChange);
      if (battery) ["chargingchange", "levelchange", "chargingtimechange", "dischargingtimechange"].forEach((name) => battery?.removeEventListener(name, syncBattery));
    };
  }, []);

  const snapshot = useMemo(() => createSystemSnapshot(raw, {
    performanceMode: settings.data.system.performanceMode,
    deviceProfileOverride: settings.data.system.deviceProfileOverride,
    reducedEffects: settings.data.appearance.reducedEffects,
  }, ready), [raw, ready, settings.data.appearance.reducedEffects, settings.data.system.deviceProfileOverride, settings.data.system.performanceMode]);

  const promptInstall = useCallback(async () => {
    const event = installPromptRef.current;
    if (!event) return "unavailable" as const;
    await event.prompt();
    const choice = await event.userChoice;
    installPromptRef.current = null;
    setRaw((current) => ({ ...current, installable: false }));
    return choice.outcome;
  }, []);

  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported" as const;
    const permission = await Notification.requestPermission();
    setRaw((current) => ({ ...current, permissions: { ...current.permissions, notifications: permission } }));
    return permission;
  }, []);

  const requestPersistentStorage = useCallback(async () => {
    if (!navigator.storage?.persist) return null;
    const persistent = await navigator.storage.persist();
    setRaw((current) => ({ ...current, storage: { ...current.storage, persistent } }));
    return persistent;
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (!document.documentElement.requestFullscreen) return false;
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }, []);

  const copyDiagnostics = useCallback(async () => {
    if (!navigator.clipboard?.writeText) return false;
    const lines = [
      "Cosmic OS system diagnostics",
      `Device profile: ${snapshot.device.deviceClass} (${snapshot.device.override})`,
      `Platform: ${snapshot.device.platform}`,
      `Browser: ${snapshot.device.browser}`,
      `Display: ${snapshot.display.profile}, ${snapshot.display.viewportWidth ?? "?"}x${snapshot.display.viewportHeight ?? "?"}, ${snapshot.display.orientation}`,
      `Input: touch=${snapshot.input.touch}, hover=${snapshot.input.hover}, finePointer=${snapshot.input.finePointer}, coarsePointer=${snapshot.input.coarsePointer}`,
      `Network: ${snapshot.network.online ? "online" : "offline"}${snapshot.network.effectiveType ? `, ${snapshot.network.effectiveType}` : ""}`,
      `Performance: ${snapshot.power.effective} (${snapshot.power.preference})`,
      `Reduced motion: ${snapshot.power.reducedMotion}`,
      `Storage estimate available: ${snapshot.storage.estimateAvailable}`,
      `Display mode: ${snapshot.install.mode}`,
      `Install prompt available: ${snapshot.install.installable}`,
      `Service worker: supported=${snapshot.install.serviceWorkerSupported}, registered=${snapshot.install.serviceWorkerRegistered}, offlineCapable=${snapshot.install.offlineCapable}`,
      `Capabilities: ${Object.entries(snapshot.capabilities).filter(([, available]) => available).map(([name]) => name).join(", ") || "none reported"}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      return true;
    } catch {
      return false;
    }
  }, [snapshot]);

  const value = useMemo<SystemContextValue>(() => ({
    snapshot,
    promptInstall,
    requestNotifications,
    requestPersistentStorage,
    enterFullscreen,
    refreshStorage,
    copyDiagnostics,
  }), [copyDiagnostics, enterFullscreen, promptInstall, refreshStorage, requestNotifications, requestPersistentStorage, snapshot]);

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error("useSystem must be used inside SystemProvider.");
  return context;
}
