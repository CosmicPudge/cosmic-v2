"use client";

import { useDisplay } from "@/components/os/display";

import { dashboardWidgets } from "@/config/widgets";

import { WIDGET_REGISTRY } from "@/components/dashboard/layout/widgetRegistry";
import { WIDGET_LAYOUTS } from "@/components/dashboard/layout/widgetLayouts";

import { GRID_PROFILES } from "./gridProfiles";
import GridItem from "./GridItem";
import { GridProvider } from "./GridContext";
import { useGridLayout } from "./useGridLayout";

export default function WidgetGrid() {
  const widgets = useGridLayout(
    dashboardWidgets.filter((widget) =>
      WIDGET_REGISTRY.find(
        (entry) =>
          entry.id === widget.id &&
          entry.enabled
      )
    )
  );

  const { profile, tokens } = useDisplay();

  const grid = GRID_PROFILES[profile];

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
        {widgets.map((widget) => (
          <GridItem
            key={widget.id}
            widget={widget}
          />
        ))}
      </section>
    </GridProvider>
  );
}