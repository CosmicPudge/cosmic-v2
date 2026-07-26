"use client";

import DashboardHero from "@/components/dashboard/hero/DashboardHero";

import AssistantDock from "./assistant/AssistantDock";
import WidgetGrid from "./grid/WidgetGrid";
import { DashboardProvider } from "./state/useDashboard";
import { useDashboardShortcuts } from "./state/useDashboardShortcuts";

import { useDisplay } from "@/components/os/display";

function DashboardContent() {
  useDashboardShortcuts();

  const { tokens, profile } = useDisplay();

  const maxWidth =
    profile === "expanded"
      ? 2200
      : profile === "comfortable"
        ? 1800
        : profile === "compact"
          ? 1400
          : "100%";

  return (
    <main
      className="mx-auto flex h-full flex-col"
      style={{
        maxWidth,
        gap: tokens.widgetGap,
        paddingInline: tokens.spacing.sm,
        paddingBottom: tokens.spacing.lg,
      }}
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