"use client";

import { useEffect, useState } from "react";
import type { KioskDiagnostics } from "@/services/kiosk/diagnostics";
import { kioskApiUrl } from "@/services/kioskRequest";

type DiagnosticsResponse = { runtime: { authenticated: boolean; environment: "dev"; runtimeReady: boolean } } & KioskDiagnostics;
type AuthResult = "ok" | "missing-cookie" | "session-miss" | "wrong-kind" | "boot-mismatch" | "expired" | "unknown";
type AuthDiagnostics = { cookiePresent: boolean; sessionLookup: "hit" | "miss" | "not-attempted"; sessionKind: "device" | "user" | "none"; bootBound: boolean; bootQueryPresent?: boolean; bootMatch: boolean; expired?: boolean; authResult: AuthResult };
type AuthStatusResponse = Omit<AuthDiagnostics, "bootQueryPresent" | "expired"> & { bootQueryPresent: boolean; expired: boolean };
type DiagnosticsErrorResponse = { error: string; auth?: AuthDiagnostics };

function Status({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/[.08] py-0.5 last:border-0"><dt className="truncate text-[10px] leading-4 text-white/55">{label}</dt><dd className={`truncate text-right text-[10px] font-semibold uppercase leading-4 ${emphasis ? "text-amber-100" : "text-cyan-100/85"}`}>{value}</dd></div>;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function parseAuthDiagnostics(value: string | null): AuthDiagnostics | null {
  if (!value) return null;
  try { return JSON.parse(value) as AuthDiagnostics; } catch { return null; }
}

function diagnosticsErrorCategory(reason: unknown): "timeout" | "aborted" | "network-error" | "invalid-json" | "http-error" {
  if (reason instanceof Error && (reason.name === "AbortError" || reason.name === "TimeoutError" || reason.message === "DIAGNOSTICS REQUEST TIMED OUT")) return "timeout";
  if (reason instanceof SyntaxError) return "invalid-json";
  if (reason instanceof TypeError) return "network-error";
  return "http-error";
}

function AuthStatusPanel({ auth }: { auth: AuthStatusResponse }) {
  return <header className="shrink-0"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-semibold uppercase tracking-[.24em] text-cyan-100/70">Runtime diagnostics</p><p className="text-[9px] uppercase tracking-[.2em] text-white/35">800 × 480 kiosk</p></div><dl className="mt-1 grid grid-cols-4 gap-1 rounded-md border border-white/10 bg-white/[.04] px-2 py-1"><Status label="Auth" value={auth.authResult === "ok" ? "OK" : auth.authResult.replaceAll("-", " ")} emphasis={auth.authResult !== "ok"} /><Status label="Cookie" value={auth.cookiePresent ? "PRESENT" : "MISSING"} /><Status label="Session" value={auth.sessionKind} /><Status label="Boot" value={auth.bootMatch ? "MATCH" : auth.bootQueryPresent ? "MISMATCH" : "MISSING"} emphasis={!auth.bootMatch} /></dl></header>;
}

function DiagnosticSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-h-0 overflow-hidden rounded-md border border-white/10 bg-white/[.04] px-2 py-1.5"><h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[.2em] text-white/75">{title}</h2><dl>{children}</dl></section>;
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
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15_000);
        void fetch(kioskApiUrl(`/api/kiosk/diagnostics?${params.toString()}`), { cache: "no-store", credentials: "same-origin", signal: controller.signal })
          .then(async (response) => {
            log(`diagnostics status=${response.status}`);
            let body: DiagnosticsResponse | DiagnosticsErrorResponse;
            try {
              body = await response.json() as DiagnosticsResponse | DiagnosticsErrorResponse;
              log("diagnostics parse=ok");
            } catch {
              log("diagnostics parse=failed");
              throw new SyntaxError("invalid-json");
            }
            if (!response.ok) {
              if (response.status === 401 && "auth" in body && body.auth) throw new Error(JSON.stringify(body.auth));
              throw new Error(response.status === 401 ? "Kiosk session authentication is required." : "Diagnostics are temporarily unavailable.");
            }
            return body as DiagnosticsResponse;
          })
          .then((diagnostics) => { if (active) setPayload(diagnostics); })
          .catch((reason: unknown) => {
            const category = reason instanceof Error && reason.name === "AbortError" ? "timeout" : diagnosticsErrorCategory(reason);
            log(`diagnostics error=${category}`);
            if (active) setError(category === "timeout" ? "DIAGNOSTICS REQUEST TIMED OUT" : reason instanceof Error ? reason.message : "Diagnostics are temporarily unavailable.");
          })
          .finally(() => window.clearTimeout(timeout));
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
    {authStatus ? <AuthStatusPanel auth={authStatus} /> : null}
    <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2">
      <DiagnosticSection title="Weather"><Status label="API key" value={yesNo(payload.weather.apiKeyConfigured)} /><Status label="Browser location" value={yesNo(payload.weather.browserLocationProvided)} /><Status label="Stored location" value={yesNo(payload.weather.storedLocationAvailable)} /><Status label="Server fallback" value={yesNo(payload.weather.serverFallbackConfigured)} /><Status label="Location source" value={payload.weather.locationSource} /><Status label="Provider attempted" value={yesNo(payload.weather.providerAttempted)} /><Status label="Provider result" value={payload.weather.providerResult} emphasis={payload.weather.providerResult !== "ok"} /><Status label="Provider status" value={payload.weather.httpStatus ? String(payload.weather.httpStatus) : payload.weather.providerResult} emphasis={payload.weather.providerResult !== "ok"} /></DiagnosticSection>
      <DiagnosticSection title="School"><Status label="Kiosk account" value={yesNo(payload.school.accountConfigured)} /><Status label="Account lookup" value={yesNo(payload.school.accountLookupAttempted)} /><Status label="Account matched" value={yesNo(payload.school.accountMatched)} /><Status label="Provider" value={payload.school.provider} /><Status label="Provider configured" value={yesNo(payload.school.providerConfigured)} /><Status label="Credential available" value={yesNo(payload.school.credentialAvailable)} /><Status label="Provider attempted" value={yesNo(payload.school.providerAttempted)} /><Status label="Provider result" value={payload.school.providerResult} emphasis={payload.school.providerResult !== "ok"} /><Status label="Provider status" value={payload.school.providerResult} emphasis={payload.school.providerResult !== "ok"} /></DiagnosticSection>
    </div>
  </DiagnosticsShell>;
}

function DiagnosticsShell({ children }: { children: React.ReactNode }) {
  return <main className="h-[100dvh] w-[100dvw] overflow-hidden bg-[#02040e] p-2 text-white"><div className="mx-auto flex h-full w-full max-w-4xl min-w-0 flex-col">{children}</div></main>;
}
