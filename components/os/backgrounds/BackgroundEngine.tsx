"use client";

import type { BackgroundEngineProps } from "./types";

import DashboardScene from "./scenes/DashboardScene";
import WeatherScene from "./scenes/WeatherScene";
import SportsScene from "./scenes/SportsScene";
import GarageScene from "./scenes/GarageScene";
import CalendarScene from "./scenes/CalendarScene";
import AssistantScene from "./scenes/AssistantScene";
import SchoolScene from "./scenes/SchoolScene";
import DefaultScene from "./scenes/DefaultScene";
import { useEntitlements } from "@/hooks/os/useEntitlements";

const sceneMap = {
  dashboard: DashboardScene,
  weather: WeatherScene,
  sports: SportsScene,
  garage: GarageScene,
  calendar: CalendarScene,
  assistant: AssistantScene,
  school: SchoolScene,

  music: DefaultScene,
  notes: DefaultScene,
  search: DefaultScene,
  system: DefaultScene,
  outlook: DefaultScene,
};

export default function BackgroundEngine({
  app,
  context,
}: BackgroundEngineProps) {
  const { data: entitlements } = useEntitlements();
  const Scene = app === "school" && !entitlements.features["school.basic"] ? DefaultScene : sceneMap[app] ?? DefaultScene;

  return <Scene context={context as never} />;
}
