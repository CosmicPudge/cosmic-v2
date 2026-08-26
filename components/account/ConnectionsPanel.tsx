"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBillingStatus } from "@/hooks/os/useBillingStatus";
import { useCosmicAccount } from "./AccountProvider";

type Connection = { id: string; provider: string; providerType?: string | null; status: string; reconnectRequired: boolean; displayName?: string | null; email?: string | null };

export default function ConnectionsPanel({ returnTo }: { returnTo?: string } = {}) { return <><BillingSummary /><ConnectionsPanelContent returnTo={returnTo} /><AccountDeletionPanel /></>; }

function BillingSummary() {
  const { data, loading } = useBillingStatus();
  return <section className="mt-5 rounded-2xl border border-fuchsia-200/12 bg-fuchsia-200/[0.035] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-fuchsia-100/55">Billing</p><p className="mt-1 font-semibold text-white">{loading ? "Loading…" : data.subscription?.status === "past_due" || data.subscription?.status === "unpaid" ? "Cosmic+ payment needs attention" : data.plan === "cosmic_plus" ? "Cosmic+ active" : "Free"}</p>{data.plan === "cosmic_plus" && data.subscription?.currentPeriodEnd ? <p className="mt-1 text-xs text-white/45">{data.subscription.cancelAtPeriodEnd ? "Active until" : "Renews"} {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</p> : null}</div><Link href="/cosmic-plus" className="rounded-xl border border-fuchsia-200/20 bg-fuchsia-200/10 px-3 py-2 text-sm text-fuchsia-50">{data.plan === "cosmic_plus" ? "Manage" : "View billing"}</Link></div></section>;
}

function AccountDeletionPanel() {
  const { account } = useCosmicAccount();
  const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string>();
  async function deleteAccount() {
    setBusy(true); setError(undefined);
    try { const response = await fetch("/api/account/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) }); const body = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(body.error ?? "Account deletion failed."); window.location.assign("/account"); } catch (caught) { setError(caught instanceof Error ? caught.message : "Account deletion failed."); setBusy(false); }
  }
  return <section className="mt-5 rounded-2xl border border-rose-200/12 bg-rose-200/[0.035] p-5"><h2 className="font-semibold text-rose-100/90">Delete account</h2><p className="mt-1 text-sm leading-6 text-white/50">This removes private account data, sessions, provider credentials, and billing mappings. Any active Stripe subscription is canceled first.</p><label className="mt-4 block text-sm text-white/60">Type DELETE to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white" autoComplete="off" /></label>{error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : null}<button type="button" disabled={!account || confirmation !== "DELETE" || busy} onClick={() => void deleteAccount()} className="mt-4 rounded-xl border border-rose-200/20 bg-rose-200/10 px-3 py-2 text-sm text-rose-50 disabled:opacity-40">{busy ? "Deleting…" : "Delete account"}</button></section>;
}

function ConnectionsPanelContent({ returnTo }: { returnTo?: string }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function load() { const response = await fetch("/api/account/connections"); const data = await response.json() as { connections?: Connection[]; error?: string }; if (!response.ok) { setError(data.error ?? "Connections are unavailable."); return; } setConnections(data.connections ?? []); }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  async function disconnect(id: string) { const response = await fetch("/api/account/connections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId: id }) }); if (!response.ok) { setError("Could not disconnect provider."); return; } await load(); }
  const oauthReturn = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
  return <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-lg font-bold">Provider connections</h2><p className="mt-1 text-sm text-white/45">Connections belong to this Cosmic account. Secrets are never shown here.</p>{error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}<div className="mt-4 space-y-3">{connections.map((connection) => <div key={connection.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><div><p className="font-semibold capitalize">{connection.provider}{connection.providerType ? ` · ${connection.providerType}` : ""}</p><p className="text-xs text-white/45">{connection.email ?? connection.displayName ?? connection.status}{connection.reconnectRequired ? " · reconnect required" : ""}</p></div><button type="button" className="text-xs text-rose-200/80" onClick={() => void disconnect(connection.id)}>Disconnect</button></div>)}{connections.length === 0 && !error ? <p className="text-sm text-white/40">No account-owned connections yet.</p> : null}</div><CalendarForm onCreated={() => void load()} /><div className="mt-5 flex gap-3 text-sm"><a className="text-cyan-100/80" href={`/api/auth/google${oauthReturn}`}>Connect Gmail</a><a className="text-cyan-100/80" href={`/api/auth/spotify${oauthReturn}`}>Connect Spotify</a></div></section>;
}

function CalendarForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false); const [displayName, setDisplayName] = useState(""); const [serverUrl, setServerUrl] = useState("https://caldav.icloud.com"); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(null); const response = await fetch("/api/account/connections/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, serverUrl, username, password }) }); if (!response.ok) { const body = await response.json() as { error?: string }; setError(body.error ?? "Calendar connection failed."); return; } setPassword(""); setOpen(false); onCreated(); }
  if (!open) return <button type="button" className="mt-5 text-sm text-cyan-100/80" onClick={() => setOpen(true)}>Connect Calendar</button>;
  return <form onSubmit={submit} className="mt-5 space-y-2 rounded-xl border border-white/10 p-3"><input required placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg bg-white/10 p-2 text-sm" /><input required type="url" placeholder="https://caldav.icloud.com" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} className="w-full rounded-lg bg-white/10 p-2 text-sm" /><input required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg bg-white/10 p-2 text-sm" /><input required type="password" placeholder="App password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg bg-white/10 p-2 text-sm" />{error ? <p className="text-xs text-rose-200">{error}</p> : null}<button className="text-sm text-cyan-100/80">Save Calendar</button></form>;
}
