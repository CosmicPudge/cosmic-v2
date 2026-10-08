"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ExternalLink, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";

type CalendarSubscription = {
  id: string;
  name: string;
  status: string;
  enabled: boolean;
  reconnectRequired: boolean;
  lastSuccessfulRefreshAt?: string | null;
};

type CanvasStatus = {
  connected?: boolean;
  status?: string;
  lastSyncedAt?: string | null;
};

const inputClass = "min-h-11 w-full rounded-xl border border-white/12 bg-[#080d1d]/90 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-200/40 focus:ring-4 focus:ring-cyan-300/10";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40";
const primaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-200/25 bg-cyan-300/12 px-4 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-40";

function looksLikeCanvasFeed(value: string) {
  try {
    const url = new URL(value.trim().replace(/^webcal:/i, "https:"));
    return /\.instructure\.com$/i.test(url.hostname) && /\/feeds\/calendars\//i.test(url.pathname);
  } catch {
    return false;
  }
}

function providerHint(value: string) {
  if (!value.trim()) return null;
  if (looksLikeCanvasFeed(value)) return "Canvas calendar detected";
  if (/^webcal:\/\//i.test(value.trim()) || /icloud\.com\/published\//i.test(value)) return "iCloud published calendar detected";
  if (/\.ics(?:\?|$)/i.test(value)) return "Calendar feed detected";
  return "Cosmos will verify this link before saving";
}

export default function PlugAndPlayConnections({ onChanged }: { onChanged?: () => void }) {
  const [subscriptions, setSubscriptions] = useState<CalendarSubscription[]>([]);
  const [canvas, setCanvas] = useState<CanvasStatus>({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"personal" | "school">("personal");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const hint = useMemo(() => providerHint(url), [url]);

  async function load() {
    setLoading(true);
    try {
      const [subscriptionsResponse, canvasResponse] = await Promise.all([
        fetch("/api/calendar/subscriptions", { cache: "no-store" }),
        fetch("/api/school/canvas", { cache: "no-store" }),
      ]);
      if (subscriptionsResponse.ok) {
        const body = await subscriptionsResponse.json() as { subscriptions?: CalendarSubscription[] };
        setSubscriptions(body.subscriptions ?? []);
      }
      if (canvasResponse.ok) setCanvas(await canvasResponse.json() as CanvasStatus);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/calendar/subscriptions", { cache: "no-store" }),
      fetch("/api/school/canvas", { cache: "no-store" }),
    ]).then(async ([subscriptionsResponse, canvasResponse]) => {
      if (cancelled) return;
      if (subscriptionsResponse.ok) {
        const body = await subscriptionsResponse.json() as { subscriptions?: CalendarSubscription[] };
        if (!cancelled) setSubscriptions(body.subscriptions ?? []);
      }
      if (canvasResponse.ok) {
        const body = await canvasResponse.json() as CanvasStatus;
        if (!cancelled) setCanvas(body);
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function addConnection() {
    if (!url.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "school") {
        const save = await fetch("/api/school/canvas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedUrl: url.trim() }),
        });
        const body = await save.json() as { error?: string };
        if (!save.ok) throw new Error(body.error ?? "School calendar could not be connected.");
        const sync = await fetch("/api/school/canvas", { method: "POST" });
        const syncBody = await sync.json() as { error?: string; diagnostics?: { eventCount?: number }; assignmentCount?: number };
        if (!sync.ok) throw new Error(syncBody.error ?? "School calendar connected, but the first sync failed.");
        setNotice("School calendar connected and synced.");
      } else {
        const save = await fetch("/api/calendar/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url.trim(),
            displayName: name.trim() || "Personal Calendar",
            category: "personal",
            priority: "normal",
          }),
        });
        const body = await save.json() as { error?: string; preview?: { eventCount?: number } };
        if (!save.ok) throw new Error(body.error ?? "Calendar could not be connected.");
        setNotice(`Calendar connected${typeof body.preview?.eventCount === "number" ? ` · ${body.preview.eventCount} upcoming events found` : ""}.`);
      }
      setUrl("");
      setName("");
      await load();
      onChanged?.();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshSubscription(id: string) {
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/calendar/subscriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, refresh: true }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Calendar refresh failed.");
      setNotice("Calendar refreshed.");
      await load();
      onChanged?.();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Calendar refresh failed."); }
    finally { setBusy(false); }
  }

  async function removeSubscription(id: string) {
    if (!window.confirm("Remove this calendar from Cosmos?")) return;
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/calendar/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error("Calendar could not be removed.");
      setNotice("Calendar removed.");
      await load();
      onChanged?.();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Calendar could not be removed."); }
    finally { setBusy(false); }
  }

  async function disconnectCanvas() {
    if (!window.confirm("Disconnect the School Calendar feed from Cosmos?")) return;
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/school/canvas", { method: "DELETE" });
      if (!response.ok) throw new Error("School Calendar could not be disconnected.");
      setNotice("School Calendar disconnected.");
      await load();
      onChanged?.();
    } catch (error) { setNotice(error instanceof Error ? error.message : "School Calendar could not be disconnected."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-[1.5rem] border border-cyan-200/15 bg-cyan-200/[0.045] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/55">Quick Connect</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Paste a link. Cosmos handles the rest.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Use a published iCloud/webcal link for a personal calendar or a Canvas Calendar Feed URL for school. Cosmos verifies it before saving and keeps the private URL server-side.</p>
          </div>
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-100">Kiosk-ready after pairing</span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[180px_1fr]">
          <label className="text-sm text-white/55">Connection type
            <div className="relative mt-2">
              <select value={mode} onChange={(event) => setMode(event.target.value as "personal" | "school")} className={inputClass}>
                <option value="personal">Personal Calendar</option>
                <option value="school">School / Canvas</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-white/30" />
            </div>
          </label>
          <label className="text-sm text-white/55">Calendar link
            <input value={url} onChange={(event) => { const value = event.target.value; setUrl(value); if (looksLikeCanvasFeed(value)) setMode("school"); }} placeholder={mode === "school" ? "Paste your Canvas Calendar Feed URL" : "Paste webcal:// or https:// calendar link"} className={`mt-2 ${inputClass}`} autoComplete="off" spellCheck={false} />
          </label>
        </div>

        {mode === "personal" ? <label className="mt-3 block text-sm text-white/55">Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Work, School Schedule, Cosmic AI" className={`mt-2 ${inputClass}`} />
        </label> : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void addConnection()} disabled={busy || !url.trim()} className={primaryClass}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Connect</button>
          {hint ? <span className="text-xs text-white/42">{hint}</span> : null}
        </div>
        {notice ? <p role="status" className="mt-4 rounded-xl border border-white/9 bg-black/15 px-3 py-2 text-sm text-white/65">{notice}</p> : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[1.4rem] border border-white/9 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold text-white/88">Personal Calendars</h3><p className="mt-1 text-sm text-white/40">Published feeds used by Calendar and the kiosk.</p></div>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-white/35" /> : <span className="text-xs text-white/35">{subscriptions.length} connected</span>}
          </div>
          <div className="mt-4 space-y-2">
            {subscriptions.length ? subscriptions.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-white/9 bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-white/78">{item.name}</p><p className="mt-0.5 text-xs text-white/35">{item.enabled ? "Connected" : "Disabled"}{item.lastSuccessfulRefreshAt ? ` · Updated ${new Date(item.lastSuccessfulRefreshAt).toLocaleString()}` : ""}</p></div>
                <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void refreshSubscription(item.id)} className="rounded-lg border border-white/10 p-2 text-white/55 hover:bg-white/8" aria-label={`Refresh ${item.name}`}><RefreshCw className="h-4 w-4" /></button><button type="button" disabled={busy} onClick={() => void removeSubscription(item.id)} className="rounded-lg border border-rose-300/12 p-2 text-rose-100/65 hover:bg-rose-300/8" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>
              </div>
            )) : <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/35">No personal calendar feeds yet. Paste one above to connect it.</p>}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-white/9 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold text-white/88">School Calendar</h3><p className="mt-1 text-sm text-white/40">Canvas schedule and assignment feed.</p></div>
            {canvas.connected ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" />Connected</span> : <span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-100">Not connected</span>}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/45">{canvas.connected ? "Your Canvas feed is stored with your Cosmos account and can be used automatically by paired kiosks." : "Paste your Canvas Calendar Feed URL above. Cosmos detects Canvas links automatically."}</p>
          <div className="mt-4 flex flex-wrap gap-2">{canvas.connected ? <button type="button" disabled={busy} onClick={() => void disconnectCanvas()} className={buttonClass}>Disconnect</button> : null}<Link href="/school" className={buttonClass}>Open School <ExternalLink className="h-4 w-4" /></Link></div>
        </section>

        <section className="rounded-[1.4rem] border border-white/9 bg-white/[0.035] p-5">
          <h3 className="font-semibold text-white/88">Spotify</h3>
          <p className="mt-1 text-sm leading-6 text-white/40">One click connects Now Playing and playback status everywhere, including kiosk.</p>
          <a href="/api/auth/spotify?returnTo=/settings%23connections" className={`mt-4 ${primaryClass}`}>Connect Spotify</a>
        </section>

        <section className="rounded-[1.4rem] border border-white/9 bg-white/[0.035] p-5">
          <h3 className="font-semibold text-white/88">Kiosk Device</h3>
          <p className="mt-1 text-sm leading-6 text-white/40">Pair the Pi once. It inherits these account connections automatically—no calendar URLs or provider credentials on the device.</p>
          <Link href="/devices" className={`mt-4 ${buttonClass}`}>Manage Kiosk <ExternalLink className="h-4 w-4" /></Link>
        </section>
      </div>
    </div>
  );
}
