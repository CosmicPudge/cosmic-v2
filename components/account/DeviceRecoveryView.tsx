"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCosmicAccount } from "./AccountProvider";

export default function DeviceRecoveryView() {
  const { loading, account } = useCosmicAccount();
  const challenge = useSearchParams().get("challenge") ?? "";
  const [state, setState] = useState<"ready" | "approved" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  async function approve() {
    setState("ready"); setError(null);
    try {
      const response = await fetch("/api/devices/enrollment/authorize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge }), credentials: "include", cache: "no-store" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Enrollment authorization failed.");
      setState("approved");
    } catch (caught) { setState("error"); setError(caught instanceof Error ? caught.message : "Enrollment authorization failed."); }
  }
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#030511] text-white/60">Checking Cosmic account…</main>;
  const returnTo = `/activate/recover?challenge=${encodeURIComponent(challenge)}`;
  return <main className="grid min-h-screen place-items-center bg-[#030511] px-5 py-10 text-white"><div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/60">Cosmic OS</p>{!account ? <><h1 className="mt-4 text-3xl font-black">Sign in to recover your display</h1><p className="mt-3 text-sm leading-6 text-white/55">The current Cosmic account owner must approve recovery for this physical display.</p><Link className="mt-7 inline-block rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm text-cyan-50" href={`/account?returnTo=${encodeURIComponent(returnTo)}`}>Sign in to continue</Link></> : state === "approved" ? <><h1 className="mt-4 text-3xl font-black">Recovery authorized</h1><p className="mt-3 text-sm leading-6 text-white/55">Return to the display. The trusted helper will finish enrollment without exposing its credential to the browser.</p></> : <><h1 className="mt-4 text-3xl font-black">Recover Cosmic Display</h1><p className="mt-3 text-sm leading-6 text-white/55">You are signed in as {account.email}. Approve recovery only if you are physically setting up this display.</p>{error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}<button type="button" disabled={!challenge} onClick={() => void approve()} className="mt-7 w-full rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 font-semibold text-cyan-50 disabled:opacity-40">Approve display recovery</button></>}</div></main>;
}
