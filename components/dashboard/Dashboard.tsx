"use client";

import DashboardHero from "@/components/dashboard/hero/DashboardHero";

import AssistantDock from "./assistant/AssistantDock";
import WidgetGrid from "./grid/WidgetGrid";
import { DashboardProvider } from "./state/useDashboard";
import { useDashboardShortcuts } from "./state/useDashboardShortcuts";

function DashboardContent() {
  useDashboardShortcuts();

  return (
    <main
      className="
        mx-auto
        flex
        h-full
        max-w-[1800px]
        flex-col
        gap-8
        px-2
        pb-8
      "
    >
      <DashboardHero />

      <WidgetGrid />

      <div className="mt-auto">
        <AssistantDock />
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}