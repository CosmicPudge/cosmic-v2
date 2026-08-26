"use client";

import { useEffect, useState } from "react";

type Device = { id: string; name: string; type: string; lastSeenAt: string; revokedAt: string | null };

export default function ConnectedDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void fetch("/api/account/devices", { cache: "no-store" }).then((response) => response.json() as Promise<{ devices?: Device[]; error?: string }>).then((body) => { if (body.devices) setDevices(body.devices); else setError(body.error ?? "Unavailable"); }).catch(() => setError("Unavailable")); }, []);
  async function revoke(id: string) { const response = await fetch("/api/account/devices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: id }) }); if (response.ok) setDevices((current) => current.map((device) => device.id === id ? { ...device, revokedAt: new Date().toISOString() } : device)); }
  return <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="font-semibold text-white/85">Connected devices</h2>{error ? <p className="mt-2 text-sm text-white/40">{error}</p> : devices.length === 0 ? <p className="mt-2 text-sm text-white/45">No connected displays.</p> : <div className="mt-3 space-y-3">{devices.map((device) => <div key={device.id} className="flex items-center justify-between gap-3 text-sm"><div><p className="text-white/80">{device.name}</p><p className="text-xs text-white/40">{device.type} · Last seen {new Date(device.lastSeenAt).toLocaleString()}</p></div>{device.revokedAt ? <span className="text-xs text-rose-200/70">Revoked</span> : <button type="button" className="rounded-lg border border-rose-200/20 px-3 py-2 text-xs text-rose-100" onClick={() => void revoke(device.id)}>Sign out</button>}</div>)}</div>}</section>;
}
