import type { DisplayProfile } from "@/components/os/display";
import type { WidgetSize } from "@/components/os/ui/widget";

export interface WidgetLayout {
  colSpan: number;
  rowSpan: number;
}

export function getWidgetSize(layout: WidgetLayout): WidgetSize {
  if (
    !Number.isFinite(layout.colSpan) ||
    !Number.isFinite(layout.rowSpan) ||
    layout.colSpan < 1 ||
    layout.rowSpan < 1
  ) {
    return "medium";
  }

  // Dashboard app footprints are currently constrained to 1–4 columns and
  // 1–2 rows. Resolve semantic sizes from those final, rendered dimensions.
  if (layout.colSpan >= 4 && layout.rowSpan >= 2) return "large";
  if (layout.colSpan >= 3 || layout.rowSpan >= 2) return "medium";
  return "small";
}

export type WidgetLayoutMap = Record<
  DisplayProfile,
  WidgetLayout
>;

export const WIDGET_LAYOUTS: Record<
  string,
  WidgetLayoutMap
> = {
  clock: {
    expanded: { colSpan: 2, rowSpan: 1 },
    comfortable: { colSpan: 2, rowSpan: 1 },
    compact: { colSpan: 3, rowSpan: 2 },
    pocket: { colSpan: 12, rowSpan: 2 },
  },

  weather: {
    expanded: { colSpan: 4, rowSpan: 4 },
    comfortable: { colSpan: 4, rowSpan: 4 },
    compact: { colSpan: 6, rowSpan: 4 },
    pocket: { colSpan: 12, rowSpan: 4 },
  },

  school: {
    expanded: { colSpan: 8, rowSpan: 5 },
    comfortable: { colSpan: 8, rowSpan: 5 },
    compact: { colSpan: 12, rowSpan: 5 },
    pocket: { colSpan: 12, rowSpan: 5 },
  },

  calendar: {
    expanded: { colSpan: 4, rowSpan: 3 },
    comfortable: { colSpan: 4, rowSpan: 3 },
    compact: { colSpan: 6, rowSpan: 3 },
    pocket: { colSpan: 12, rowSpan: 3 },
  },

  sports: {
    expanded: { colSpan: 4, rowSpan: 4 },
    comfortable: { colSpan: 4, rowSpan: 4 },
    compact: { colSpan: 6, rowSpan: 4 },
    pocket: { colSpan: 12, rowSpan: 4 },
  },

  assistant: {
    expanded: { colSpan: 12, rowSpan: 2 },
    comfortable: { colSpan: 12, rowSpan: 2 },
    compact: { colSpan: 12, rowSpan: 2 },
    pocket: { colSpan: 12, rowSpan: 2 },
  },
};
