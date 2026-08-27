"use client";

export default function KioskRouteError({ reset }: { reset: () => void }) {
  return <main className="grid min-h-[100dvh] place-items-center bg-[#030511] px-6 text-center text-white"><div><p className="text-xs uppercase tracking-[.34em] text-cyan-200/70">Cosmic</p><h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1><p className="mt-3 text-sm text-white/55">Your display is safe. Try starting this kiosk scene again.</p><button type="button" onClick={reset} className="mt-7 rounded-xl border border-cyan-200/25 bg-cyan-200/10 px-5 py-3 text-sm text-cyan-50">Retry now</button></div></main>;
}
