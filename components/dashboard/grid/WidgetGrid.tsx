"use client";

import { dashboardWidgets } from "@/config/widgets";

import GridItem from "./GridItem";
import { GridProvider } from "./GridContext";
import { useGridLayout } from "./useGridLayout";

export default function WidgetGrid() {
  const widgets = useGridLayout(dashboardWidgets);

  return (
    <GridProvider>
      <section
        className="
          grid
          grid-cols-12
          auto-rows-[190px]
          gap-8
          pt-2
          w-full
        "
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