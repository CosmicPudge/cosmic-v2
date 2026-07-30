"use client";

import type { AppPresentation, StudioAppDefinition, WidgetFootprint } from "@/apps/core";

function Item({ label, children }: { label: string; children: React.ReactNode }) { return <div><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">{label}</p><div className="mt-1 text-sm text-white/80">{children}</div></div>; }

export default function DeveloperPanel({ app, presentation, footprint }: { app: StudioAppDefinition; presentation: AppPresentation; footprint: WidgetFootprint }) {
  const supported = app.status === "implemented" ? ["Widget", "Window", "Fullscreen"] : app.supportedPresentations.map((item) => item[0].toUpperCase() + item.slice(1));
  return <aside className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl"><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Developer information</p><div className="mt-5 space-y-5"><Item label="Application">{app.title}</Item><Item label="Status"><span className={app.status === "implemented" ? "text-emerald-200" : "text-sky-200"}>{app.status === "implemented" ? "Implemented" : "Coming Soon"}</span></Item><Item label="Presentation">{presentation}</Item><Item label="Widget footprint">{footprint.cols} × {footprint.rows}</Item><Item label="Supported presentations">{supported.join(" · ")}</Item><Item label="Supported layouts">All 8 widget footprints</Item>{app.status === "coming-soon" && app.plannedFeatures && <Item label="Future features"><ul className="space-y-1 text-white/60">{app.plannedFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></Item>}</div></aside>;
}
