"use client";

import { useEffect, useState } from "react";
import { DEFAULT_KIOSK_ENABLED_SLIDES, KIOSK_SLIDE_ORDER, type KioskSlideId } from "@/core/contracts/Kiosk";

type Device = { id: string; publicNumber: string; name: string; type: string; lastSeenAt: string; revokedAt: string | null };
type ControlState = { paused: boolean; pauseReason: "manual" | "music-playing" | "preview" | null; currentSlide: string | null; holdMusicWhilePlaying: boolean; enabledSlides: KioskSlideId[] };

const labels: Record<KioskSlideId, string> = {
  clock: "Clock",
  calendar: "Personal Calendar",
  "school-calendar": "School Calendar",
  sports: "Sports",
  music: "Music",
  garage: "Garage",
  notes: "Notes",
  tasks: "Tasks",
  cosmic: "Cosmic AI",
  system: "System",
};

export default function ConnectedDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [control, setControl] = useState<ControlState | null>(null);

  useEffect(() => {
    void fetch("/api/account/devices", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ devices?: Device[]; error?: string }>)
      .then((body) => { if (body.devices) setDevices(body.devices); else setError(body.error ?? "Unavailable"); })
      .catch(() => setError("Unavailable"));
  }, []);

  async function revoke(id: string, name: string) {
    if (!window.confirm(`Prepare ${name} for a new owner? This signs out the display and clears its kiosk profile.`)) return;
    const response = await fetch("/api/account/devices", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ deviceId: id }) });
    if (response.ok) {
      setDevices((current) => current.filter((device) => device.id !== id));
      if (selectedDeviceId === id) { setSelectedDeviceId(null); setControl(null); }
    }
  }

  useEffect(() => {
    if (!selectedDeviceId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/devices/kiosk-control?deviceId=${encodeURIComponent(selectedDeviceId)}`, { cache: "no-store", credentials: "include" });
        if (!response.ok || cancelled) return;
        const state = await response.json() as ControlState;
        setControl({ ...state, enabledSlides: state.enabledSlides?.length ? state.enabledSlides : [...DEFAULT_KIOSK_ENABLED_SLIDES] });
      } catch { /* Control polling is best effort. */ }
    };
    void load();
    const interval = window.setInterval(() => void load(), 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [selectedDeviceId]);

  async function command(action: "pause" | "resume" | "next" | "previous" | "set-hold", holdMusicWhilePlaying?: boolean) {
    if (!selectedDeviceId) return;
    const response = await fetch("/api/devices/kiosk-control", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ deviceId: selectedDeviceId, action, ...(typeof holdMusicWhilePlaying === "boolean" ? { holdMusicWhilePlaying } : {}) }) });
    if (response.ok) setControl(await response.json() as ControlState);
  }

  async function setSlideEnabled(slide: KioskSlideId, enabled: boolean) {
    if (!selectedDeviceId || !control) return;
    const enabledSlides = KIOSK_SLIDE_ORDER.filter((id) => id === slide ? enabled : control.enabledSlides.includes(id));
    setControl((current) => current ? { ...current, enabledSlides } : current);
    const response = await fetch("/api/devices/kiosk-control", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ deviceId: selectedDeviceId, action: "set-slides", enabledSlides }) });
    if (response.ok) setControl(await response.json() as ControlState);
  }

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId && !device.revokedAt);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/55">Kiosk control</p>
        <h2 className="mt-1 text-xl font-semibold text-white/90">Connected displays</h2>
        <p className="mt-1 text-sm text-white/45">Choose which Cosmos scenes each kiosk rotates through. Slides advance every two minutes.</p>
      </div>

      {error ? <p className="mt-4 text-sm text-white/40">{error}</p> : devices.length === 0 ? <p className="mt-4 text-sm text-white/45">No connected displays.</p> : (
        <div className="mt-4 space-y-3">
          {devices.map((device) => (
            <div key={device.id} className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-white/85">{device.name}</p>
                  <p className="text-xs text-cyan-100/60">{device.publicNumber}</p>
                  <p className="mt-1 text-xs text-white/35">{device.type} · Last seen {new Date(device.lastSeenAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-100" onClick={() => setSelectedDeviceId((current) => current === device.id ? null : device.id)}>{selectedDeviceId === device.id ? "Hide controls" : "Configure kiosk"}</button>
                  <button type="button" className="rounded-lg border border-rose-200/20 px-3 py-2 text-xs text-white/70" onClick={() => void revoke(device.id, device.name)}>Prepare for new owner</button>
                </div>
              </div>

              {selectedDevice?.id === device.id && control ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">{labels[control.currentSlide as KioskSlideId] ?? control.currentSlide ?? "Cosmos kiosk"} · {control.paused ? `Paused${control.pauseReason === "music-playing" ? " while music plays" : ""}` : "Playing"}</p>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => void command("previous")}>Previous</button>
                      <button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => void command(control.paused ? "resume" : "pause")}>{control.paused ? "Resume" : "Pause"}</button>
                      <button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => void command("next")}>Next</button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {KIOSK_SLIDE_ORDER.map((slide, index) => (
                      <label key={slide} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-xs text-white/70">
                        <span><span className="mr-2 text-white/25">{index + 1}</span>{labels[slide]}</span>
                        <input type="checkbox" checked={control.enabledSlides.includes(slide)} onChange={(event) => void setSlideEnabled(slide, event.target.checked)} />
                      </label>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-white/35">Rotation order is fixed: Clock starts the cycle and System ends it. Disabled slides are skipped.</p>
                  <label className="mt-3 flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={control.holdMusicWhilePlaying} onChange={(event) => void command("set-hold", event.target.checked)} /> Pause slideshow while music is playing</label>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
