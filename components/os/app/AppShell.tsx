"use client";

import type { BackgroundApp } from "@/components/os/backgrounds/types";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useRouteReadiness } from "@/components/os/transition";
import Sidebar from "@/components/os/layout/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  app?: BackgroundApp;
  context?: unknown;
}

export default function AppShell({
  children,
  app,
}: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const mainRef = useRef<HTMLElement>(null);
  useRouteReadiness(app ? `/${app}` : pathname);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement === document.body) mainRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
  return (
    <main ref={mainRef} tabIndex={-1} id="main-content" className="cosmic-site-shell relative min-h-screen overflow-hidden text-white outline-none">
      <div className="cosmic-stars pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex min-h-screen flex-col gap-4 p-3 sm:p-5 lg:flex-row lg:gap-5 lg:p-6">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-hidden lg:min-h-[calc(100vh-3rem)]">{children}</div>
      </div>
    </main>
  );
}
