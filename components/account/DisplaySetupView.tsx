"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCosmicAccount } from "./AccountProvider";
import type { KioskDeviceProfile, KioskDisplayProfile, KioskSetupPreview } from "@/core/contracts/Kiosk";
import { CURRENT_KIOSK_SETUP_VERSION } from "@/core/contracts/Kiosk";

const baseProfile = (deviceId: string): KioskDeviceProfile => ({ deviceId, setupCompleted: false, setupVersion: 0, uiScale: 1, nightDimPreview: false, nightDimEnabled: true, nightDimStart: "20:00", nightDimEnd: "06:00", nightDimOpacity: 0.35 });
type ConnectionStatus = { configured: boolean; connected: boolean; status: string; provider: string; detail: string };
type ProviderConnectionRecord = { provider?: string; status?: string; reconnectRequired?: boolean; displayName?: string | null };
type ConnectionPayload = { connections?: ProviderConnectionRecord[]; error?: string };
type ConnectionLoadState = "loading" | "ready" | "error";
const setupConnectionProviders = ["Calendar", "Spotify", "Gmail"] as const;
function normalizeConnectionProvider(value?: string) { const normalized = value?.trim().toLowerCase().replace(/[\s_-]+/g, ""); return normalized === "spotify" || normalized === "spotifymusic" || normalized === "music" ? "spotify" : normalized === "gmail" || normalized === "googlemail" ? "gmail" : normalized === "calendar" || normalized === "caldav" ? "calendar" : normalized; }
type SetupStep = "welcome" | "display" | "fit" | "location" | "timezone" | "connections" | "hardware" | "night" | "preview" | "review";
const steps: SetupStep[] = ["welcome", "display", "fit", "location", "timezone", "connections", "hardware", "night", "preview", "review"];
const stepLabel: Record<SetupStep, string> = { welcome: "Welcome", display: "Display", fit: "Screen fit", location: "Location", timezone: "Time zone", connections: "Connections", hardware: "Hardware", night: "Night mode", preview: "Preview", review: "Review" };
function validStep(value: string | null): value is SetupStep { return value !== null && steps.includes(value as SetupStep); }

