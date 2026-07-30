"use client";

import { motion } from "framer-motion";

import type { StudioAppDefinition } from "@/apps/core";

interface Props {
  apps: StudioAppDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function AppSidebar({ apps, selectedId, onSelect }: Props) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-white/[0.055] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
      <div className="px-3 pb-3 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Applications</p>
        <p className="mt-1 text-sm text-white/65">{apps.length} registered</p>
      </div>
      <nav className="grid max-h-[320px] grid-cols-2 gap-1 overflow-y-auto pr-1 xl:max-h-[calc(100vh-10rem)] xl:grid-cols-1" aria-label="Cosmic applications">
        {apps.map((app) => {
          const selected = app.id === selectedId;
          return (
            <motion.button
              key={app.id}
              type="button"
              onClick={() => onSelect(app.id)}
              whileTap={{ scale: 0.98 }}
              className={`relative flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300 ${selected ? "bg-white/14 text-white" : "text-white/60 hover:bg-white/[0.07] hover:text-white"}`}
              aria-current={selected ? "page" : undefined}
            >
              {selected && <motion.span layoutId="app-studio-selection" className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.04]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/15 text-base">{app.icon ?? "✦"}</span>
              <span className="relative min-w-0"><span className="block truncate text-sm font-medium">{app.title}</span><span className="block text-[10px] uppercase tracking-[0.12em] text-white/40">{app.status === "implemented" ? "Ready" : "Coming soon"}</span></span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
