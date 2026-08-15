"use client";

import { useMemo, useState } from "react";

import { useSystem } from "@/components/os/system/SystemProvider";
import type { DeviceClass, PowerProfile, SystemDisplayProfile } from "@/core/contracts/System";

const controlClass = "min-h-10 rounded-xl border border-white/12 bg-[#0a1021]/90 px-3 text-sm text-white outline-none focus:border-cyan-200/45";

export default function SystemDevLab() {
  const { snapshot } = useSystem();
  const [device, setDevice] = useState<DeviceClass>("phone");
  const [online, setOnline] = useState(true);
  const [power, setPower] = useState<PowerProfile>("balanced");
  const [installable, setInstallable] = useState(false);
  const [batterySupported, setBatterySupported] = useState(false);
  const [networkSupported, setNetworkSupported] = useState(false);

  const display = useMemo<SystemDisplayProfile>(() => device === "phone" ? "compact" : device === "tablet" ? "regular" : device === "display" ? "display" : "wide", [device]);

  return <main className="relative min-h-screen px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/45">Development only</p><h1 className="mt-2 text-4xl font-black">System Capability Lab</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">These controls simulate presentation state inside this page only. They never replace browser globals or the production System snapshot.</p>
    <section className="mt-7 grid gap-4 rounded-[1.6rem] border border-white/10 bg-[#071022]/70 p-5 backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-2 text-sm text-white/55">Device profile<select value={device} onChange={(event) => setDevice(event.target.value as DeviceClass)} className={controlClass}><option value="phone">Phone</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option><option value="display">Display / Kiosk</option></select></label>
      <label className="grid gap-2 text-sm text-white/55">Performance<select value={power} onChange={(event) => setPower(event.target.value as PowerProfile)} className={controlClass}><option value="full">Full</option><option value="balanced">Balanced</option><option value="reduced">Reduced</option></select></label>
      <Toggle label="Online" value={online} setValue={setOnline} />
      <Toggle label="Install prompt" value={installable} setValue={setInstallable} />
      <Toggle label="Battery API" value={batterySupported} setValue={setBatterySupported} />
      <Toggle label="Network Information" value={networkSupported} setValue={setNetworkSupported} />
    </section>
    <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Device", device], ["Display", display], ["Network", online ? networkSupported ? "Online · 4g hint" : "Online · hints unavailable" : "Offline"], ["Performance", power], ["Install", installable ? "Prompt available" : "Not offered"], ["Battery", batterySupported ? "72% · charging" : "Unavailable"], ["Touch-first", device === "phone" || device === "tablet" ? "Yes" : "No"], ["Production snapshot", `${snapshot.device.deviceClass} · ${snapshot.display.profile}`]].map(([label, value]) => <article key={label} className="rounded-2xl border border-white/9 bg-white/[0.04] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/32">{label}</p><p className="mt-2 text-sm font-medium text-white/72">{value}</p></article>)}</section>
  </div></main>;
}

function Toggle({ label, value, setValue }: { label: string; value: boolean; setValue(value: boolean): void }) {
  return <label className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-white/9 bg-white/[0.03] px-4 text-sm text-white/60"><span>{label}</span><input type="checkbox" checked={value} onChange={(event) => setValue(event.target.checked)} className="h-5 w-5 accent-cyan-200" /></label>;
}
