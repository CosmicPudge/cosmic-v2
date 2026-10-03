"use client";

import type { KioskEventAlertRequest } from "./KioskSlideshowContext";

export default function KioskEventAlert({ alert }: { alert: KioskEventAlertRequest }) {
  return <div className="relative z-10 flex h-full items-center justify-center px-[8vw] py-[8vh]">
    <section className="w-full max-w-4xl rounded-[2rem] border border-cyan-100/20 bg-black/45 px-10 py-9 text-center shadow-2xl backdrop-blur-md">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/75">Calendar · Now</p>
      <h1 className="mt-5 text-5xl font-semibold leading-tight text-white">{alert.title}</h1>
      {alert.subtitle ? <p className="mt-4 text-xl text-white/70">{alert.subtitle}</p> : null}
    </section>
  </div>;
}
