import type { DisplayProfile } from "@/components/os/display";

export interface GridProfile {
  columns: number;
  rowHeight: number;
}

export const GRID_PROFILES: Record<
  DisplayProfile,
  GridProfile
> = {
  pocket: {
    columns: 1,
    rowHeight: 180,
  },

  compact: {
    columns: 6,
    rowHeight: 185,
  },

  comfortable: {
    columns: 8,
    rowHeight: 190,
  },

  expanded: {
    columns: 12,
    rowHeight: 195,
  },
};