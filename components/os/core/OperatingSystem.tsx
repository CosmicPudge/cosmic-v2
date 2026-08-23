"use client";

import "@/apps";

import ModeManager from "./ModeManager";
import { OSProvider } from "./OSProvider";
import { BootProvider } from "@/components/os/boot/BootManager";
import { WindowProvider } from "@/components/os/window";


import { Dashboard } from "@/components/dashboard";

import useIdleAmbient from "@/hooks/os/useIdleAmbient";
import WindowManager from "../window/WindowManager";
import { useRouteReadiness } from "@/components/os/transition";

export default function OperatingSystem() {
  useIdleAmbient();
  useRouteReadiness("/os");

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
      <div className="relative z-10 h-full overflow-y-auto pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Dashboard />
      </div>

      <WindowManager />
    </div>
  );
}
