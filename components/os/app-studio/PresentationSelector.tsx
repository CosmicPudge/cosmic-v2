"use client";

import { Grid2X2, Maximize2, Monitor } from "lucide-react";

import type { AppPresentation } from "@/apps/core";

const options = [
  { value: "widget", label: "Widget", Icon: Grid2X2 },
  { value: "window", label: "Window", Icon: Monitor },
  { value: "fullscreen", label: "Fullscreen", Icon: Maximize2 },
] as const;

interface Props { value: AppPresentation; onChange: (value: AppPresentation) => void; }

export default function PresentationSelector({ value, onChange }: Props) {
  return <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-1" role="group" aria-label="Presentation">
    {options.map(({ value: option, label, Icon }) => <button key={option} type="button" onClick={() => onChange(option)} aria-pressed={value === option} className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${value === option ? "bg-white/15 text-white shadow-sm" : "text-white/45 hover:text-white/75"}`}><Icon size={16} />{label}</button>)}
  </div>;
}
