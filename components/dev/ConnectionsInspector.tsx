"use client";

import { useEffect, useState } from "react";

type Connection = { id: string; provider: string; providerType?: string | null; status: string; reconnectRequired: boolean; email?: string | null; displayName?: string | null; updatedAt?: string };
export default function ConnectionsInspector() {
  const [data, setData] = useState<Connection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { void fetch("/api/account/connections").then(async (r) => { const body = await r.json() as { connections?: Connection[]; error?: string }; if (!r.ok) throw new Error(body.error ?? "Unavailable"); setData(body.connections ?? []); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unavailable")); }, 0); return () => window.clearTimeout(timer); }, []);
  return <section><p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Dev connection inspector</p><h1 className="mt-2 text-3xl font-black">Account-owned providers</h1><p className="mt-2 text-sm text-white/45">Metadata only. Credential payloads are intentionally never returned.</p>{error ? <p className="mt-6 text-rose-200">{error}</p> : <div className="mt-6 space-y-3">{data?.map((item) => <div key={item.id} className="rounded-xl border border-white/10 p-4 text-sm"><p className="font-bold capitalize">{item.provider}{item.providerType ? ` · ${item.providerType}` : ""}</p><p className="mt-1 text-white/55">{item.email ?? item.displayName ?? "No identity"} · {item.status}{item.reconnectRequired ? " · reconnect required" : ""}</p><p className="mt-2 break-all text-xs text-white/30">connection {item.id}</p></div>)}{data?.length === 0 ? <p className="text-white/40">No connections.</p> : null}</div>}</section>;
}
