import type { ComponentType } from "react";

import ClockWidget from "@/components/os/widgets/clock/ClockWidget";
import WeatherWidget from "@/components/os/widgets/weather/WeatherWidget";
import CalendarWidget from "@/components/os/widgets/calendar/CalendarWidget";
import NotificationsWidget from "@/components/os/widgets/notifications/NotificationsWidget";
import CosmicWidget from "@/components/os/widgets/cosmic/CosmicWidget";
import BriefingWidget from "@/components/os/widgets/briefing/BriefingWidget";
import SearchWidget from "@/components/os/widgets/search/SearchWidget";
import SystemWidget from "@/components/os/widgets/system/SystemWidget";
import SportsWidget from "@/components/os/widgets/sports/SportsWidget";
import GarageWidget from "@/components/os/widgets/garage/GarageWidget";
import SchoolWidget from "@/components/os/widgets/school/SchoolWidget";
import ProjectsWidget from "@/components/os/widgets/projects/ProjectsWidget";
import NotesWidget from "@/components/os/widgets/notes/NotesWidget";
import OutlookWidget from "@/components/os/widgets/outlook/OutlookWidget";
import MusicWidget from "@/components/os/widgets/music/MusicWidget";

export interface WidgetSize {
  cols: number;
  rows: number;
}

export interface DashboardWidget {
  id: string;
  component: ComponentType;

  cols: number;
  rows: number;

  minCols?: number;
  minRows?: number;

  maxCols?: number;
  maxRows?: number;

  supportedSizes?: WidgetSize[];

  priority: number;

  movable: boolean;
  resizable: boolean;
}

export const dashboardWidgets: DashboardWidget[] = [
  {
    id: "clock",
    component: ClockWidget,
    cols: 2,
    rows: 1,
    supportedSizes: [
      { cols: 2, rows: 1 },
      { cols: 2, rows: 2 },
    ],
    priority: 1,
    movable: true,
    resizable: true,
  },
  {
    id: "weather",
    component: WeatherWidget,
    cols: 3,
    rows: 2,
    supportedSizes: [
      { cols: 2, rows: 1 },
      { cols: 3, rows: 2 },
      { cols: 6, rows: 2 },
    ],
    priority: 2,
    movable: true,
    resizable: true,
  },
  {
    id: "calendar",
    component: CalendarWidget,
    cols: 3,
    rows: 2,
    priority: 3,
    movable: true,
    resizable: true,
  },
  {
    id: "notifications",
    component: NotificationsWidget,
    cols: 3,
    rows: 2,
    priority: 4,
    movable: true,
    resizable: true,
  },
  {
    id: "cosmic",
    component: CosmicWidget,
    cols: 6,
    rows: 2,
    supportedSizes: [
      { cols: 6, rows: 2 },
      { cols: 6, rows: 4 },
      { cols: 12, rows: 4 },
    ],
    priority: 5,
    movable: true,
    resizable: true,
  },
  {
    id: "briefing",
    component: BriefingWidget,
    cols: 6,
    rows: 2,
    priority: 6,
    movable: true,
    resizable: true,
  },
  {
    id: "search",
    component: SearchWidget,
    cols: 6,
    rows: 2,
    priority: 7,
    movable: true,
    resizable: true,
  },
  {
    id: "system",
    component: SystemWidget,
    cols: 3,
    rows: 2,
    priority: 8,
    movable: true,
    resizable: true,
  },
  {
    id: "sports",
    component: SportsWidget,
    cols: 6,
    rows: 2,
    priority: 9,
    movable: true,
    resizable: true,
  },
  {
    id: "garage",
    component: GarageWidget,
    cols: 6,
    rows: 2,
    priority: 10,
    movable: true,
    resizable: true,
  },
  {
    id: "school",
    component: SchoolWidget,
    cols: 3,
    rows: 2,
    priority: 11,
    movable: true,
    resizable: true,
  },
  {
    id: "projects",
    component: ProjectsWidget,
    cols: 3,
    rows: 2,
    priority: 12,
    movable: true,
    resizable: true,
  },
  {
    id: "notes",
    component: NotesWidget,
    cols: 3,
    rows: 2,
    priority: 13,
    movable: true,
    resizable: true,
  },
  {
    id: "outlook",
    component: OutlookWidget,
    cols: 6,
    rows: 2,
    priority: 14,
    movable: true,
    resizable: true,
  },
  {
    id: "music",
    component: MusicWidget,
    cols: 6,
    rows: 2,
    priority: 15,
    movable: true,
    resizable: true,
  },
];