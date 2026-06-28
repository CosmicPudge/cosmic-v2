"use client";

import AnimatedBackground from "../effects/AnimatedBackground";
import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import UniverseGrid from "../layout/UniverseGrid";
import Dock from "../layout/Dock";
import StatusBar from "../layout/StatusBar";
import WindowManager from "../windows/WindowManager";

import { OSProvider, useOS } from "../core/OSProvider";

export default function CosmicShell() {
  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
}

function Desktop() {
  const { openWindows } = useOS();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <AnimatedBackground />

      <div className="relative z-10 flex h-full flex-col">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-auto p-6">
            <UniverseGrid />
          </main>
        </div>

        <WindowManager />
        <Dock />
        <StatusBar />
      </div>
    </div>
  );
}