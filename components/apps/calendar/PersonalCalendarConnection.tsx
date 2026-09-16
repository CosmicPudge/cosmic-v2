"use client";

import { useEffect, useState } from "react";

type PersonalCalendarStatus = "not-connected" | "configured" | "unavailable" | "unauthorized";

interface PersonalConnectionResponse {
  configured?: boolean;
  connected?: boolean;
  provider?: string | null;
  status?: "connected" | "configured" | "not-connected" | "unavailable";
  verified?: boolean;
  error?: string;
}

interface Props {
  status: PersonalCalendarStatus;
  onChanged: () => void;
}

function statusFromResponse(response: PersonalConnectionResponse): PersonalCalendarStatus {
  if (response.status === "connected" || response.status === "configured" || response.connected) return "configured";
  if (response.status === "unavailable") return "unavailable";
  return "not-connected";
}

export default function PersonalCalendarConnection({ status: initialStatus, onChanged }: Props) {
  const [status, setStatus] = useState<PersonalCalendarStatus>(initialStatus);
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formOpen, setFormOpen] = useState(initialStatus === "not-connected");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/calendar/personal-connection", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as PersonalConnectionResponse;
        if (!response.ok) throw new Error(response.status === 401 ? "unauthorized" : body.error ?? "Personal Calendar status is unavailable.");
        if (!cancelled) setStatus(statusFromResponse(body));
      })
      .catch((caught) => {
        if (!cancelled) {
          setStatus(caught instanceof Error && caught.message === "unauthorized" ? "unauthorized" : "unavailable");
          setError(caught instanceof Error && caught.message !== "unauthorized" ? caught.message : null);
        }
      });
    return () => { cancelled = true; };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const normalizedServerUrl = serverUrl.trim().replace(/\/$/, "");
    if (!/^https:\/\//i.test(normalizedServerUrl)) {
      setError("Use an HTTPS CalDAV server URL.");
      return;
    }
    if (!username.trim() || !password) {
      setError("Enter your CalDAV username and app-specific password.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/calendar/personal-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: normalizedServerUrl, username: username.trim(), password }),
      });
      const body = await response.json() as PersonalConnectionResponse;
      if (!response.ok) throw new Error(body.error ?? "Personal Calendar configuration could not be saved.");
      setPassword("");
      setStatus("configured");
      setFormOpen(false);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Personal Calendar configuration could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/personal-connection", { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Personal Calendar could not be disconnected.");
      setPassword("");
      setStatus("not-connected");
      setFormOpen(true);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Personal Calendar could not be disconnected.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unauthorized") return null;

  const statusLabel = status === "configured"
    ? "Configuration saved"
    : status === "unavailable"
      ? "Unavailable"
      : "Not connected";

  return (
    <section className="rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.04] p-5" aria-labelledby="personal-calendar-connection-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-100/55">Personal Calendar</p>
          <h2 id="personal-calendar-connection-heading" className="mt-1 text-lg font-semibold text-white">CalDAV connection</h2>
          <p className="mt-1 text-sm text-white/50">{statusLabel} · stored securely on this Cosmic instance.</p>
        </div>
        {status === "configured" && <button type="button" onClick={() => setFormOpen((open) => !open)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">{formOpen ? "Close" : "Update"}</button>}
      </div>

      {status === "unavailable" && <p className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.05] px-3 py-2 text-sm text-amber-100/80">Personal Calendar storage is unavailable. Your account Calendar remains separate.</p>}

      {formOpen && (
        <form onSubmit={(event) => void save(event)} className="mt-5 space-y-3">
          <p className="text-xs leading-5 text-white/45">iCloud and compatible CalDAV servers are supported. For iCloud, use your Apple email and an app-specific password. Cosmic stores the configuration but does not verify the live provider while saving.</p>
          <label className="block text-sm text-white/60">HTTPS server URL<input required type="url" inputMode="url" placeholder="https://caldav.example.com" value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} autoComplete="url" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-cyan-200/30" /></label>
          <label className="block text-sm text-white/60">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-cyan-200/30" /></label>
          <label className="block text-sm text-white/60">App-specific password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-cyan-200/30" /></label>
          {error && <p role="alert" className="rounded-xl border border-rose-200/15 bg-rose-200/[0.05] px-3 py-2 text-sm text-rose-100">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm font-medium text-cyan-50 disabled:opacity-40">{busy ? "Saving…" : status === "configured" ? "Save configuration" : "Save configuration"}</button>
            {status === "configured" && <button type="button" disabled={busy} onClick={() => void disconnect()} className="rounded-xl border border-rose-200/20 bg-rose-200/[0.08] px-4 py-2 text-sm text-rose-100 disabled:opacity-40">Disconnect</button>}
          </div>
        </form>
      )}

      {status === "configured" && !formOpen && <p className="mt-4 text-xs text-white/40">The saved configuration is used for Personal Calendar reads and writes when available. It has not been live-verified by this form.</p>}
      {status === "not-connected" && !formOpen && <button type="button" onClick={() => setFormOpen(true)} className="mt-4 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-50">Connect CalDAV</button>}
      {error && !formOpen && <p role="alert" className="mt-3 text-sm text-rose-100">{error}</p>}
    </section>
  );
}
