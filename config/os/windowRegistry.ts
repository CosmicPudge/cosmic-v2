import React from "react";
import AssistantWindow from "@/components/os/windows/AssistantWindow";
import CalendarWindow from "@/components/os/windows/CalendarWindow";
import FilesWindow from "@/components/os/windows/FilesWindow";
import GarageWindow from "@/components/os/windows/GarageWindow";
import MusicWindow from "@/components/os/windows/MusicWindow";
import NotesWindow from "@/components/os/windows/NotesWindow";
import OutlookWindow from "@/components/os/windows/OutlookWindow";
import ProjectsWindow from "@/components/os/windows/ProjectsWindow";
import SchoolWindow from "@/components/os/windows/SchoolWindow";
import SettingsWindow from "@/components/os/windows/SettingsWindow";
import SportsWindow from "@/components/os/windows/SportsWindow";
import WeatherWindow from "@/components/os/windows/WeatherWindow";

import { WindowId } from "@/stores/windowStore";

export const windowRegistry: Record<WindowId, React.ComponentType> = {
  weather: WeatherWindow,
  calendar: CalendarWindow,
  garage: GarageWindow,
  sports: SportsWindow,
  school: SchoolWindow,
  notes: NotesWindow,
  projects: ProjectsWindow,
  outlook: OutlookWindow,
  assistant: AssistantWindow,
  settings: SettingsWindow,
  music: MusicWindow,
  files: FilesWindow,
};