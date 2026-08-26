"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";

type Pairing = { deviceCode: string; userCode: string; verificationUrl: string; expiresAt: string; pollInterval: number };

export default function DevicePairingScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const searchParams = useSearchParams();
  const bootId = searchParams.get("cosmic-boot") ?? "";
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const pollInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        const response = await fetch("/api/devices/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bootId }), credentials: "include", cache: "no-store" });
        const next = await response.json() as Pairing & { error?: string };
        if (!response.ok) throw new Error(next.error ?? "Pairing is unavailable.");
        if (!active) return;
        setPairing(next);
        setQr(await QRCode.toDataURL(next.verificationUrl, { margin: 1, width: 280, color: { dark: "#07101d", light: "#f4fbff" } }));
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Pairing is unavailable."); }
    }
    void start();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!pairing) return;
    sessionStorage.setItem("cosmic:pairing-device-code", pairing.deviceCode);
    let active = true;
    let stopped = false;
    let completed = false;
    let timer: number | undefined;
    const poll = async () => {
      if (stopped || pollInFlight.current) return;
      pollInFlight.current = true;
      try {
        const response = await fetch("/api/devices/pair/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceCode: pairing.deviceCode }), credentials: "include", cache: "no-store" });
        const body = await response.json() as { status?: string; error?: string };
        if (body.status === "approved") {
          completed = true;
          sessionStorage.removeItem("cosmic:pairing-device-code");
          setConnecting(true);
          try { await onAuthenticated(); } catch { setConnecting(false); setError("Display connected, but session validation is still pending."); }
          return;
        }
        if (body.status === "expired" || body.status === "denied") { sessionStorage.removeItem("cosmic:pairing-device-code"); if (active) window.setTimeout(() => window.location.reload(), 500); return; }
      } catch { /* The next poll retries transient network failures. */ }
      finally {
        pollInFlight.current = false;
        if (!stopped && !completed) timer = window.setTimeout(() => void poll(), Math.max(3, pairing.pollInterval) * 1000);
      }
    };
    void poll();
    return () => { stopped = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [bootId, onAuthenticated, pairing]);

  return <div className="kiosk-pairing-screen grid min-h-[100svh] place-items-center overflow-hidden px-4 py-4 text-center"><div className="kiosk-pairing-card w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#060a18]/80 p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/60">Cosmic OS</p><p className="text-[10px] uppercase tracking-[0.24em] text-white/30">Device pairing</p></div><h1 className="mt-2 text-2xl font-black sm:text-3xl">Connect this display</h1>{error ? <p className="mt-5 text-sm text-rose-200">{error}</p> : pairing ? <div className="kiosk-pairing-grid mt-3 items-center"><div>{qr ? <img className="mx-auto rounded-2xl p-1" src={qr} alt="QR code for Cosmic display pairing" /> : <div className="mx-auto size-[180px] animate-pulse rounded-2xl bg-white/10" />}</div><div className="text-left"><p className="text-sm text-white/55">Scan with your phone or visit</p><p className="mt-1 break-all text-sm text-cyan-100/80">{new URL(pairing.verificationUrl).origin}/activate</p><p className="mt-5 text-xs uppercase tracking-[0.25em] text-white/40">Code</p><p className="mt-1 text-3xl font-black tracking-[0.25em] text-white">{pairing.userCode}</p><p className="mt-4 text-sm text-cyan-100/65">{connecting ? "Connected · Starting Cosmic…" : "Waiting for authorization…"}</p></div></div> : <><p className="mt-5 text-sm text-white/55">This pairing code has expired. Preparing a new one…</p><button type="button" className="mt-6 rounded-xl border border-cyan-200/20 px-4 py-3 text-sm text-cyan-50" onClick={() => window.location.reload()}>Try again</button></>}</div></div>;
}