export default function DisplaySetupView({ deviceId }: { deviceId: string }) {
  const { loading, account } = useCosmicAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<KioskDeviceProfile | null>(null);
  const [display, setDisplay] = useState<KioskDisplayProfile | null>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [location, setLocation] = useState<KioskDeviceProfile["location"] | null>(null);
  const [status, setStatus] = useState("Loading display profile…");
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [nightPreview, setNightPreview] = useState(false);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [connectionLoadState, setConnectionLoadState] = useState<ConnectionLoadState>("loading");
  const fallback = useMemo(() => baseProfile(deviceId), [deviceId]);
  const initialStep = searchParams.get("step");
  const [step, setStep] = useState<SetupStep>(() => validStep(initialStep) ? initialStep : "welcome");
  const url = `/api/devices/kiosk-profile?deviceId=${encodeURIComponent(deviceId)}`;

  const load = useCallback(async () => { if (!deviceId) return; try { const response = await fetch(url, { credentials: "include", cache: "no-store" }); const body = await response.json() as { profile?: KioskDeviceProfile | null; error?: string }; if (!response.ok || !body.profile && body.profile !== null) throw new Error(body.error ?? "Display setup is unavailable."); const next = body.profile ?? fallback; setProfile(next); setDisplay(next.display ?? null); setName(next.deviceName ?? ""); setTimezone(next.timezoneOverride ?? ""); setLocation(next.location ?? null); setNightPreview(next.nightDimPreview); setStatus("Connected to display"); } catch (error) { setStatus(error instanceof Error ? error.message : "Display setup is unavailable."); } }, [deviceId, fallback, url]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!profile?.setupCompleted) { const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); } return undefined; }, [load, profile?.setupCompleted]);
  const loadConnections = useCallback(async () => {
    setConnectionLoadState("loading");
    if (process.env.NODE_ENV === "development") console.info("[setup-connections] request-start");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("/api/account/connections", { credentials: "include", cache: "no-store", signal: controller.signal });
      if (process.env.NODE_ENV === "development") console.info(`[setup-connections] response status=${response.status}`);
      const body = await response.json().catch(() => ({})) as ConnectionPayload;
      if (!response.ok) throw new Error(body.error ?? "Connection status is temporarily unavailable.");
      const records = Array.isArray(body.connections) ? body.connections : [];
      const normalized = setupConnectionProviders.map((provider) => {
        const record = records.find((item) => normalizeConnectionProvider(item.provider) === normalizeConnectionProvider(provider));
        const reconnectRequired = Boolean(record?.reconnectRequired);
        const connected = Boolean(record && record.status?.toLowerCase() === "connected" && !reconnectRequired);
        return { configured: true, connected, status: reconnectRequired ? "reconnect-required" : connected ? "connected" : "disconnected", provider, detail: record?.displayName ?? (connected ? "Connected account" : reconnectRequired ? "Reconnect required" : "Ready to connect") };
      });
      setConnections(normalized);
      setConnectionLoadState("ready");
      if (process.env.NODE_ENV === "development") console.info("[setup-connections] ready");
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError" ? "Connection status request timed out." : error instanceof Error ? error.message : "Connection status is temporarily unavailable.";
      setConnectionLoadState("error");
      if (process.env.NODE_ENV === "development") console.info(`[setup-connections] error=${message}`);
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);
  useEffect(() => { const onFocus = () => void loadConnections(); window.addEventListener("focus", onFocus); const timer = window.setTimeout(() => void loadConnections(), 0); return () => { window.clearTimeout(timer); window.removeEventListener("focus", onFocus); }; }, [loadConnections]);

  async function save(input: Record<string, unknown>, message = "Saved · display updating…") { setSaving(true); setStatus(message); try { const response = await fetch(url, { method: "PATCH", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); const body = await response.json() as { profile?: KioskDeviceProfile; error?: string }; if (!response.ok || !body.profile) throw new Error(body.error ?? "Could not update display."); setProfile(body.profile); setDisplay(body.profile.display ?? display); setStatus("Saved · display updating…"); return true; } catch (error) { setStatus(error instanceof Error ? error.message : "Could not update display."); return false; } finally { setSaving(false); } }
  function go(next: SetupStep) { setStep(next); router.replace(`/activate/setup?deviceId=${encodeURIComponent(deviceId)}&step=${next}`); }
  function nextStep() { go(steps[Math.min(steps.length - 1, steps.indexOf(step) + 1)]); }
  function previousStep() { go(steps[Math.max(0, steps.indexOf(step) - 1)]); }
  function choosePhoneLocation() { if (!navigator.geolocation) { setStatus("Phone location is unavailable."); return; } setStatus("Detecting phone location…"); navigator.geolocation.getCurrentPosition((position) => { const next = { latitude: position.coords.latitude, longitude: position.coords.longitude, source: "manual" as const, label: "Phone location" }; setLocation(next); void save({ location: next }, "Phone location selected · display updating…"); }, () => setStatus("Phone location permission unavailable."), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }); }
  function timezoneLabel(value?: string) { if (!value) return "Unknown time zone"; try { return new Intl.DateTimeFormat("en-US", { timeZone: value, timeZoneName: "long" }).formatToParts(new Date()).find((part) => part.type === "timeZoneName")?.value ?? value; } catch { return value; } }
  function displayTime(value?: string) { if (!value) return "Time zone not detected"; try { return new Intl.DateTimeFormat("en-US", { timeZone: value, hour: "numeric", minute: "2-digit" }).format(new Date()); } catch { return "Time zone could not be detected"; } }
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#030511] text-white/60">Checking Cosmic account…</main>;
  if (!account || !deviceId) return <main className="grid min-h-screen place-items-center bg-[#030511] p-6 text-center text-white/65">Sign in through Cosmic activation before configuring a display.</main>;
  const current = profile ?? fallback;
  const reported = display ?? current.display;
  const reportedTimezone = current.reportedTimezone ?? reported?.timezone;
  const effectiveTimezone = current.effectiveTimezone ?? current.timezone ?? reportedTimezone ?? current.location?.timezone;
  const locationLabel = current.location?.label ?? "Not configured";
  const setupReturn = `/activate/setup?deviceId=${encodeURIComponent(deviceId)}&step=connections`;
  const providerRows = connections;
  const accountConnectionsLink = `/account?returnTo=${encodeURIComponent(setupReturn)}`;
  const connectedProviders = providerRows.filter((item) => item.connected);
  const unconfiguredProviders = providerRows.filter((item) => !item.connected);
  if (finished) return <main className="grid min-h-screen place-items-center bg-[#030511] p-6 text-center text-white"><div><p className="text-xs uppercase tracking-[.3em] text-cyan-200/65">Cosmic OS</p><h1 className="mt-4 text-3xl font-semibold">COSMIC DISPLAY READY</h1><p className="mt-3 text-white/65">{name.trim() || "Your display"} is ready.</p><p className="mt-2 text-sm text-white/40">You can close this tab.</p></div></main>;
  const renderStep = () => {
    if (step === "display") return <Panel title="DISPLAY DETECTED"><div className="grid grid-cols-2 gap-2"><Metric label="Viewport" value={reported ? `${reported.viewportWidth} × ${reported.viewportHeight}` : "Waiting for kiosk"}/><Metric label="Mode" value={reported ? `${reported.orientation} · ${reported.density}` : "—"}/><Metric label="Pixel ratio" value={reported ? `${reported.devicePixelRatio}x` : "—"}/><Metric label="Touch" value={reported?.touch ? "Detected" : "Not detected"}/></div></Panel>;
    if (step === "fit") return <Panel title="SCREEN FIT"><p className="text-sm text-white/55">Use the display preview to confirm all four corners are visible.</p><div className="mt-4 flex gap-2"><Button disabled={saving} onClick={() => void save({ setupPreview: "fit" as KioskSetupPreview })}>Test fit</Button><Button disabled={saving} onClick={() => void save({ setupPreview: "normal" as KioskSetupPreview })}>Return to setup</Button></div></Panel>;
    if (step === "location") return <Panel title="LOCATION"><LocationChoice title="DISPLAY LOCATION" label={current.reportedLocation?.label ?? "Not detected"} source="Detected from Cosmic display" onSelect={() => current.reportedLocation && void save({ location: { ...current.reportedLocation, source: "detected" } })}/><LocationChoice title="ACCOUNT DEFAULT" label="Not configured" source="Saved to your account" onSelect={() => void save({ location: null })}/><LocationChoice title="PHONE LOCATION" label={location?.source === "manual" ? location.label ?? "Resolved phone location" : "Not detected yet"} source="Current phone location" onSelect={choosePhoneLocation}/>{location ? <p className="mt-4 text-sm text-cyan-100/75">SELECTED LOCATION · {location.label ?? "Resolved location"}</p> : <p className="mt-4 text-sm text-white/45">No configured location. Choose an option above or continue.</p>}</Panel>;
    if (step === "timezone") return <Panel title="TIME ZONE"><p className="text-xs uppercase tracking-[.18em] text-white/45">DISPLAY-REPORTED TIMEZONE</p><p className="mt-2 text-sm text-white/85">{reportedTimezone ? `${timezoneLabel(reportedTimezone)} · ${reportedTimezone}` : "Display timezone not detected"}</p><p className="mt-4 text-xs uppercase tracking-[.18em] text-white/45">CURRENT DISPLAY TIME</p><p className="mt-2 text-2xl text-white/90">{displayTime(effectiveTimezone)}</p><input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="America/Denver" className="mt-4 w-full rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-sm text-white"/><Button disabled={saving || !timezone.trim()} onClick={() => void save({ timezoneOverride: timezone.trim() })}>Save manual override</Button></Panel>;
    if (step === "connections") return <Panel title="ACCOUNT CONNECTIONS"><p className="text-sm text-white/55">Services connected to your Cosmic profile will automatically be available on this display.</p>{connectionLoadState === "loading" ? <p className="mt-4 rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-white/45">Checking connection status…</p> : connectionLoadState === "error" ? <div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.04] px-3 py-4 text-sm text-amber-50/75"><p>Connections couldn&apos;t be checked right now.</p><p className="mt-1 text-xs text-white/45">You can continue setup and connect services later.</p><button type="button" onClick={() => void loadConnections()} className="mt-3 rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-50">Retry</button></div> : <div className="mt-4 space-y-4"><ConnectionGroup title="CONNECTED TO YOUR PROFILE" providers={connectedProviders} connected /><ConnectionGroup title="NOT CONFIGURED" providers={unconfiguredProviders} /><a href={accountConnectionsLink} className="block w-full rounded-xl border border-cyan-200/20 bg-cyan-200/[.08] px-3 py-3 text-center text-sm font-medium text-cyan-50">Manage account connections</a><p className="text-xs text-white/40">These services haven&apos;t been connected to your Cosmic profile yet. You can add them in Account Settings or continue without them.</p></div>}</Panel>;
    if (step === "hardware") return <Panel title="HARDWARE"><div className="grid gap-2"><Metric label="Touchscreen" value={reported?.touch ? "Detected" : "Not detected"}/><Metric label="Microphone" value="Not connected · optional"/><Metric label="Camera" value="Not connected · optional"/><Metric label="Audio" value="Available / unknown"/></div><p className="mt-4 text-sm text-white/50">Cosmic works without any of these.</p></Panel>;
    if (step === "night") return <Panel title="NIGHT MODE"><label className="flex items-center justify-between text-sm"><span>Enable night dimming</span><input type="checkbox" checked={current.nightDimEnabled} onChange={(event) => void save({ nightDimEnabled: event.target.checked })}/></label><div className="mt-4 grid grid-cols-2 gap-2"><input type="time" value={current.nightDimStart} onChange={(event) => void save({ nightDimStart: event.target.value })} className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-white"/><input type="time" value={current.nightDimEnd} onChange={(event) => void save({ nightDimEnd: event.target.value })} className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-white"/></div><div className="flex gap-2"><Button disabled={saving} onClick={() => { setNightPreview(true); void save({ nightDimPreview: true }); }}>Preview night mode</Button><Button disabled={saving} onClick={() => { setNightPreview(false); void save({ nightDimPreview: false, setupPreview: "normal" }); }}>End preview</Button></div>{nightPreview ? <p className="text-xs text-violet-200/70">Night preview active on display.</p> : null}</Panel>;
    if (step === "preview") return <Panel title="PREVIEW"><p className="text-sm text-white/55">Show one real kiosk scene. The slideshow remains paused until setup is finished.</p><div className="mt-4 grid grid-cols-3 gap-2">{(["clock", "weather", "calendar"] as KioskSetupPreview[]).map((preview) => <Button key={preview} disabled={saving} onClick={() => void save({ setupPreview: preview })}>{preview}</Button>)}</div><Button disabled={saving} onClick={() => void save({ setupPreview: "normal" })}>Return to setup</Button></Panel>;
    if (step === "review") return <Panel title="REVIEW"><div className="grid gap-2"><Metric label="Display" value={name.trim() || "Cosmic Display"}/><Metric label="Screen" value={reported ? `${reported.viewportWidth} × ${reported.viewportHeight} · ${reported.density}` : "Waiting"}/><Metric label="Location" value={locationLabel}/><Metric label="Timezone" value={effectiveTimezone ?? "Manual setup needed"}/><Metric label="Connections" value={providerRows.filter((item) => item.connected).map((item) => `${item.provider} ✓`).join(" · ") || "None connected"}/><Metric label="Night dim" value={current.nightDimEnabled ? `${current.nightDimStart} – ${current.nightDimEnd} · ${Math.round(current.nightDimOpacity * 100)}%` : "Disabled"}/></div><Button disabled={saving} onClick={async () => { const saved = await save({ deviceName: name.trim() || undefined, setupCompleted: true, setupVersion: CURRENT_KIOSK_SETUP_VERSION, setupPreview: "normal", nightDimPreview: false }); if (saved) { setFinished(true); window.setTimeout(() => { window.close(); window.setTimeout(() => router.replace("/activate/setup/complete"), 250); }, 1500); } }}>Finish setup</Button></Panel>;
    return <Panel title="COSMIC DISPLAY SETUP"><label className="block text-sm text-white/65">Display name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Bedroom Cosmic" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-white"/></label><p className="text-sm text-white/50">Everything on this display is controlled from your phone.</p><Button disabled={saving} onClick={() => void save({ deviceName: name.trim() })}>Save name</Button></Panel>;
  };
  return <main className="min-h-screen bg-[#030511] px-4 py-5 text-white"><div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-xl flex-col"><header><p className="text-[.65rem] uppercase tracking-[.3em] text-cyan-200/65">Cosmic OS · display setup</p><div className="mt-3 flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{stepLabel[step]}</h1><span className="text-xs text-white/45">Step {steps.indexOf(step) + 1} of {steps.length}</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-200/80 transition-all" style={{ width: `${((steps.indexOf(step) + 1) / steps.length) * 100}%` }}/></div></header><p className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-200/[.05] px-3 py-2 text-xs text-cyan-50/75">{status}</p><section className="mt-5 flex-1">{renderStep()}</section><nav className="sticky bottom-0 mt-5 flex items-center justify-between gap-3 border-t border-white/10 bg-[#030511]/95 py-4 backdrop-blur"><Button disabled={step === "welcome" || saving} onClick={previousStep}>Back</Button><Button disabled={saving || step === "review"} onClick={nextStep}>Next</Button></nav></div></main>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 shadow-xl"><h2 className="text-sm font-semibold uppercase tracking-[.16em] text-white/80">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[.6rem] uppercase tracking-[.16em] text-white/40">{label}</p><p className="mt-1 truncate text-sm text-white/80">{value}</p></div>; }
