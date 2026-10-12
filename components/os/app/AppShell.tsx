"use client";

import type { BackgroundApp } from "@/components/os/backgrounds/types";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type PointerEvent } from "react";

import Sidebar from "@/components/os/layout/Sidebar";
import CosmosTopBar from "@/components/os/layout/CosmosTopBar";
import { useRouteReadiness } from "@/components/os/transition";

interface AppShellProps {
  children: React.ReactNode;
  app?: BackgroundApp;
  context?: unknown;
}

const backgroundApps: BackgroundApp[] = [
  "dashboard",
  "weather",
  "sports",
  "garage",
  "calendar",
  "assistant",
  "school",
  "music",
  "notes",
  "search",
  "system",
  "outlook",
];

export default function AppShell({ children, app }: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const routeApp = pathname.split("/")[1] as BackgroundApp;
  const pageApp: BackgroundApp = app ?? (backgroundApps.includes(routeApp) ? routeApp : "system");
  const mainRef = useRef<HTMLElement>(null);

  useRouteReadiness(app ? `/${app}` : pathname);

  const updateReflection = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const element = event.target;
    if (!(element instanceof Element)) return;
    const card = element.closest<HTMLElement>(".cosmos-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--glass-reflect-x", String(event.clientX - rect.left) + "px");
    card.style.setProperty("--glass-reflect-y", String(event.clientY - rect.top) + "px");
  };


  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement === document.body) mainRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <main
      ref={mainRef}
      tabIndex={-1}
      id="main-content"
      onPointerMove={updateReflection}
      data-cosmic-app={pageApp}
      className="cosmic-site-shell cosmos-app-shell relative min-h-screen text-white outline-none"
    >
      <div className="cosmic-stars pointer-events-none absolute inset-0" />
      <div className="cosmos-cinematic-scene pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
        <div className="cosmos-cinematic-image" />
        <div className="cosmos-cinematic-overlay" />
      </div>

      <div className="cosmos-mobile-shell relative z-20 p-3 lg:hidden">
        <Sidebar variant="top" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px]">
        <Sidebar />
        <div className="min-w-0 flex-1 px-3 pb-5 sm:px-5 lg:px-6 lg:pb-6">
          <CosmosTopBar />
          <div className="cosmos-page-slot">{children}</div>
        </div>
      </div>
    </main>
  );
}
