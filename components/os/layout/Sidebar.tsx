"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { apps } from "@/config/apps";
import { useOptionalBoot } from "@/components/os/boot/BootManager";
import { useCosmicTransition } from "@/components/os/transition";
import { CosmicIcon } from "@/components/cosmic-icons";
import type { CosmicIconName } from "@/components/cosmic-icons";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { isNavigationRouteActive, navigationModuleEnabled } from "./navigationRoutes";

const sidebarIcons: Record<string, CosmicIconName> = {
  dashboard: "dashboard", search: "search", system: "system", calendar: "calendar", gmail: "gmail",
  outlook: "outlook", school: "school", sports: "sports", garage: "garage", projects: "projects",
  notes: "notes", music: "music", finance: "finance", clock: "clock", files: "data", weather: "weather",
  assistant: "cosmic-ai", settings: "settings",
};

export default function Sidebar({ variant = "side" }: { variant?: "side" | "top" }) {
  const boot = useOptionalBoot();
  const { prefetch } = useCosmicTransition();
  const pathname = usePathname() ?? "/";
  const { data: entitlements } = useEntitlements();
  const { data: settings } = useSettingsRepository();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);

  const visibleApps = useMemo(() => apps.filter((app) => (app.id !== "school" || entitlements.features["school.basic"]) && navigationModuleEnabled(app.id, settings.preferences.modules)), [entitlements.features, settings.preferences.modules]);
  const mobilePrimaryIds = ["dashboard", "calendar", "sports", "search"];
  const mobilePrimary = visibleApps.filter((app) => mobilePrimaryIds.includes(app.id));
  const mobileMore = visibleApps.filter((app) => !mobilePrimaryIds.includes(app.id));

  useEffect(() => {
    boot?.complete("sidebar");
  }, [boot]);

  useEffect(() => {
    if (variant !== "top") return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMoreOpen(false); };
    const closeOnOutside = (event: MouseEvent) => { if (!navigationRef.current?.contains(event.target as Node)) setMobileMoreOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutside);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.removeEventListener("mousedown", closeOnOutside); };
  }, [variant]);

  return (
    <aside ref={navigationRef} data-cosmic-navigation data-navigation-variant={variant} className={`cosmic-sidebar ${variant === "top" ? "cosmic-top-navigation sticky top-0 z-30 w-full" : "min-w-0 shrink-0 lg:sticky lg:top-0 lg:w-60"} rounded-[clamp(.9rem,1.8vw,1.35rem)] p-[clamp(.5rem,1vw,.75rem)]`}>
      <div className={`flex min-w-0 gap-3 ${variant === "top" ? "flex-row items-center" : "h-full flex-col"}`}>
        <Link href="/os" className="flex items-center gap-3 rounded-xl px-3 py-3" onMouseEnter={() => prefetch("/os")} onFocus={() => prefetch("/os")}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-violet-300/60 text-xl text-violet-200 shadow-[0_0_18px_rgba(168,85,247,.28)]">◎</span><span className="hidden min-w-0 lg:block"><span className="block text-sm font-medium tracking-[0.08em] text-white">COSMIC OS</span><span className="block text-[10px] uppercase tracking-[0.16em] text-violet-200/70">Everything in orbit.</span></span></Link>
        <nav className={`${variant === "top" ? "flex flex-1" : "hidden lg:block"} min-w-0 gap-1 overflow-x-auto pb-1 lg:overflow-visible ${variant === "side" ? "lg:space-y-1" : ""}`} aria-label="Cosmic applications">
        {visibleApps.map((app) => (
          (() => {
            const active = isNavigationRouteActive(pathname, app.route);
            return (
          <Link
            key={app.id}
            href={app.route}
            aria-label={app.name}
            aria-current={active ? "page" : undefined}
            className={`group flex h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-200/60 ${variant === "side" ? "lg:w-full" : ""} ${active ? "border border-violet-300/30 bg-violet-400/20 text-white shadow-[0_0_18px_rgba(124,58,237,.22)]" : "text-white/60 hover:bg-white/[.07] hover:text-white"}`}
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
        {variant === "top" && <div className="relative hidden lg:block"><button type="button" aria-label="More Cosmic applications" aria-expanded={mobileMoreOpen} onClick={() => setMobileMoreOpen((open) => !open)} className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/70 transition hover:bg-white/[.07] hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200">More <span aria-hidden="true">•••</span></button>{mobileMoreOpen && <nav className="absolute right-0 top-[calc(100%+.55rem)] z-50 grid max-h-[min(45vh,22rem)] w-[min(26rem,calc(100vw-2rem))] grid-cols-2 gap-1 overflow-y-auto rounded-2xl border border-violet-200/20 bg-[#060b1d]/95 p-2 shadow-2xl backdrop-blur-xl" aria-label="More Cosmic applications">{mobileMore.map((app) => <Link key={app.id} href={app.route} onClick={() => setMobileMoreOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-xs text-white/70 transition hover:bg-white/[.08] hover:text-white"><CosmicIcon icon={sidebarIcons[app.id] ?? "system"} size={22} /><span className="truncate">{app.name}</span></Link>)}</nav>}</div>}
        <nav className="grid grid-cols-5 gap-1 lg:hidden" aria-label="Primary Cosmic applications">
          {mobilePrimary.map((app) => <Link key={app.id} href={app.route} aria-label={app.name} aria-current={isNavigationRouteActive(pathname, app.route) ? "page" : undefined} onClick={() => setMobileMoreOpen(false)} onMouseEnter={() => prefetch(app.route)} className={`flex min-h-11 items-center justify-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${isNavigationRouteActive(pathname, app.route) ? "border border-cyan-200/25 bg-cyan-200/10 text-white" : "text-white/60 hover:bg-white/[.07] hover:text-white"}`} title={app.name}><CosmicIcon icon={sidebarIcons[app.id] ?? "system"} size={25} state={isNavigationRouteActive(pathname, app.route) ? "active" : "idle"} /></Link>)}
          <button type="button" aria-label="More Cosmic applications" aria-expanded={mobileMoreOpen} onClick={() => setMobileMoreOpen((open) => !open)} className={`flex min-h-11 items-center justify-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${mobileMoreOpen ? "border-violet-200/25 bg-violet-200/10 text-white" : "border-transparent text-white/60 hover:bg-white/[.07] hover:text-white"}`}>•••</button>
        </nav>
        {mobileMoreOpen && <nav className="grid max-h-[min(50vh,24rem)] grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-1 lg:hidden" aria-label="More Cosmic applications">
          {mobileMore.map((app) => <Link key={app.id} href={app.route} aria-current={isNavigationRouteActive(pathname, app.route) ? "page" : undefined} onClick={() => setMobileMoreOpen(false)} className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-xs transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${isNavigationRouteActive(pathname, app.route) ? "bg-cyan-200/10 text-white" : "text-white/60 hover:bg-white/[.07] hover:text-white"}`}><CosmicIcon icon={sidebarIcons[app.id] ?? "system"} size={22} state={isNavigationRouteActive(pathname, app.route) ? "active" : "idle"} /><span className="truncate">{app.name}</span></Link>)}
        </nav>}
        {variant === "side" && <div className="mt-auto hidden rounded-xl border border-violet-200/15 bg-violet-400/[.06] p-3 lg:block"><p className="cosmic-kicker">Cosmic member</p><p className="mt-2 text-sm text-white/75">Everything in orbit.</p><p className="mt-1 text-xs text-violet-200/60">Build. Focus. Transcend.</p></div>}
      </div>
    </aside>
  );
}
