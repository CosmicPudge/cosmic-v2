"use client";

import "@/apps";

import ModeManager from "./ModeManager";
import { OSProvider } from "./OSProvider";
import { BootProvider } from "@/components/os/boot/BootManager";
import { WindowProvider } from "@/components/os/window";


import { Dashboard } from "@/components/dashboard";

import AnimatedBackground from "../background/AnimatedBackground";
import WindowManager from "../window/WindowManager";

export default function OperatingSystem() {
  return (
    <OSProvider>
      <BootProvider>
        <WindowProvider>
          <ModeManager />
          <Desktop />
        </WindowProvider>
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

      <WindowManager />
    </div>
  );
}