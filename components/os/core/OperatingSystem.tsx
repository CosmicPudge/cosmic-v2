"use client";

import ModeManager from "./ModeManager";
import { OSProvider } from "./OSProvider";
import { BootProvider } from "@/components/os/boot/BootManager";
import DashboardGrid from "@/components/os/layout/DashboardGrid";
// import CosmicBackground from "../background/CosmicBackground";

export default function CosmicShell() {
  return (
    <OSProvider>
      <BootProvider>
        <ModeManager />
        <Desktop />
      </BootProvider>
    </OSProvider>
  );
}

function Desktop() {
  return (
    <div
      className="w-screen h-screen overflow-hidden bg-slate-950 text-white"
      style={{ position: "relative" }}
    >
      {/* Background temporarily disabled */}
      {/* <CosmicBackground /> */}

      <div
        className="w-full h-full p-6"
        style={{
          position: "relative",
          zIndex: 10,
        }}
      >
        <DashboardGrid />
      </div>
    </div>
  );
}