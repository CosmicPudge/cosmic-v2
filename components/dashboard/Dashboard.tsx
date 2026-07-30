"use client";

import DashboardHero from "@/components/dashboard/hero/DashboardHero";
import { DASHBOARD_LAYOUTS } from "@/components/dashboard/layout/dashboardLayouts";
import DashboardRegion from "@/components/dashboard/layout/DashboardRegion";
import {
  ExpandedWidgetProvider,
} from "@/components/dashboard/expanded";
import ExpandedWidgetOverlay from "@/components/dashboard/expanded/ExpandedWidgetOverlay";

import AssistantDock from "./assistant/AssistantDock";
import WidgetGrid from "./grid/WidgetGrid";
import { DashboardProvider } from "./state/useDashboard";
import { useDashboardShortcuts } from "./state/useDashboardShortcuts";

import { useDisplay } from "@/components/os/display";

function DashboardContent() {
  useDashboardShortcuts();

  const { profile } = useDisplay();

  const layout = DASHBOARD_LAYOUTS[profile];

  return (
    <main
      className="mx-auto flex h-full flex-col"
      style={{
        maxWidth: layout.maxWidth,
        gap: layout.sectionGap,
        paddingInline: layout.paddingInline,
        paddingBottom: layout.paddingBottom,
      }}
    >
      <DashboardRegion>
        <DashboardHero />
      </DashboardRegion>

      <DashboardRegion>
        <WidgetGrid />
      </DashboardRegion>

      <DashboardRegion
        style={{
          marginTop: layout.dockMarginTop,
        }}
      >
        <AssistantDock />
      </DashboardRegion>
    </main>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
  <ExpandedWidgetProvider>
    <DashboardContent />
    <ExpandedWidgetOverlay />
  </ExpandedWidgetProvider>
</DashboardProvider>
  );
}