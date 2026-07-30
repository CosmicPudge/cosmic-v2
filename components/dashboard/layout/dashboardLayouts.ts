import type { DisplayProfile } from "@/components/os/display";

export interface DashboardLayout {
  maxWidth: number | string;

  paddingInline: number;

  paddingBottom: number;

  sectionGap: number;

  dockMarginTop: "auto";
}

export const DASHBOARD_LAYOUTS: Record<
  DisplayProfile,
  DashboardLayout
> = {
  pocket: {
    maxWidth: "100%",
    paddingInline: 16,
    paddingBottom: 24,
    sectionGap: 16,
    dockMarginTop: "auto",
  },

  compact: {
    maxWidth: 1400,
    paddingInline: 20,
    paddingBottom: 28,
    sectionGap: 20,
    dockMarginTop: "auto",
  },

  comfortable: {
    maxWidth: 1800,
    paddingInline: 24,
    paddingBottom: 32,
    sectionGap: 24,
    dockMarginTop: "auto",
  },

  expanded: {
    maxWidth: 2200,
    paddingInline: 32,
    paddingBottom: 40,
    sectionGap: 28,
    dockMarginTop: "auto",
  },
};