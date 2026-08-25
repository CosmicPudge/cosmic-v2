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
    columns: 2,
    rowHeight: 185,
  },

  comfortable: {
    columns: 4,
    rowHeight: 190,
  },

  expanded: {
    columns: 6,
    rowHeight: 195,
  },
};
