"use client";

import { useEffect, useState } from "react";

type Device = { id: string; name: string; type: string; lastSeenAt: string; revokedAt: string | null };
type ControlState = { paused: boolean; pauseReason: "manual" | "music-playing" | "preview" | null; currentSlide: string | null; holdMusicWhilePlaying: boolean };

export default function ConnectedDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [control, setControl] = useState<ControlState | null>(null);
  useEffect(() => { void fetch("/api/account/devices", { cache: "no-store" }).then((response) => response.json() as Promise<{ devices?: Device[]; error?: string }>).then((body) => { if (body.devices) setDevices(body.devices); else setError(body.error ?? "Unavailable"); }).catch(() => setError("Unavailable")); }, []);
  async function revoke(id: string) { const response = await fetch("/api/account/devices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: id }) }); if (response.ok) { setDevices((current) => current.filter((device) => device.id !== id)); if (selectedDeviceId === id) { setSelectedDeviceId(null); setControl(null); } } }
  useEffect(() => {
    if (!selectedDeviceId) return;
    let cancelled = false;
    const load = async () => { try { const response = await fetch(`/api/devices/kiosk-control?deviceId=${encodeURIComponent(selectedDeviceId)}`, { cache: "no-store", credentials: "include" }); if (!response.ok || cancelled) return; setControl(await response.json() as ControlState); } catch { /* Control polling is best effort. */ } };
    void load();
    const interval = window.setInterval(() => void load(), 1500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [selectedDeviceId]);
  async function command(action: "pause" | "resume" | "next" | "previous" | "set-hold", holdMusicWhilePlaying?: boolean) { if (!selectedDeviceId) return; const response = await fetch("/api/devices/kiosk-control", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ deviceId: selectedDeviceId, action, ...(typeof holdMusicWhilePlaying === "boolean" ? { holdMusicWhilePlaying } : {}) }) }); if (response.ok) setControl(await response.json() as ControlState); }
  const selectedDevice = devices.find((device) => device.id === selectedDeviceId && !device.revokedAt);
  return <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="font-semibold text-white/85">Connected devices</h2>{error ? <p className="mt-2 text-sm text-white/40">{error}</p> : devices.length === 0 ? <p className="mt-2 text-sm text-white/45">No connected displays.</p> : <div className="mt-3 space-y-3">{devices.map((device) => <div key={device.id} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-white/80">{device.name}</p><p className="text-xs text-white/40">{device.type} · Last seen {new Date(device.lastSeenAt).toLocaleString()}</p></div><div className="flex gap-2"><button type="button" className="rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-100" onClick={() => setSelectedDeviceId((current) => current === device.id ? null : device.id)}>{selectedDeviceId === device.id ? "Hide control" : "Control"}</button><button type="button" className="rounded-lg border border-rose-200/20 px-3 py-2 text-xs text-white/80" onClick={() => void revoke(device.id)}>Delete</button></div></div>{selectedDevice?.id === device.id && control ? <div className="mt-3 border-t border-white/10 pt-3"><p className="text-xs uppercase tracking-[0.16em] text-white/45">{control.currentSlide ?? "Cosmic kiosk"} · {control.paused ? `Paused${control.pauseReason === "music-playing" ? " while music plays" : ""}` : "Playing"}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => void command("previous")}>Previous</button><button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => void command(control.paused ? "resume" : "pause")}>{control.paused ? "Resume" : "Pause"}</button><button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => void command("next")}>Next</button></div><label className="mt-3 flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={control.holdMusicWhilePlaying} onChange={(event) => void command("set-hold", event.target.checked)} /> Pause slideshow while music is playing</label></div> : null}</div>)}</div>}</section>;
}
