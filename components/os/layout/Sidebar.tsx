"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, CarFront, CheckCheck, CircleHelp, Clapperboard, FileText, FolderKanban, GraduationCap, Heart, Home, LayoutGrid, Menu, Monitor, Plane, Settings, Sparkles, Trophy, Wallet, X, type LucideIcon } from "lucide-react";

import { useOptionalBoot } from "@/components/os/boot/BootManager";
import { useCosmicTransition } from "@/components/os/transition";
import { cosmosNavigation, cosmosNavigationItemForPath } from "@/config/cosmosNavigation";

const sidebarIcons: Record<string, LucideIcon> = {
  home: Home, school: LayoutGrid, calendar: CalendarDays, tasks: CheckCheck,
  projects: FolderKanban, notes: FileText, finance: Wallet, health: Heart,
  garage: CarFront, sports: Trophy, media: Clapperboard, cosmic: Sparkles,
  devices: Monitor, settings: Settings, travel: Plane,
};

export default function Sidebar({ variant = "side" }: { variant?: "side" | "top" }) {
  const pathname = usePathname() ?? "/os";
  const boot = useOptionalBoot();
  const { prefetch } = useCosmicTransition();
  const [open, setOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const activeItem = cosmosNavigationItemForPath(pathname);

  useEffect(() => {
    boot?.complete("sidebar");
  }, [boot]);


  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const renderNavigation = (items: typeof cosmosNavigation, label: string) => (
    <nav className="space-y-1" aria-label={label}>
      {items.map((item) => {
        const active = activeItem?.id === item.id;
        const NavIcon = sidebarIcons[item.id] ?? CircleHelp;
        return (
          <Link
            key={item.id}
            href={item.route}
            aria-current={active ? "page" : undefined}
            title={item.description}
            onMouseEnter={() => prefetch(item.route)}
            onFocus={() => prefetch(item.route)}
            onClick={() => setOpen(false)}
            className={`cosmos-nav-item ${active ? "cosmos-nav-item-active" : ""}`}
          >
            <NavIcon size={20} strokeWidth={1.9} aria-hidden="true" className="cosmos-reference-nav-icon shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const primaryNavigation = renderNavigation(cosmosNavigation.filter((item) => item.id !== "settings"), "Cosmos navigation");
  const settingsNavigation = renderNavigation(cosmosNavigation.filter((item) => item.id === "settings"), "Cosmos settings");

  if (variant === "top") {
    return (
      <aside ref={navigationRef} data-cosmic-navigation className="cosmos-mobile-nav lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/os" className="cosmos-brand" aria-label="Cosmos home">
            <span className="cosmos-brand-mark" aria-hidden="true"><Sparkles size={23} strokeWidth={2.5} /></span>
            <span>
              <span className="cosmos-brand-name">COSMOS</span>
              <span className="cosmos-brand-tagline">Everything in orbit.</span>
            </span>
          </Link>
          <button
            type="button"
            className="cosmos-icon-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {open && (
          <div className="mt-3 max-h-[70vh] overflow-y-auto border-t border-white/10 pt-3">
            {primaryNavigation}
            <div className="mt-3 border-t border-white/10 pt-3">{settingsNavigation}</div>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      ref={navigationRef}
      data-cosmic-navigation
      className="cosmos-sidebar hidden lg:flex"
    >
      <Link href="/os" className="cosmos-brand" aria-label="Cosmos home">
        <span className="cosmos-brand-mark" aria-hidden="true"><Sparkles size={23} strokeWidth={2.5} /></span>
        <span className="min-w-0">
          <span className="cosmos-brand-name">COSMOS</span>
          <span className="cosmos-brand-tagline">Everything in orbit.</span>
        </span>
      </Link>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        {primaryNavigation}
      </div>

      <div className="mt-5 border-t border-white/10 pt-3">
        {settingsNavigation}
      </div>
    </aside>
  );
}
