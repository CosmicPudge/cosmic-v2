"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import "@/apps";

import ModeManager from "./ModeManager";
import { OSProvider } from "./OSProvider";
import { BootProvider } from "@/components/os/boot/BootManager";
import { WindowProvider } from "@/components/os/window";


import { Dashboard } from "@/components/dashboard";

import useIdleAmbient from "@/hooks/os/useIdleAmbient";
import WindowManager from "../window/WindowManager";
import Sidebar from "@/components/os/layout/Sidebar";
import CosmosTopBar from "@/components/os/layout/CosmosTopBar";

export default function OperatingSystem() {
  useIdleAmbient();

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
    <div data-cosmic-os-root className="cosmic-os-root cosmic-site-shell cosmos-app-shell relative min-h-screen w-full text-white">
      <div className="cosmic-stars pointer-events-none absolute inset-0" />
      <div className="cosmos-mobile-shell relative z-20 p-3 lg:hidden">
        <Sidebar variant="top" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px]">
        <Sidebar />
        <div className="min-w-0 flex-1 px-3 pb-5 sm:px-5 lg:px-6 lg:pb-6">
          <CosmosTopBar />
          <div data-cosmic-workspace className="cosmic-os-workspace cosmos-page-slot">
            <DashboardBoundary><Dashboard /></DashboardBoundary>
          </div>
        </div>
      </div>

      <WindowManager />
    </div>
  );
}

class DashboardBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error("[cosmic-dashboard] degraded", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <section className="cosmic-content-surface m-2 grid min-h-[70vh] place-items-center rounded-3xl p-8 text-center"><div><p className="cosmic-kicker">Dashboard degraded</p><h1 className="mt-3 text-2xl font-light text-white">Your workspace could not be restored.</h1><p className="mt-2 max-w-md text-sm text-white/55">Your navigation is still available. Try refreshing the Dashboard or opening another Cosmic module.</p><button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl border border-violet-300/30 bg-violet-400/15 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-400/25 focus-visible:outline-2 focus-visible:outline-cyan-200">Reload Dashboard</button></div></section>;
    }
    return this.props.children;
  }
}
