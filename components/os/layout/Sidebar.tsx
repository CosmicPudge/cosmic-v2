"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { apps } from "@/config/apps";
import { useOptionalBoot } from "@/components/os/boot/BootManager";
import { useCosmicTransition } from "@/components/os/transition";
import { CosmicIcon } from "@/components/cosmic-icons";
import type { CosmicIconName } from "@/components/cosmic-icons";
import { useEntitlements } from "@/hooks/os/useEntitlements";

const sidebarIcons: Record<string, CosmicIconName> = {
  dashboard: "dashboard", search: "search", system: "system", calendar: "calendar", gmail: "gmail",
  outlook: "outlook", school: "school", sports: "sports", garage: "garage", projects: "projects",
  notes: "notes", music: "music", finance: "finance", clock: "clock", files: "data", weather: "weather",
  assistant: "cosmic-ai", settings: "settings",
};

export default function Sidebar() {
  const boot = useOptionalBoot();
  const { prefetch } = useCosmicTransition();
  const pathname = usePathname() ?? "/";
  const { data: entitlements } = useEntitlements();

  useEffect(() => {
    boot?.complete("sidebar");
  }, [boot]);

  return (
    <aside data-cosmic-navigation className="cosmic-sidebar min-w-0 shrink-0 rounded-[clamp(.9rem,1.8vw,1.35rem)] p-[clamp(.5rem,1vw,.75rem)] lg:sticky lg:top-0 lg:w-60">
      <div className="flex h-full min-w-0 flex-col gap-3">
        <Link href="/os" className="flex items-center gap-3 rounded-xl px-3 py-3" onMouseEnter={() => prefetch("/os")} onFocus={() => prefetch("/os")}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-violet-300/60 text-xl text-violet-200 shadow-[0_0_18px_rgba(168,85,247,.28)]">◎</span><span className="hidden min-w-0 lg:block"><span className="block text-sm font-medium tracking-[0.08em] text-white">COSMIC OS</span><span className="block text-[10px] uppercase tracking-[0.16em] text-violet-200/70">Everything in orbit.</span></span></Link>
        <nav className="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible" aria-label="Cosmic applications">
        {apps.filter((app) => app.id !== "school" || entitlements.features["school.basic"]).map((app) => (
          (() => {
            const active = pathname === app.route || (app.route !== "/os" && pathname.startsWith(`${app.route}/`));
            return (
          <Link
            key={app.id}
            href={app.route}
            aria-label={app.name}
            className={`group flex h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-200/60 lg:w-full ${active ? "border border-violet-300/30 bg-violet-400/20 text-white shadow-[0_0_18px_rgba(124,58,237,.22)]" : "text-white/60 hover:bg-white/[.07] hover:text-white"}`}
            title={app.name}
            onMouseEnter={() => prefetch(app.route)}
            onFocus={() => prefetch(app.route)}
          >
            <CosmicIcon icon={sidebarIcons[app.id] ?? "system"} size={32} state={active ? "active" : "idle"} /><span className="hidden truncate lg:block">{app.name}</span>
          </Link>
            );
          })()
        ))}
        </nav>
        <div className="mt-auto hidden rounded-xl border border-violet-200/15 bg-violet-400/[.06] p-3 lg:block"><p className="cosmic-kicker">Cosmic member</p><p className="mt-2 text-sm text-white/75">Everything in orbit.</p><p className="mt-1 text-xs text-violet-200/60">Build. Focus. Transcend.</p></div>
      </div>
    </aside>
  );
}
