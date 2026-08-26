"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useCosmicAccount } from "./AccountProvider";

export default function ActivateView({ initialCode }: { initialCode: string }) {
  const { loading, account } = useCosmicAccount();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [state, setState] = useState<"enter" | "approved" | "error">(initialCode ? "enter" : "enter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (initialCode) setCode(initialCode.toUpperCase()); }, [initialCode]);
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#030511] text-white/60">Checking Cosmic account…</main>;
  const returnTo = `/activate${code ? `?code=${encodeURIComponent(code)}` : ""}`;
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(null); try { const response = await fetch("/api/devices/pair/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userCode: code }), credentials: "include", cache: "no-store" }); const body = await response.json() as { error?: string }; if (!response.ok) throw new Error(body.error ?? "Code is invalid or expired."); setState("approved"); } catch (caught) { setState("error"); setError(caught instanceof Error ? caught.message : "Approval failed."); } finally { setBusy(false); } }
  return <main className="grid min-h-screen place-items-center bg-[#030511] px-5 py-10 text-white"><div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/60">Cosmic OS</p>{!account ? <><h1 className="mt-4 text-3xl font-black">Connect a display</h1><p className="mt-3 text-sm leading-6 text-white/55">Sign in to authorize a Cosmic Display without sharing your password with the display.</p><Link className="mt-7 inline-block rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm text-cyan-50" href={`/account?returnTo=${encodeURIComponent(returnTo)}`}>Sign in to continue</Link></> : state === "approved" ? <><h1 className="mt-4 text-3xl font-black">Display connected</h1><p className="mt-3 text-sm leading-6 text-white/55">Cosmic Display is now authorized. You can return to the display.</p></> : <><h1 className="mt-4 text-3xl font-black">Connect a Cosmic Display?</h1><p className="mt-3 text-sm text-white/55">Signed in as {account.email}. Enter the code shown on the display.</p><form onSubmit={submit} className="mt-7"><label className="text-sm text-white/65">Display code<input autoFocus required minLength={6} maxLength={7} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-4 text-center text-2xl font-bold tracking-[0.25em] text-white outline-none focus:border-cyan-200/40" placeholder="ABCD-EF" /></label>{error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}<button disabled={busy} className="mt-6 w-full rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 font-semibold text-cyan-50 disabled:opacity-40">{busy ? "Connecting…" : "Connect Display"}</button></form><Link className="mt-4 block text-center text-sm text-white/45" href="/">Cancel</Link></>}</div></main>;
}
