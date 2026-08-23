"use client";

import { useDisplay } from "@/components/os/display";

import { dashboardWidgets } from "@/config/widgets";

import { WIDGET_REGISTRY } from "@/components/dashboard/layout/widgetRegistry";
import { WIDGET_LAYOUTS } from "@/components/dashboard/layout/widgetLayouts";

import { GRID_PROFILES } from "./gridProfiles";
import GridItem from "./GridItem";
import { GridProvider } from "./GridContext";
import { useGridLayout } from "./useGridLayout";
import { useSettingsRepository } from "@/services/settings/localRepository";
import AdSlot from "@/components/ads/AdSlot";
import { getDashboardAdPlan } from "@/core/contracts/Advertising";

export default function WidgetGrid() {
  const { data: settings } = useSettingsRepository();
  const moduleByWidget: Record<string, keyof typeof settings.preferences.modules | undefined> = { sports: "sports", finance: "finance", school: "school", garage: "garage", projects: "projects", notes: "notes", calendar: "calendar", outlook: "mail" };
  const widgets = useGridLayout(
    dashboardWidgets.filter((widget) =>
      WIDGET_REGISTRY.find(
        (entry) =>
          entry.id === widget.id &&
          entry.enabled
      ) && (settings.preferences.dashboard.visibleWidgets.length === 0 || settings.preferences.dashboard.visibleWidgets.includes(widget.id)) && (moduleByWidget[widget.id] ? settings.preferences.modules[moduleByWidget[widget.id]!] : true)
    ),
    settings.preferences.dashboard.widgetOrder,
  );

  const { profile, tokens } = useDisplay();

  const grid = GRID_PROFILES[profile];
  const adPlan = getDashboardAdPlan(widgets.length);

  void WIDGET_LAYOUTS;

  return (
    <GridProvider>
      <section
        className="grid w-full pt-2"
        style={{
          gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
          gridAutoRows: `${grid.rowHeight}px`,
          gap: tokens.widgetGap,
        }}
      >
        {widgets.flatMap((widget, index) => {
          const ad = adPlan.find((item) => item.afterIndex === index + 1);
          return [
            <GridItem key={widget.id} widget={widget} />,
            ...(ad ? [<AdSlot key={ad.placementId} placementId={ad.placementId} fullRow />] : []),
          ];
        })}
      </section>
    </GridProvider>
  );
}
