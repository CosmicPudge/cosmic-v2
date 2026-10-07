"use client";

import { PanelsTopLeft } from "lucide-react";
import { useSettingsData } from "@/components/apps/settings/SettingsProvider";

export default function FoundationSurfaceToggle() {
  const settings = useSettingsData();
  const style = settings.data.appearance.surfaceStyle ?? "glass";

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
      <span className="hidden items-center gap-2 px-2 text-xs text-white/45 sm:inline-flex">
        <PanelsTopLeft size={14} />
        Surface
      </span>
      {(["glass", "solid"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => settings.setSurfaceStyle(value)}
          aria-pressed={style === value}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${style === value ? "bg-violet-400/15 text-violet-100" : "text-white/45 hover:bg-white/[0.05] hover:text-white"}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
