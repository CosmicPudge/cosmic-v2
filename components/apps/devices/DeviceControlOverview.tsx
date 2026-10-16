"use client";

import { useEffect, useState } from "react";
import { Activity, Battery, Bell, CalendarDays, ChevronRight, Clock3, CloudSun, Gamepad2, Glasses, HeartPulse, Monitor, Music2, Play, Power, RotateCcw, Settings2, ShieldCheck, SlidersHorizontal, Smartphone, Sparkles, WifiOff, Zap } from "lucide-react";

const tabs = ["Overview", "Kiosk", "Even G2", "Displays", "Integrations", "Automation"] as const;
type Tab = (typeof tabs)[number];
const initialModules = [
  { name: "Clock", seconds: 10, enabled: true },
  { name: "Weather", seconds: 15, enabled: true },
  { name: "Calendar", seconds: 10, enabled: true },
  { name: "Notifications", seconds: 15, enabled: true },
  { name: "Music", seconds: 15, enabled: true },
  { name: "Sports", seconds: 15, enabled: true },
  { name: "System Status", seconds: 10, enabled: true },
  { name: "Custom Messages", seconds: 10, enabled: false },
];
type Module = (typeof initialModules)[number];
const icons = [Clock3, CloudSun, CalendarDays, Bell, Music2, Gamepad2, Activity, Sparkles];
const actions = [{label:"Restart Kiosk", icon:RotateCcw},{label:"Change Content",icon:SlidersHorizontal},{label:"Toggle Display",icon:Monitor},{label:"Adjust Brightness",icon:CloudSun},{label:"Enter Demo Mode",icon:Gamepad2},{label:"Take Screenshot",icon:Smartphone}];
const panel = "rounded-2xl border border-violet-300/20 bg-[#0b102d]/70 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl";
const button = "rounded-xl border border-violet-300/25 bg-violet-500/15 px-3 py-2 text-sm text-violet-100 transition hover:bg-violet-500/25 focus-visible:outline-2 focus-visible:outline-violet-300";

