"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";

type Pairing = { deviceCode: string; userCode: string; verificationUrl: string; expiresAt: string; pollInterval: number };

export default function DevicePairingScreen() {
  const searchParams = useSearchParams();
  const bootId = searchParams.get("cosmic-boot") ?? "";
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        const response = await fetch("/api/devices/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bootId }), cache: "no-store" });
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
    const poll = async () => {
      try {
        const response = await fetch("/api/devices/pair/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceCode: pairing.deviceCode }), cache: "no-store" });
        const body = await response.json() as { status?: string; error?: string };
        if (body.status === "approved") { sessionStorage.removeItem("cosmic:pairing-device-code"); window.location.reload(); return; }
        if (body.status === "expired" || body.status === "denied") { sessionStorage.removeItem("cosmic:pairing-device-code"); if (active) window.setTimeout(() => window.location.reload(), 500); return; }
      } catch { /* The next poll retries transient network failures. */ }
    };
    const timer = window.setInterval(() => void poll(), Math.max(3, pairing.pollInterval) * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [pairing]);

  return <div className="grid min-h-[100svh] place-items-center px-6 py-10 text-center"><div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#060a18]/80 p-7 shadow-2xl backdrop-blur-xl"><p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/60">Cosmic OS</p><h1 className="mt-4 text-3xl font-black">Connect this display</h1>{error ? <p className="mt-5 text-sm text-rose-200">{error}</p> : pairing ? <><p className="mt-3 text-sm text-white/55">Scan the QR code with your phone, or visit</p><p className="mt-2 break-all text-sm text-cyan-100/80">{new URL(pairing.verificationUrl).origin}/activate</p>{qr ? <img className="mx-auto mt-6 rounded-2xl p-2" src={qr} alt="QR code for Cosmic display pairing" /> : <div className="mx-auto mt-6 size-[280px] animate-pulse rounded-2xl bg-white/10" />}<p className="mt-5 text-xs uppercase tracking-[0.25em] text-white/40">Enter code</p><p className="mt-2 text-3xl font-black tracking-[0.25em] text-white">{pairing.userCode}</p><p className="mt-5 text-sm text-cyan-100/65">Waiting for authorization…</p></> : <><p className="mt-5 text-sm text-white/55">This pairing code has expired. Preparing a new one…</p><button type="button" className="mt-6 rounded-xl border border-cyan-200/20 px-4 py-3 text-sm text-cyan-50" onClick={() => window.location.reload()}>Try again</button></>}</div></div>;
}
