"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KioskDeviceProfile, KioskDisplayProfile } from "@/core/contracts/Kiosk";
import { CURRENT_KIOSK_SETUP_VERSION } from "@/core/contracts/Kiosk";
import { kioskProfileUrl, measureKioskDisplay } from "./kioskProfile";

interface Props { deviceId: string; children: React.ReactNode; }
export default function KioskDeviceSetupGate({ deviceId, children }: Props) {
  const [profile, setProfile] = useState<KioskDeviceProfile | null | undefined>(undefined);
  const [display, setDisplay] = useState<KioskDisplayProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const reportedDisplayRef = useRef("");
  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const load = async () => {
      try {
        const response = await fetch(kioskProfileUrl(), { credentials: "include", cache: "no-store" });
        const body = await response.json() as { profile?: KioskDeviceProfile | null; needsSetup?: boolean; errorCode?: string };
        if (!response.ok) throw new Error(`${body.errorCode ?? `PROFILE_AUTH_${response.status}`}`);
        if (!("profile" in body) || typeof body.needsSetup !== "boolean") throw new Error("PROFILE_RESPONSE_INVALID");
        if (!active) return;
        setProfile(body.profile ?? null);
        if (body.needsSetup) timer = window.setTimeout(() => void load(), 2000);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "PROFILE_REQUEST_FAILED"); }
    };
    void load();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, [deviceId, refreshKey]);

  useEffect(() => {
    if (profile === undefined) return;
    const setupProfile = profile ?? { deviceId, setupCompleted: false, setupVersion: 0, uiScale: 1, nightDimPreview: false, nightDimEnabled: true, nightDimStart: "20:00", nightDimEnd: "06:00", nightDimOpacity: 0.35 };
    const next = measureKioskDisplay(setupProfile.setupVersion);
    document.documentElement.dataset.kioskDensity = next.density;
    document.documentElement.dataset.kioskOrientation = next.orientation;
    document.documentElement.dataset.kioskTouch = String(next.touch);
    document.documentElement.style.setProperty("--kiosk-vw", `${next.viewportWidth}px`);
    document.documentElement.style.setProperty("--kiosk-vh", `${next.viewportHeight}px`);
    document.documentElement.style.setProperty("--kiosk-dpr", String(next.devicePixelRatio));
    document.documentElement.style.setProperty("--kiosk-ui-scale", String(setupProfile.uiScale ?? 1));
    const timer = window.setTimeout(() => setDisplay(next), 0);
    const reportKey = `${next.viewportWidth}x${next.viewportHeight}:${next.devicePixelRatio}:${next.orientation}:${next.touch}:${next.pointer}`;
    if (reportedDisplayRef.current !== reportKey) {
      reportedDisplayRef.current = reportKey;
      void fetch(kioskProfileUrl(), { method: "PATCH", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ display: next, reportedTimezone: next.timezone }) }).catch(() => undefined);
    }
    return () => {
      window.clearTimeout(timer);
      delete document.documentElement.dataset.kioskDensity;
      delete document.documentElement.dataset.kioskOrientation;
      delete document.documentElement.dataset.kioskTouch;
      document.documentElement.style.removeProperty("--kiosk-vw");
      document.documentElement.style.removeProperty("--kiosk-vh");
      document.documentElement.style.removeProperty("--kiosk-dpr");
      document.documentElement.style.removeProperty("--kiosk-ui-scale");
    };
  }, [deviceId, profile]);

  const refreshDisplay = useCallback(() => {
    if (profile === undefined) return;
    const next = measureKioskDisplay(profile?.setupVersion ?? 0);
    setDisplay(next);
    setChanged(Boolean(profile?.display && (Math.abs((profile.display.viewportWidth ?? 0) - next.viewportWidth) > 80 || Math.abs((profile.display.viewportHeight ?? 0) - next.viewportHeight) > 80 || profile.display.orientation !== next.orientation)));
  }, [profile]);
  useEffect(() => {
    if (!profile) return;
    const onResize = () => refreshDisplay();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); window.visualViewport?.removeEventListener("resize", onResize); };
  }, [profile, refreshDisplay]);

  if (error) return <SetupError message={error} onRetry={() => { setError(null); setRefreshKey((key) => key + 1); }} />;
  if (profile === undefined || !display) return <div className="grid min-h-[100dvh] place-items-center bg-[#030511] text-sm text-white/55">Preparing display setup…</div>;
  const setupProfile = profile ?? { deviceId, setupCompleted: false, setupVersion: 0, uiScale: 1, nightDimPreview: false, nightDimEnabled: true, nightDimStart: "20:00", nightDimEnd: "06:00", nightDimOpacity: 0.35 };
  if (setupProfile.setupCompleted && setupProfile.setupVersion >= CURRENT_KIOSK_SETUP_VERSION && !changed) return <>{children}</>;
  return <KioskSetupPreview profile={setupProfile} display={display} />;
}

function KioskSetupPreview({ profile, display }: { profile: KioskDeviceProfile; display: KioskDisplayProfile }) {
  const preview = profile.setupPreview ?? "normal";
  return <div className="kiosk-setup-preview fixed inset-0 overflow-hidden bg-[#030511] text-white" data-kiosk-setup-preview={preview} data-night-preview={profile.nightDimPreview}>
    {preview === "fit" ? <div className="absolute inset-3 border-2 border-cyan-200/75 sm:inset-6"><span className="absolute left-1 top-1 h-5 w-5 border-l-2 border-t-2 border-cyan-200"/><span className="absolute right-1 top-1 h-5 w-5 border-r-2 border-t-2 border-cyan-200"/><span className="absolute bottom-1 left-1 h-5 w-5 border-b-2 border-l-2 border-cyan-200"/><span className="absolute bottom-1 right-1 h-5 w-5 border-b-2 border-r-2 border-cyan-200"/><span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200"/></div> : null}
    <div className="relative z-10 grid h-full place-items-center p-6 text-center"><div><p className="text-xs uppercase tracking-[.35em] text-cyan-200/70">Cosmic OS</p><h1 className="mt-4 text-3xl font-semibold sm:text-5xl">{profile.deviceName ?? "This Cosmic Display"}</h1><p className="mt-3 text-sm uppercase tracking-[.24em] text-white/55">{preview === "fit" ? "Screen fit test" : preview === "normal" ? "Setting up this display" : `${preview} preview`}</p><p className="mt-5 text-sm text-white/45">Continue setup on your phone.</p><p className="mt-3 text-xs text-white/30">{display.viewportWidth} × {display.viewportHeight} · {display.density} · {display.orientation}</p></div></div>
    {profile.nightDimPreview ? <div className="pointer-events-none absolute inset-0 z-20 bg-black/[.35]" /> : null}
  </div>;
}

function SetupError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="grid min-h-[100dvh] place-items-center bg-[#030511] p-6 text-center"><div><p className="text-sm text-rose-200">Kiosk setup unavailable</p><p className="mt-2 text-xs uppercase tracking-[.18em] text-white/45">Code: {message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75">Retry</button></div></div>; }