export default function DeviceControlOverview() {
  const [active, setActive] = useState<Tab>("Overview");
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("cosmos.m3.modules.v1") || "null") as Module[] | null;
      if (Array.isArray(stored)) setModules(initialModules.map((item) => {
        const match = stored.find((record) => record.name === item.name);
        return match ? { ...item, enabled: typeof match.enabled === "boolean" ? match.enabled : item.enabled, seconds: Number.isFinite(match.seconds) && match.seconds >= 5 && match.seconds <= 300 ? match.seconds : item.seconds } : item;
      }));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("cosmos.m3.modules.v1", JSON.stringify(modules)); } catch {}
  }, [modules, ready]);
  const enabled = modules.filter((item) => item.enabled);
  const total = enabled.reduce((sum, item) => sum + item.seconds, 0);
  const notify = (message: string) => setNotice(message);
  const toggle = (name: string) => setModules((old) => old.map((item) => item.name === name ? {...item, enabled: !item.enabled} : item));

  return <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-12 text-white">
    <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-r from-[#0c1031]/95 via-[#161346]/85 to-[#321052]/55 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-14 -top-32 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
      <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-violet-200/55">Cosmos · Milestone 3</p>
      <div className="mt-2 flex items-center gap-3"><Monitor className="h-8 w-8 text-violet-300" /><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Devices</h1></div>
      <p className="mt-2 max-w-2xl text-sm text-white/60">Your future control center for displays, kiosks, and connected hardware.</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-xs text-amber-100"><ShieldCheck size={14}/> Control-side preview · no hardware commands</div>
    </div>

    <nav aria-label="Device sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-violet-300/15 bg-[#0a0b23]/65 p-2">
      {tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} aria-current={active === tab ? "page" : undefined} className={`min-w-max rounded-xl px-4 py-2 text-sm transition ${active === tab ? "bg-violet-600/75 text-white shadow-[0_0_18px_rgba(139,92,246,.35)]" : "text-white/55 hover:bg-white/10 hover:text-white"}`}>{tab}</button>)}
    </nav>

    {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"><span>{notice}</span><button className="text-white/70 hover:text-white" onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

    {active === "Overview" ? <>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_.8fr]">
        <section className={panel+" min-w-0 p-4"}>
          <div className="flex items-center gap-3"><Monitor className="text-emerald-300"/><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">Cosmic Kiosk</h2><p className="text-xs text-white/45">Raspberry Pi · future device profile</p></div><span className="rounded-full bg-slate-400/15 px-2 py-1 text-xs text-slate-300">Not linked</span></div>
          <div className="mt-4 grid min-h-44 place-content-center gap-3 rounded-xl border border-violet-300/15 bg-gradient-to-br from-indigo-950 via-[#26124b] to-[#080b22] text-center"><Sparkles size={32} className="mx-auto text-violet-300"/><strong className="text-2xl tracking-wide">Cosmos</strong><span className="text-xs text-white/45">Display preview · no live feed</span></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-white/5 p-3"><div className="text-white/40">Connection</div><div className="mt-1 font-medium">Unlinked</div></div><div className="rounded-lg bg-white/5 p-3"><div className="text-white/40">Last sync</div><div className="mt-1 font-medium">—</div></div><div className="rounded-lg bg-white/5 p-3"><div className="text-white/40">Version</div><div className="mt-1 font-medium">Unknown</div></div></div>
          <button className={button+" mt-3 w-full"} onClick={() => setActive("Kiosk")}>Configure future controls <ChevronRight className="inline h-4 w-4"/></button>
        </section>
        <section className={panel+" min-w-0 p-4"}>
          <div className="flex items-center gap-3"><Glasses className="text-indigo-300"/><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">Even G2</h2><p className="text-xs text-white/45">Wearable display · planned integration</p></div><span className="rounded-full bg-indigo-400/15 px-2 py-1 text-xs text-indigo-200">Prototype</span></div>
          <div className="mt-4 grid min-h-44 place-content-center gap-3 rounded-xl border border-violet-300/15 bg-gradient-to-br from-slate-950 via-indigo-950 to-[#111630] text-center"><Glasses size={76} strokeWidth={1} className="mx-auto text-indigo-200/85"/><p className="text-sm text-white/50">Device not connected</p></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/5 p-3 text-white/50">Battery <span className="float-right text-white">—</span></div><div className="rounded-lg bg-white/5 p-3 text-white/50">Signal <span className="float-right text-white">—</span></div><div className="rounded-lg bg-white/5 p-3 text-white/50">Resolution <span className="float-right text-white">TBD</span></div><div className="rounded-lg bg-white/5 p-3 text-white/50">Mode <span className="float-right text-white">Preview</span></div></div>
          <button className={button+" mt-3 w-full"} onClick={() => setActive("Even G2")}>View profile <ChevronRight className="inline h-4 w-4"/></button>
        </section>
        <section className={panel+" p-4"}>
          <div className="flex items-center gap-2"><Zap size={20} className="text-violet-300"/><h2 className="text-lg font-semibold">Quick Controls</h2></div>
          <p className="mt-2 text-xs text-white/45">Preview only. No control is sent to a device.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">{actions.map(({label,icon:Icon})=><button key={label} onClick={()=>notify(label+" is unavailable until a compatible device is connected.")} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-indigo-600/15 p-2 text-center text-xs text-white/75 hover:bg-indigo-600/25"><Icon className="text-violet-300" size={24}/>{label}</button>)}</div>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-[.9fr_1.2fr_.9fr]">
        <section className={panel+" p-4"}><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Monitor className="text-violet-300" size={20}/>Displays</h2><button className="text-xs text-violet-200" onClick={()=>setActive("Displays")}>View all →</button></div><div className="mt-4 space-y-2">{["Lobby TV", "Desk Monitor"].map((name,i)=><button onClick={()=>setActive("Displays")} key={name} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left"><Monitor className="text-violet-200"/><div className="flex-1"><p className="text-sm font-medium">{name}</p><p className="text-xs text-white/45">{i===0?"Planned kiosk display":"Planned desktop display"}</p></div><span className="text-xs text-white/40">Unlinked</span></button>)}</div></section>
        <section className={panel+" min-w-0 p-4"}><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Kiosk Content Sequence</h2><span className="text-xs text-white/45">{total}s per cycle</span></div><p className="mt-1 text-xs text-white/45">Saved locally as a future display profile</p><div className="mt-4 flex gap-2 overflow-x-auto pb-2">{enabled.map((item)=><div key={item.name} className="flex min-h-28 min-w-24 flex-col items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-gradient-to-br from-indigo-950 to-violet-950 p-3 text-center"><Sparkles className="text-violet-300" size={20}/><span className="text-xs">{item.name}</span><span className="text-[11px] text-white/45">{item.seconds}s</span></div>)}</div>{!enabled.length&&<p className="mt-3 text-sm text-white/55">Enable modules to build a sequence.</p>}</section>
        <section className={panel+" p-4"}><div className="flex items-center gap-2"><Settings2 size={20} className="text-violet-300"/><h2 className="font-semibold">Kiosk Content</h2></div><div className="mt-3 space-y-2">{modules.map((item,i)=>{const Icon=icons[i];return <label key={item.name} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-xs hover:bg-white/5"><Icon className="text-indigo-300" size={16}/><span className="flex-1">{item.name}</span><input type="checkbox" checked={item.enabled} onChange={()=>toggle(item.name)} className="accent-violet-500"/></label>})}</div></section>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className={panel+" p-4"}><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold"><Play size={19} className="text-violet-300"/>Slideshow Preview</h2><p className="mt-1 text-xs text-white/45">Select a module to preview its position in the sequence.</p></div><span className="text-xs text-amber-200">Local preview</span></div><div className="mt-4 flex gap-2 overflow-x-auto">{modules.map((item,i)=><button key={item.name} onClick={()=>setSelected(i)} className={`min-w-28 rounded-xl border p-3 text-left text-sm ${selected===i?"border-violet-300 bg-violet-600/25":"border-white/10 bg-white/5"}`}><div className="font-medium">{item.name}</div><p className="mt-2 text-xs text-white/50">{item.enabled?item.seconds+" seconds":"Disabled"}</p></button>)}</div></section>
        <section className={panel+" p-4"}><h2 className="flex items-center gap-2 font-semibold"><HeartPulse size={20} className="text-violet-300"/>Device Health</h2><p className="mt-2 text-sm text-white/50">Telemetry will appear once a device is connected.</p><div className="mt-5 grid grid-cols-4 gap-2 text-center">{["CPU","RAM","Storage","Temp"].map((item)=><div key={item} className="grid aspect-square place-content-center rounded-full border-4 border-slate-600/50"><span className="text-xs text-white/55">{item}</span><strong>—</strong></div>)}</div></section>
      </div>
    </> : <section className={panel+" p-6 sm:p-8"}><div className="flex items-center gap-3"><Settings2 size={24} className="text-violet-300"/><h2 className="text-2xl font-semibold">{active}</h2></div><p className="mt-2 max-w-2xl text-sm text-white/55">{active==="Kiosk"?"Design and save your kiosk control preferences before linking any physical kiosk.":active==="Even G2"?"Reserve an integration profile for wearable displays. No simulator or glasses are connected here.":active==="Displays"?"Manage display profiles and future screen assignments.":active==="Integrations"?"Future device connections will be configured here once adapters are available.":"Future automation rules will be managed here, with explicit permissions and device support."}</p><div className="mt-5 rounded-xl border border-dashed border-violet-300/20 bg-violet-500/5 p-6 text-sm text-white/55">M3.1 scaffold · no active device integrations yet.</div><button className={button+" mt-5"} onClick={()=>setActive("Overview")}>Back to overview</button></section>}
  </div>;
}
