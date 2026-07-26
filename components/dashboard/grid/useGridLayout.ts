"use client";

import { useMemo } from "react";

import type { DashboardWidget } from "@/config/widgets";
export function useGridLayout(
  widgets: DashboardWidget[]
) {
  return useMemo(() => {
    return [...widgets].sort((a, b) => {
      return (a.priority ?? 0) - (b.priority ?? 0);
    });
  }, [widgets]);
}