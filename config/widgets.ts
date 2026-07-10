import ClockWidget from "@/components/os/widgets/ClockWidget";
import WeatherWidget from "@/components/os/widgets/WeatherWidget";
import CalendarWidget from "@/components/os/widgets/CalendarWidget";
import NotificationsWidget from "@/components/os/widgets/NotificationsWidget";
import AssistantWidget from "@/components/os/widgets/CosmicWidget";
import BriefingWidget from "@/components/os/widgets/BriefingWidget";
import SearchWidget from "@/components/os/widgets/SearchWidget";
import SystemWidget from "@/components/os/widgets/SystemWidget";
import SportsWidget from "@/components/os/widgets/SportsWidget";
import GarageWidget from "@/components/os/widgets/GarageWidget";
import SchoolWidget from "@/components/os/widgets/SchoolWidget";
import ProjectsWidget from "@/components/os/widgets/ProjectsWidget";
import NotesWidget from "@/components/os/widgets/NotesWidget";
import OutlookWidget from "@/components/os/widgets/OutlookWidget";
import MusicWidget from "@/components/os/widgets/MusicWidget";

export interface DashboardWidget {
  id: string;
  component: React.ComponentType;
  span: string;
}

export const dashboardWidgets: DashboardWidget[] = [
  { id: "clock", component: ClockWidget, span: "col-span-3" },
  { id: "weather", component: WeatherWidget, span: "col-span-3" },
  { id: "calendar", component: CalendarWidget, span: "col-span-3" },
  { id: "notifications", component: NotificationsWidget, span: "col-span-3" },

  { id: "assistant", component: AssistantWidget, span: "col-span-4" },
  { id: "briefing", component: BriefingWidget, span: "col-span-4" },
  { id: "search", component: SearchWidget, span: "col-span-4" },

  { id: "system", component: SystemWidget, span: "col-span-4" },

  { id: "sports", component: SportsWidget, span: "col-span-6" },
  { id: "garage", component: GarageWidget, span: "col-span-6" },

  { id: "school", component: SchoolWidget, span: "col-span-4" },
  { id: "projects", component: ProjectsWidget, span: "col-span-4" },
  { id: "notes", component: NotesWidget, span: "col-span-4" },

  { id: "outlook", component: OutlookWidget, span: "col-span-6" },
  { id: "music", component: MusicWidget, span: "col-span-6" },
];