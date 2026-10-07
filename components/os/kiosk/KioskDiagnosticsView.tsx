"use client";

import { useEffect, useState } from "react";
import type { KioskDiagnostics } from "@/services/kiosk/diagnostics";
import { kioskApiUrl } from "@/services/kioskRequest";

type DiagnosticsResponse = { runtime: { authenticated: boolean; environment: "dev"; runtimeReady: boolean } } & KioskDiagnostics;
type AuthResult = "ok" | "missing-cookie" | "session-miss" | "wrong-kind" | "boot-mismatch" | "expired" | "unknown";
type AuthDiagnostics = { cookiePresent: boolean; sessionLookup: "hit" | "miss" | "not-attempted"; sessionKind: "device" | "user" | "none"; bootBound: boolean; bootQueryPresent?: boolean; bootMatch: boolean; expired?: boolean; authResult: AuthResult };
type AuthStatusResponse = Omit<AuthDiagnostics, "bootQueryPresent" | "expired"> & { bootQueryPresent: boolean; expired: boolean };
type DiagnosticsErrorResponse = { error: string; auth?: AuthDiagnostics };

function Status({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-6 border-b border-white/[.08] py-3 last:border-0"><dt className="text-sm text-white/55">{label}</dt><dd className="text-right text-sm font-medium text-cyan-100/85">{value}</dd></div>;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function parseAuthDiagnostics(value: string | null): AuthDiagnostics | null {
  if (!value) return null;
  try { return JSON.parse(value) as AuthDiagnostics; } catch { return null; }
}

function AuthStatusPanel({ auth }: { auth: AuthStatusResponse }) {
  return <><p className="text-xs uppercase tracking-[.3em] text-amber-100/60">Authentication</p><h1 className="mt-3 text-3xl font-semibold text-white">Kiosk session authentication</h1><dl className="mt-8 max-w-xl rounded-2xl border border-amber-100/10 bg-white/[.04] p-5"><Status label="Cookie" value={auth.cookiePresent ? "PRESENT" : "MISSING"} /><Status label="Session lookup" value={auth.sessionLookup.toUpperCase()} /><Status label="Session type" value={auth.sessionKind.toUpperCase()} /><Status label="Boot query" value={auth.bootQueryPresent ? "PRESENT" : "MISSING"} /><Status label="Boot bound" value={yesNo(auth.bootBound).toUpperCase()} /><Status label="Boot match" value={yesNo(auth.bootMatch).toUpperCase()} /><Status label="Expired" value={yesNo(auth.expired).toUpperCase()} /><Status label="Result" value={auth.authResult.replaceAll("-", " ").toUpperCase()} /></dl></>;
}

export default function KioskDiagnosticsView() {
  const [payload, setPayload] = useState<DiagnosticsResponse | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ "cosmic-kiosk": "1" });
    const bootId = new URLSearchParams(window.location.search).get("cosmic-boot")?.trim();
    if (bootId) params.set("cosmic-boot", bootId);
    let active = true;
    const log = (message: string) => {
      if (["dev.cosmicpudge.shop", "localhost", "127.0.0.1"].includes(window.location.hostname.toLowerCase())) console.info(`[kiosk-diagnostics] ${message}`);
    };
    log("auth-status request");
    void fetch(kioskApiUrl(`/api/kiosk/auth-status?${params.toString()}`), { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        log(`auth-status status=${response.status}`);
        if (!response.ok) throw new Error("AUTH STATUS REQUEST FAILED");
        return response.json() as Promise<AuthStatusResponse>;
      })
      .then((value) => {
        if (!active) return;
        setAuthStatus(value);
        log(`authResult=${value.authResult}`);
        if (value.authResult !== "ok") return;
        log("diagnostics request");
        void fetch(kioskApiUrl(`/api/kiosk/diagnostics?${params.toString()}`), { cache: "no-store", credentials: "same-origin" })
          .then(async (response) => {
            if (!response.ok) {
              const body = await response.json().catch(() => null) as DiagnosticsErrorResponse | null;
              if (response.status === 401 && body?.auth) throw new Error(JSON.stringify(body.auth));
              throw new Error(response.status === 401 ? "Kiosk session authentication is required." : "Diagnostics are temporarily unavailable.");
            }
            return response.json() as Promise<DiagnosticsResponse>;
          })
          .then((diagnostics) => { if (active) setPayload(diagnostics); })
          .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Diagnostics are temporarily unavailable."); });
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "AUTH STATUS REQUEST FAILED"); });
    return () => { active = false; };
  }, []);

  const authError = parseAuthDiagnostics(error);
  if (authError) return <DiagnosticsShell><AuthStatusPanel auth={{ ...authError, bootQueryPresent: Boolean(authError.bootQueryPresent), expired: Boolean(authError.expired) }} /></DiagnosticsShell>;
  if (error) return <DiagnosticsShell><p className="text-sm text-amber-100/80">{error}</p></DiagnosticsShell>;
  if (authStatus && authStatus.authResult !== "ok") return <DiagnosticsShell><AuthStatusPanel auth={authStatus} /></DiagnosticsShell>;
  if (!payload) return <DiagnosticsShell>{authStatus ? <AuthStatusPanel auth={authStatus} /> : <p className="text-sm text-white/55">Loading kiosk authentication status…</p>}</DiagnosticsShell>;

  return <DiagnosticsShell>
    <p className="text-xs uppercase tracking-[.3em] text-cyan-100/55">Authenticated developer kiosk</p>
    <h1 className="mt-3 text-3xl font-semibold text-white">Runtime diagnostics</h1>
    <p className="mt-2 text-sm text-white/45">Provider readiness only. Secrets, coordinates, identifiers, and private content are withheld.</p>
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="font-semibold text-white">Weather</h2><dl className="mt-3"><Status label="API key configured" value={yesNo(payload.weather.apiKeyConfigured)} /><Status label="Browser location provided" value={yesNo(payload.weather.browserLocationProvided)} /><Status label="Stored location available" value={yesNo(payload.weather.storedLocationAvailable)} /><Status label="Server fallback configured" value={yesNo(payload.weather.serverFallbackConfigured)} /><Status label="Location source" value={payload.weather.locationSource} /><Status label="Provider attempted" value={yesNo(payload.weather.providerAttempted)} /><Status label="Provider result" value={payload.weather.providerResult} /><Status label="Aggregate weather" value={yesNo(payload.weather.aggregateHasWeather)} /></dl></section>
      <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="font-semibold text-white">School</h2><dl className="mt-3"><Status label="Kiosk account configured" value={yesNo(payload.school.accountConfigured)} /><Status label="Account lookup attempted" value={yesNo(payload.school.accountLookupAttempted)} /><Status label="Account matched" value={yesNo(payload.school.accountMatched)} /><Status label="Provider" value={payload.school.provider} /><Status label="Provider configured" value={yesNo(payload.school.providerConfigured)} /><Status label="Credential available" value={yesNo(payload.school.credentialAvailable)} /><Status label="Provider attempted" value={yesNo(payload.school.providerAttempted)} /><Status label="Provider result" value={payload.school.providerResult} /><Status label="Canvas fallback configured" value={yesNo(payload.school.fallbackConfigured)} /><Status label="Aggregate data" value={yesNo(payload.school.aggregateHasData)} /></dl></section>
    </div>
  </DiagnosticsShell>;
}

function DiagnosticsShell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-[100dvh] place-items-center overflow-auto bg-[#02040e] p-6 text-white"><div className="w-full max-w-4xl">{children}</div></main>;
}
