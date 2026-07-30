"use client";

import "@/apps";

import { Moon, RotateCcw, SlidersHorizontal, Sun } from "lucide-react";
import { useMemo, useState } from "react";

import { getStudioApps } from "@/apps/core";
import { AppPreview, AppSidebar, DeveloperPanel, PresentationSelector } from "@/components/os/app-studio";
import { WidgetResizer } from "@/components/os/layout/WidgetResizer";

import type { AppPresentation, WidgetFootprint } from "@/apps/core";

type Appearance = "dark" | "light";

const initialFootprint: WidgetFootprint = { cols: 2, rows: 2 };

function ControlLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">{children}</span>;
}

export default function AppsLabPage() {
  const apps = useMemo(() => getStudioApps(), []);
  const [appId, setAppId] = useState(apps.find((app) => app.status === "implemented")?.id ?? apps[0]?.id ?? "");
  const [presentation, setPresentation] = useState<AppPresentation>("widget");
  const [footprint, setFootprint] = useState<WidgetFootprint>(initialFootprint);
  const [appearance, setAppearance] = useState<Appearance>("dark");
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const app = apps.find((entry) => entry.id === appId);

  const reset = () => { setPresentation("widget"); setFootprint(initialFootprint); setScale(1); setShowGrid(true); setPreviewKey((key) => key + 1); };

  if (!app) return <main className="grid min-h-screen place-items-center bg-[#080b13] text-white">No applications are registered.</main>;

  return <main className={`min-h-screen overflow-x-hidden ${appearance === "dark" ? "bg-[#080b13] text-white" : "bg-[#e9eef6] text-slate-950"}`}><div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-24 top-[-9rem] size-[32rem] rounded-full bg-sky-500/15 blur-[110px]" /><div className="absolute -right-28 bottom-[-12rem] size-[36rem] rounded-full bg-violet-500/15 blur-[130px]" /><div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" /></div><div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col px-4 py-4 sm:px-6 lg:px-8"><header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-white/[0.055] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:px-6"><div className="flex min-w-0 items-center gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-500 text-slate-950 shadow-[0_0_28px_rgba(96,165,250,0.45)]"><SlidersHorizontal size={19} strokeWidth={2.5} /></div><div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200/70">Cosmic developer tools</p><h1 className="text-lg font-semibold tracking-tight sm:text-xl">Cosmic App Studio</h1></div></div><div className="flex items-center gap-2"><button type="button" onClick={() => setAppearance((value) => value === "dark" ? "light" : "dark")} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/75 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" aria-label={`Switch to ${appearance === "dark" ? "light" : "dark"} appearance`}>{appearance === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><button type="button" onClick={reset} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><RotateCcw size={15} />Reset</button></div></header><div className="grid flex-1 gap-4 xl:grid-cols-[250px_minmax(0,1fr)_270px]"><AppSidebar apps={apps} selectedId={appId} onSelect={setAppId} /><div className="flex min-w-0 flex-col gap-4"><section className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl"><div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><div><ControlLabel>Selected application</ControlLabel><p className="text-lg font-semibold text-white">{app.title}</p><p className="mt-1 text-sm text-white/55">{app.description}</p></div><div><ControlLabel>Presentation</ControlLabel><PresentationSelector value={presentation} onChange={setPresentation} /></div><WidgetResizer value={footprint} onChange={setFootprint} /></div><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4"><label className="flex min-w-48 flex-1 items-center gap-3 text-sm text-white/65"><span className="whitespace-nowrap">Preview scale {Math.round(scale * 100)}%</span><input className="w-full accent-sky-300" type="range" min="0.65" max="1.15" step="0.05" value={scale} onChange={(event) => setScale(Number(event.target.value))} /></label><label className="flex cursor-pointer items-center gap-2 text-sm text-white/65"><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} className="size-4 accent-sky-300" />Show layout grid</label></div></section><AppPreview app={app} presentation={presentation} footprint={footprint} scale={scale} showGrid={showGrid} previewKey={previewKey} /></div><DeveloperPanel app={app} presentation={presentation} footprint={footprint} /></div></div></main>;
}
