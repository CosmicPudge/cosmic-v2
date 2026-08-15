"use client";

import WeatherWindow from "./apps/WeatherWindow";
import CalendarWindow from "./apps/CalendarWindow";
import FilesWindow from "./apps/FilesWindow";
import GarageWindow from "./apps/GarageWindow";
import AssistantWindow from "./apps/AssistantWindow";
import MusicWindow from "./apps/MusicWindow";
import ClockWindow from "./apps/ClockWindow";
import SettingsWindow from "./apps/SettingsWindow";
import SystemWindow from "./apps/SystemWindow";

interface Props {
  id: string;
}

export default function WindowRegistry({
  id,
}: Props) {
  switch (id) {
    case "clock":
      return <ClockWindow />;

    case "weather":
      return <WeatherWindow />;

    case "calendar":
      return <CalendarWindow />;

    case "files":
      return <FilesWindow />;

    case "garage":
      return <GarageWindow />;

    case "assistant":
      return <AssistantWindow />;

    case "music":
      return <MusicWindow />;

    case "settings":
      return <SettingsWindow />;

    case "system":
      return <SystemWindow />;

    default:
      return (
        <div className="flex h-full items-center justify-center text-white/40">
          Unknown application
        </div>
      );
  }
}
