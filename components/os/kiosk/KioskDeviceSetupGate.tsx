"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSystem } from "@/components/os/system/SystemProvider";
import type { KioskDeviceProfile, KioskDisplayProfile } from "@/core/contracts/Kiosk";
import { CURRENT_KIOSK_SETUP_VERSION } from "@/core/contracts/Kiosk";
import { kioskProfileUrl, measureKioskDisplay } from "./kioskProfile";

interface Props { deviceId: string; children: React.ReactNode; }
type SetupStep = "welcome" | "fit" | "touch" | "location" | "time" | "hardware" | "appearance" | "review";
type KioskLocation = NonNullable<KioskDeviceProfile["location"]>;

export default function KioskDeviceSetupGate({ deviceId, children }: Props) {
  const [profile, setProfile] = useState<KioskDeviceProfile | null>(null);
  const [display, setDisplay] = useState<KioskDisplayProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    void fetch(kioskProfileUrl(), { credentials: "include", cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Kiosk setup profile is unavailable.");
      return response.json() as Promise<{ profile: KioskDeviceProfile }>;
    }).then((body) => { if (active) setProfile(body.profile); }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Kiosk setup profile is unavailable."); });
    return () => { active = false; };
  }, [deviceId, refreshKey]);

  useEffect(() => {
    if (!profile) return;
    const next = measureKioskDisplay(profile.setupVersion);
    document.documentElement.dataset.kioskDensity = next.density;
    document.documentElement.dataset.kioskOrientation = next.orientation;
    document.documentElement.dataset.kioskTouch = String(next.touch);
    document.documentElement.style.setProperty("--kiosk-vw", `${next.viewportWidth}px`);
    document.documentElement.style.setProperty("--kiosk-vh", `${next.viewportHeight}px`);
    document.documentElement.style.setProperty("--kiosk-dpr", String(next.devicePixelRatio));
    document.documentElement.style.setProperty("--kiosk-ui-scale", String(profile.uiScale ?? 1));
    const timer = window.setTimeout(() => setDisplay(next), 0);
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
  }, [profile]);

  const refreshDisplay = useCallback(() => {
    if (!profile) return;
    const next = measureKioskDisplay(profile.setupVersion);
    setDisplay(next);
    setChanged(Boolean(profile.display && (Math.abs((profile.display.viewportWidth ?? 0) - next.viewportWidth) > 80 || Math.abs((profile.display.viewportHeight ?? 0) - next.viewportHeight) > 80 || profile.display.orientation !== next.orientation)));
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
  if (!profile || !display) return <div className="grid min-h-[100dvh] place-items-center bg-[#030511] text-sm text-white/55">Preparing display setup…</div>;
  if (profile.setupCompleted && profile.setupVersion >= CURRENT_KIOSK_SETUP_VERSION && !changed) return <>{children}</>;
  return <KioskSetupWizard profile={profile} display={display} displayChanged={changed} onFinished={(next) => { setProfile(next); setChanged(false); }} />;
}

function KioskSetupWizard({ profile, display, displayChanged, onFinished }: { profile: KioskDeviceProfile; display: KioskDisplayProfile; displayChanged: boolean; onFinished: (profile: KioskDeviceProfile) => void }) {
  const system = useSystem();
  const [step, setStep] = useState<SetupStep>(displayChanged ? "fit" : "welcome");
  const [uiScale, setUiScale] = useState(1);
  const [location, setLocation] = useState<KioskLocation | null>(profile.location ?? null);
  const [locationState, setLocationState] = useState("Not requested");
  const [touchPoints, setTouchPoints] = useState<string[]>([]);
  const [gesture, setGesture] = useState<string[]>([]);
  const [nightDimEnabled, setNightDimEnabled] = useState(profile.nightDimEnabled);
  const [saving, setSaving] = useState(false);
  const timezone = profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const steps = useMemo<SetupStep[]>(() => ["welcome", "fit", "touch", "location", "time", "hardware", "appearance", "review"], []);
  const stepIndex = steps.indexOf(step);
  const next = () => setStep(steps[Math.min(steps.length - 1, stepIndex + 1)]);
  const previous = () => setStep(steps[Math.max(0, stepIndex - 1)]);
  const detectLocation = () => {
    if (!navigator.geolocation) { setLocationState("Location services unavailable"); return; }
    setLocationState("Detecting…");
    navigator.geolocation.getCurrentPosition((position) => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, source: "detected" }); setLocationState("Location found"); }, () => setLocationState("Permission unavailable"), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  };
  const finish = async () => {
    setSaving(true);
    try {
      const response = await fetch(kioskProfileUrl(), { method: "PATCH", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setupCompleted: true, setupVersion: CURRENT_KIOSK_SETUP_VERSION, display: { ...display, setupVersion: CURRENT_KIOSK_SETUP_VERSION }, timezone, clockFormat: "12h", location, nightDimEnabled, nightDimStart: profile.nightDimStart, nightDimEnd: profile.nightDimEnd, nightDimOpacity: profile.nightDimOpacity, uiScale }) });
      const body = await response.json() as { profile?: KioskDeviceProfile; error?: string };
      if (!response.ok || !body.profile) throw new Error(body.error ?? "Could not save display setup.");
      onFinished(body.profile);
    } catch (caught) { setLocationState(caught instanceof Error ? caught.message : "Could not save display setup."); } finally { setSaving(false); }
  };
  const touchTest = (event: React.PointerEvent<HTMLButtonElement>) => setTouchPoints((current) => [...new Set([...current, event.currentTarget.dataset.corner ?? "center"]) ]);
  return <div className="kiosk-setup fixed inset-0 z-[100] overflow-hidden bg-[#030511] text-white" style={{ "--kiosk-ui-scale": uiScale } as React.CSSProperties}>
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4 sm:px-8 sm:py-7">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-3"><div><p className="text-[.6rem] uppercase tracking-[.3em] text-cyan-200/65">Cosmic OS</p><h1 className="mt-1 text-xl font-semibold">Display setup</h1></div><p className="text-xs text-white/45">Step {stepIndex + 1} of {steps.length}</p></header>
      <main className="min-h-0 flex-1 overflow-hidden py-4">{step === "welcome" && <SetupPanel title="Welcome to Cosmic" description="Let’s tune this registered display to its actual screen and available input." body={<div className="grid gap-3 sm:grid-cols-2"><Metric label="Viewport" value={`${display.viewportWidth} × ${display.viewportHeight}`} /><Metric label="Mode" value={`${display.density} ${display.orientation}`} /><Metric label="Pixel ratio" value={`${display.devicePixelRatio}x`} /><Metric label="Pointer" value={display.pointer} /></div>} />}{step === "fit" && <SetupPanel title="Screen fit" description="Cosmic uses the actual browser viewport. Can you see all four corners?" body={<div className="relative h-[min(52vh,280px)] overflow-hidden rounded-xl border-2 border-cyan-200/70 bg-white/[.02]"><span className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-200"/><span className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-cyan-200"/><span className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-cyan-200"/><span className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-200"/><span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200"/><p className="absolute inset-x-0 top-1/2 text-center text-xs uppercase tracking-[.25em] text-white/40">{display.overflowX || display.overflowY ? "Cosmic does not currently fit this display." : "All viewport edges detected"}</p></div>} />}{step === "touch" && <SetupPanel title="Touch and swipe test" description={display.touch ? "Tap each target, then swipe left and right to validate kiosk input." : "No touchscreen detected. Cosmic will use automatic rotation and connected input devices."} body={<div className="grid gap-3"><div className="relative h-40 rounded-xl border border-white/10">{["top-left", "top-right", "bottom-left", "bottom-right", "center"].map((corner) => <button key={corner} data-corner={corner} type="button" onPointerDown={touchTest} className={`absolute size-9 rounded-full border border-cyan-200/50 bg-cyan-200/15 text-[0] ${corner === "top-left" ? "left-3 top-3" : corner === "top-right" ? "right-3 top-3" : corner === "bottom-left" ? "bottom-3 left-3" : corner === "bottom-right" ? "bottom-3 right-3" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"}`}>Target</button>)}</div><p className="text-xs text-white/55">Targets reached: {touchPoints.length}/5 · Swipe left: {gesture.includes("left") ? "ready" : "pending"} · Swipe right: {gesture.includes("right") ? "ready" : "pending"}</p><div onPointerDown={(event) => { const start = event.clientX; const move = (nextEvent: PointerEvent) => { const direction = nextEvent.clientX < start ? "left" : "right"; if (Math.abs(nextEvent.clientX - start) > 50) setGesture((current) => [...new Set([...current, direction])]); }; window.addEventListener("pointerup", move, { once: true }); }} className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-center text-xs text-white/45">Swipe here to test navigation</div></div>} />}{step === "location" && <SetupPanel title="Location" description="Weather can use this kiosk’s location instead of the account default." body={<div><p className="text-sm text-white/70">{locationState}</p>{location ? <p className="mt-2 text-xs text-cyan-100/60">{location.source === "detected" ? "Detected location selected." : "Device location selected."}</p> : null}<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={detectLocation} className="rounded-lg border border-cyan-200/25 px-3 py-2 text-sm">Use detected location</button><button type="button" onClick={() => { setLocation(null); setLocationState("Account/default provider location"); }} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/65">Use account default</button></div></div>} />}{step === "time" && <SetupPanel title="Time and timezone" description="The browser timezone is the default; the saved value is an IANA timezone name." body={<div className="grid gap-3 sm:grid-cols-2"><Metric label="Timezone" value={timezone} /><Metric label="Current local time" value={new Intl.DateTimeFormat(undefined, { timeZone: timezone, hour: "numeric", minute: "2-digit" }).format(new Date())} /></div>} />}{step === "hardware" && <SetupPanel title="Hardware capabilities" description="Missing hardware is not an error and will not block setup." body={<div className="grid gap-2 sm:grid-cols-2"><Capability label="Location" value={Boolean(navigator.geolocation)} /><Capability label="Touch" value={display.touch} /><Capability label="Microphone" value={system.snapshot.capabilities.microphone} /><Capability label="Camera" value={system.snapshot.capabilities.camera} /><Capability label="Audio output" value={"mediaDevices" in navigator ? "Available / unknown" : "Unknown"} /></div>} />}{step === "appearance" && <SetupPanel title="Appearance" description="These settings are saved for this registered display; existing defaults remain the fallback." body={<div className="grid gap-4"><label className="flex items-center justify-between gap-3 text-sm"><span>Night dimming · 8:00 PM–6:00 AM</span><input type="checkbox" checked={nightDimEnabled} onChange={(event) => setNightDimEnabled(event.target.checked)} /></label><label className="text-sm text-white/70">UI size <select value={uiScale} onChange={(event) => setUiScale(Number(event.target.value))} className="ml-3 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-white"><option value={0.9}>Smaller</option><option value={1}>Default</option><option value={1.05}>Larger</option></select></label></div>} />}{step === "review" && <SetupPanel title="Cosmic display ready" description="Review the profile before entering the normal slideshow." body={<div className="grid gap-2 sm:grid-cols-2"><Metric label="Display" value={`${display.viewportWidth} × ${display.viewportHeight}`} /><Metric label="Mode" value={`${display.density} ${display.orientation}`} /><Metric label="Touch" value={display.touch ? "Ready" : "Not detected"} /><Metric label="Timezone" value={timezone} /><Metric label="Location" value={location ? location.source : "Account default"} /><Metric label="Night mode" value={nightDimEnabled ? "8 PM – 6 AM" : "Disabled"} /><Metric label="UI size" value={uiScale === 1 ? "Default" : String(uiScale)} /></div>} />}</main>
      <footer className="flex items-center justify-between gap-3 border-t border-white/10 pt-3"><button type="button" onClick={previous} disabled={stepIndex === 0 || saving} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/65 disabled:opacity-30">Back</button>{step === "review" ? <button type="button" onClick={() => void finish()} disabled={saving} className="rounded-lg bg-cyan-100 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving…" : "Finish setup"}</button> : <button type="button" onClick={next} className="rounded-lg bg-cyan-100 px-4 py-2 text-sm font-semibold text-slate-950">Continue</button>}</footer>
    </div>
  </div>;
}

function SetupPanel({ title, description, body }: { title: string; description: string; body: React.ReactNode }) { return <section className="mx-auto flex h-full max-w-3xl flex-col justify-center"><h2 className="text-2xl font-semibold sm:text-4xl">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{description}</p><div className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:p-6">{body}</div></section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[.58rem] uppercase tracking-[.2em] text-white/40">{label}</p><p className="mt-1 truncate text-sm text-white/85">{value}</p></div>; }
function Capability({ label, value }: { label: string; value: boolean | string }) { return <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm"><span>{label}</span><span className={value === true || String(value).startsWith("Available") ? "text-emerald-200" : "text-white/45"}>{value === true ? "Available" : value === false ? "Not detected" : value}</span></div>; }
function SetupError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="grid min-h-[100dvh] place-items-center bg-[#030511] p-6 text-center"><div><p className="text-sm text-rose-200">{message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75">Retry</button></div></div>; }
