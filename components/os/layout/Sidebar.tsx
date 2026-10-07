"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, MonitorUp, X } from "lucide-react";

import { CosmicIcon } from "@/components/cosmic-icons";
import { useOptionalBoot } from "@/components/os/boot/BootManager";
import { useCosmicTransition } from "@/components/os/transition";
import { useKioskPresentation } from "@/hooks/os/useKioskPresentation";
import { cosmosNavigation, cosmosNavigationItemForPath } from "@/config/cosmosNavigation";

export default function Sidebar({ variant = "side" }: { variant?: "side" | "top" }) {
  const pathname = usePathname() ?? "/os";
  const boot = useOptionalBoot();
  const { prefetch } = useCosmicTransition();
  const { enterManual } = useKioskPresentation();
  const [open, setOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const activeItem = cosmosNavigationItemForPath(pathname);

  useEffect(() => {
    boot?.complete("sidebar");
  }, [boot]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const navigation = (
    <nav className="space-y-1" aria-label="Cosmos navigation">
      {cosmosNavigation.map((item) => {
        const active = activeItem?.id === item.id;
        return (
          <Link
            key={item.id}
            href={item.route}
            aria-current={active ? "page" : undefined}
            title={item.description}
            onMouseEnter={() => prefetch(item.route)}
            onFocus={() => prefetch(item.route)}
            className={`cosmos-nav-item ${active ? "cosmos-nav-item-active" : ""}`}
          >
            <CosmicIcon
              icon={item.icon}
              size={25}
              state={active ? "active" : "idle"}
              className="shrink-0"
            />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (variant === "top") {
    return (
      <aside ref={navigationRef} data-cosmic-navigation className="cosmos-mobile-nav lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/os" className="cosmos-brand" aria-label="Cosmos home">
            <span className="cosmos-brand-mark" aria-hidden="true">◎</span>
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
            {navigation}
            <button type="button" onClick={enterManual} className="cosmos-kiosk-button mt-3 w-full">
              <MonitorUp size={17} />
              Kiosk mode
            </button>
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
        <span className="cosmos-brand-mark" aria-hidden="true">◎</span>
        <span className="min-w-0">
          <span className="cosmos-brand-name">COSMOS</span>
          <span className="cosmos-brand-tagline">Everything in orbit.</span>
        </span>
      </Link>

      <div className="mt-7 min-h-0 flex-1 overflow-y-auto pr-1">
        {navigation}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <button type="button" onClick={enterManual} className="cosmos-kiosk-button w-full">
          <MonitorUp size={17} />
          Kiosk mode
        </button>
        <p className="mt-3 px-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
          Cosmos · personal workspace
        </p>
      </div>
    </aside>
  );
}
