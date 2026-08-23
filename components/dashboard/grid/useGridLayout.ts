"use client";

import { useMemo } from "react";

import type { DashboardWidget } from "@/config/widgets";
export function useGridLayout(
  widgets: DashboardWidget[],
  widgetOrder: string[] = [],
) {
  return useMemo(() => {
    return [...widgets].sort((a, b) => {
      const aIndex = widgetOrder.indexOf(a.id);
      const bIndex = widgetOrder.indexOf(b.id);
      if (aIndex >= 0 || bIndex >= 0) return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
      return (a.priority ?? 0) - (b.priority ?? 0);
    });
  }, [widgets, widgetOrder]);
}
