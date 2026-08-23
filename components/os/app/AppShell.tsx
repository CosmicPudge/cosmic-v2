"use client";

import type { BackgroundApp } from "@/components/os/backgrounds/types";
import { usePathname } from "next/navigation";
import { useRouteReadiness } from "@/components/os/transition";

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
  useRouteReadiness(app ? `/${app}` : pathname);
  return (
    <main className="relative min-h-screen overflow-hidden bg-black/15 text-white">
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      <div className="relative z-10 h-screen overflow-y-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        {children}
      </div>
    </main>
  );
}
