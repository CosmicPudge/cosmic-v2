"use client";

import BackgroundEngine from "@/components/os/backgrounds/BackgroundEngine";
import { BackgroundApp } from "@/components/os/backgrounds/types";
// import CosmicBackground from "../background/CosmicBackground";

interface AppShellProps {
  children: React.ReactNode;
  app?: BackgroundApp;
  context?: unknown;
}

export default function AppShell({
  children,
  app,
  context,
}: AppShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-white">
      {app && (
        <BackgroundEngine
          app={app}
          context={context}
        />
      )}

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 h-screen overflow-y-auto px-12 py-10">
        {children}
      </div>

      {/* <CosmicBackground /> */}
    </main>
  );
}