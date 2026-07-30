import type { DisplayProfile } from "@/components/os/display";

export interface WidgetLayout {
  colSpan: number;
  rowSpan: number;
}

export type WidgetLayoutMap = Record<
  DisplayProfile,
  WidgetLayout
>;

export const WIDGET_LAYOUTS: Record<
  string,
  WidgetLayoutMap
> = {
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