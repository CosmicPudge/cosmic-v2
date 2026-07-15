"use client";

import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import UniverseGrid from "../layout/DashboardGrid";
import StatusBar from "../layout/StatusBar";
import { useEffect, useState } from "react";
import { CosmicBoot } from "@/components/os/boot";

import CosmicLauncher from "../launcher/CosmicLauncher";

import { OSProvider, useOS } from "./OSProvider";
import ModeManager from "./ModeManager";
import CosmicBackground from "../background/CosmicBackground";

export default function CosmicShell() {
  return (
    <OSProvider>
      <ModeManager />
      <CosmicBoot>
        <Desktop />
      </CosmicBoot>
    </OSProvider>
    
  );
}

function Desktop() {
  const [launcherOpen, setLauncherOpen] =
  useState(false);

  useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();

      setLauncherOpen(true);
    }

    if (e.key === "Escape") {
      setLauncherOpen(false);
    }
  }

  window.addEventListener("keydown", onKeyDown);

  return () =>
    window.removeEventListener("keydown", onKeyDown);
}, []);

  return (
  <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
    <CosmicLauncher
  open={launcherOpen}
  onClose={() => setLauncherOpen(false)}
/>
    <CosmicBackground />

    <div className="relative z-10 flex h-full flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-6">
          <UniverseGrid />
        </main>
      </div>

      <StatusBar />
    </div>
  </div>
);
}