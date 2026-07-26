"use client";

import ModeManager from "./ModeManager";
import { OSProvider } from "./OSProvider";
import { BootProvider } from "@/components/os/boot/BootManager";
import { Dashboard } from "@/components/dashboard";
import AnimatedBackground from "../background/AnimatedBackground";
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
    <div className="relative h-screen w-screen overflow-hidden text-white">
      <AnimatedBackground />

      <div className="relative z-10 h-full overflow-y-auto p-6">
        <Dashboard />
      </div>
    </div>
  );
}