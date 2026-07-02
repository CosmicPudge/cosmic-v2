"use client";

import AnimatedBackground from "../effects/AnimatedBackground";
import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import UniverseGrid from "../layout/DashboardGrid";
import StatusBar from "../layout/StatusBar";

import { OSProvider, useOS } from "./OSProvider";

export default function CosmicShell() {
  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
}

function Desktop() {

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

      <StatusBar />
    </div>
  </div>
);
}