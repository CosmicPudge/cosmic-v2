"use client";

import { useEffect, useMemo } from "react";

import DashboardHero from "@/components/dashboard/hero/DashboardHero";
import { DASHBOARD_LAYOUTS } from "@/components/dashboard/layout/dashboardLayouts";
import DashboardRegion from "@/components/dashboard/layout/DashboardRegion";
import {
  ExpandedWidgetProvider,
} from "@/components/dashboard/expanded";
import ExpandedWidgetOverlay from "@/components/dashboard/expanded/ExpandedWidgetOverlay";
import ContextFocus from "@/components/dashboard/context/ContextFocus";

import AssistantDock from "./assistant/AssistantDock";
import WidgetGrid from "./grid/WidgetGrid";
import { DashboardProvider } from "./state/useDashboard";
import { useDashboardShortcuts } from "./state/useDashboardShortcuts";

import { useDisplay } from "@/components/os/display";
import { useCosmicTransition, useRouteReadiness } from "@/components/os/transition";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { useCosmicScope } from "@/services/storage/scope";
import { DashboardReadinessProvider, getCriticalDashboardWidgetIds, useDashboardReadiness } from "@/components/dashboard/readiness/DashboardReadiness";

function DashboardContent() {
  useDashboardShortcuts();

  const { profile } = useDisplay();

  const layout = DASHBOARD_LAYOUTS[profile];

  return (
    <main
      data-dashboard-root
      className="mx-auto flex w-full min-w-0 flex-col"
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
        <ContextFocus />
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

function DashboardReady() {
  const { account, loading: accountLoading } = useCosmicAccount();
  const { loading: entitlementsLoading } = useEntitlements();
  const settings = useSettingsRepository();
  const scope = useCosmicScope();
  const dashboard = useDashboardReadiness();
  const { setDashboardReadiness } = useCosmicTransition();
  const baseReady = !accountLoading && !entitlementsLoading && settings.ready && (account ? scope.id === `account-${account.id}` : scope.id === "local");
  useRouteReadiness("/os", baseReady && dashboard.shellReady && dashboard.criticalReady, dashboard.widgets.some((item) => item.status === "degraded") ? "degraded" : "ready");
  useEffect(() => { setDashboardReadiness(dashboard); }, [dashboard, setDashboardReadiness]);
  return null;
}

export default function Dashboard() {
  const { profile, height } = useDisplay();
  const { data: settings } = useSettingsRepository();
  const { data: entitlements } = useEntitlements();
  const scope = useCosmicScope();
  const criticalWidgetIds = useMemo(() => getCriticalDashboardWidgetIds(settings, profile, height, entitlements.features["school.basic"]), [entitlements.features, height, profile, settings]);
  return (
    <DashboardProvider>
  <DashboardReadinessProvider key={scope.id} criticalWidgetIds={criticalWidgetIds}>
    <DashboardReady />
  <ExpandedWidgetProvider>
    <DashboardContent />
    <ExpandedWidgetOverlay />
  </ExpandedWidgetProvider>
  </DashboardReadinessProvider>
</DashboardProvider>
  );
}
