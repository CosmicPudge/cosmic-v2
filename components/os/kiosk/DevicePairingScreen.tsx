"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";

type Pairing = { deviceCode: string; userCode: string; deviceNumber: string; verificationUrl: string; expiresAt: string; pollInterval: number };
type PairingResponse = (Pairing & { status?: "created"; error?: string }) | { status?: "identity_missing"; reason?: string; error?: string };

export default function DevicePairingScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const searchParams = useSearchParams();
  const bootId = searchParams.get("cosmic-boot") ?? "";
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [identityRecovery, setIdentityRecovery] = useState(false);
  const pollInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        const bootstrap = await fetch("/api/devices/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bootId }), credentials: "include", cache: "no-store" });
        const bootstrapBody = await bootstrap.json().catch(() => null) as { state?: string } | null;
        if (bootstrap.ok && bootstrapBody?.state === "owned") {
          await onAuthenticated();
          return;
        }
        const response = await fetch("/api/devices/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bootId }), credentials: "include", cache: "no-store" });
        const next = await response.json() as PairingResponse | { status?: "identity_missing"; reason?: string; error?: string };
        if (!response.ok) {
          if (next.status === "identity_missing") { setIdentityRecovery(true); return; }
          throw new Error(next.error ?? "Pairing is unavailable.");
        }
        if (!("deviceCode" in next)) throw new Error("Pairing is unavailable.");
        if (!active) return;
        setPairing(next);
        setQr(await QRCode.toDataURL(next.verificationUrl, { margin: 1, width: 280, color: { dark: "#07101d", light: "#f4fbff" } }));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Pairing is unavailable.");
      }
    }
    void start();
    return () => { active = false; };
  }, [bootId, onAuthenticated]);

  useEffect(() => {
    if (!pairing) return;
    sessionStorage.setItem("cosmic:pairing-device-code", pairing.deviceCode);
    let stopped = false;
    let completed = false;
    let timer: number | undefined;
    const poll = async () => {
      if (stopped || pollInFlight.current) return;
      pollInFlight.current = true;
      try {
        const response = await fetch("/api/devices/pair/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceCode: pairing.deviceCode }), credentials: "include", cache: "no-store" });
        const body = await response.json() as { status?: string };
        if (body.status === "approved") {
          completed = true;
          sessionStorage.removeItem("cosmic:pairing-device-code");
          setConnecting(true);
          try { await onAuthenticated(); } catch { setConnecting(false); setError("Display connected, but session validation is still pending."); }
          return;
        }
        if (body.status === "expired" || body.status === "denied") {
          sessionStorage.removeItem("cosmic:pairing-device-code");
          window.setTimeout(() => window.location.reload(), 500);
          return;
        }
      } catch {
        // Keep setup visible and retry after a transient network failure.
      } finally {
        pollInFlight.current = false;
        if (!stopped && !completed) timer = window.setTimeout(() => void poll(), Math.max(3, pairing.pollInterval) * 1000);
      }
    };
    void poll();
    return () => { stopped = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [onAuthenticated, pairing]);

  const activationUrl = pairing ? new URL(pairing.verificationUrl).origin + "/activate" : "";
  const setupContent = connecting ? (
    <div className="grid min-h-[21rem] place-items-center py-8">
      <div className="grid size-20 place-items-center rounded-full border border-cyan-200/50 bg-cyan-200/10 text-3xl text-cyan-100 shadow-[0_0_60px_rgba(103,232,249,.35)]">✓</div>
      <h1 className="mt-6 text-3xl font-black tracking-tight">CONNECTED</h1>
      <p className="mt-2 text-sm uppercase tracking-[.24em] text-cyan-100/60">Starting Cosmic</p>
    </div>
  ) : (
    <>
      <h1 className="mt-3 text-2xl font-black sm:text-3xl">Let&apos;s get you connected</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">Scan the QR code with your phone to connect this display to your Cosmic account.</p>
      {error ? (
        <div className="mt-5 rounded-xl border border-rose-200/15 bg-rose-200/[.05] p-4 text-sm text-rose-100"><p>{error}</p><button type="button" className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => window.location.reload()}>Try again</button></div>
      ) : identityRecovery ? (
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-amber-200/20 bg-amber-200/[.06] p-6 text-left"><p className="text-xs font-semibold uppercase tracking-[.25em] text-amber-100/70">Cosmic Display</p><h1 className="mt-3 text-2xl font-black tracking-tight text-white">Device identity needs recovery</h1><p className="mt-3 text-sm leading-6 text-white/60">This display&apos;s saved module identity is no longer available. No new device was created. An account owner or Cosmic administrator must restore and re-bind this physical display before pairing can continue.</p><p className="mt-4 text-xs uppercase tracking-[.2em] text-white/35">Safe recovery required · no credentials shown</p></div>
      ) : pairing ? (
        <div className="kiosk-pairing-grid mt-4 items-center"><div>{qr ? <img className="mx-auto rounded-2xl bg-white p-1" src={qr} alt="QR code for Cosmic display activation" /> : <div className="mx-auto size-[180px] animate-pulse rounded-2xl bg-white/10" />}</div><div className="text-left"><p className="text-xs uppercase tracking-[.25em] text-white/40">Device</p><p className="mt-1 text-lg font-bold text-white">{pairing.deviceNumber}</p><p className="mt-4 text-sm text-white/55">Or visit</p><p className="mt-1 break-all text-sm text-cyan-100/80">{activationUrl}</p><p className="mt-4 text-xs uppercase tracking-[.25em] text-white/40">Activation code</p><p className="mt-1 text-3xl font-black tracking-[.25em] text-white">{pairing.userCode}</p><p className="mt-4 text-sm text-cyan-100/70">Waiting for connection…</p></div></div>
      ) : <p className="mt-6 text-sm text-white/45">Preparing a secure activation session…</p>}
    </>
  );

  return <main className="kiosk-pairing-screen relative grid min-h-[100svh] place-items-center overflow-hidden bg-[#030511] px-4 py-4 text-center text-white"><div className="pointer-events-none absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" /><div className="kiosk-pairing-card relative w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#060a18]/80 p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Cosmic OS</p><p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Cosmic Display</p></div>{setupContent}</div></main>;
}