function Button({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className="rounded-xl border border-cyan-200/20 bg-cyan-200/[.08] px-3 py-2.5 text-sm font-medium text-cyan-50 disabled:opacity-40">{children}</button>; }
function LocationChoice({ title, label, source, onSelect }: { title: string; label: string; source: string; onSelect: () => void }) { return <button type="button" onClick={onSelect} className="block w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-left transition hover:border-cyan-200/30"><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-200/65">{title}</p><p className="mt-1 text-sm font-medium text-white/85">{label}</p><p className="mt-1 text-xs text-white/45">{source}</p></button>; }
function ConnectionGroup({ title, providers, connected = false }: { title: string; providers: ConnectionStatus[]; connected?: boolean }) { return <section><p className="text-[.65rem] font-semibold uppercase tracking-[.18em] text-white/45">{title}</p>{providers.length ? <div className="mt-2 space-y-2">{providers.map((item) => <div key={item.provider} className="rounded-xl border border-white/10 px-3 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white/85">{item.provider}</p><span className={connected ? "text-sm text-emerald-200" : "text-xs text-white/45"}>{connected ? "✓ Connected" : "Not connected to your Cosmic profile"}</span></div><p className="mt-1 text-xs text-white/45">{connected ? "Available on this kiosk" : "Add this later in Account Settings"}</p></div>)}</div> : <p className="mt-2 text-sm text-white/45">None</p>}</section>; }
