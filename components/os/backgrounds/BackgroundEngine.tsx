"use client";

import { BackgroundEngineProps, BackgroundApp } from "./types";

import DashboardScene from "./scenes/DashboardScene";
import WeatherScene from "./scenes/WeatherScene";
import SportsScene from "./scenes/SportsScene";
import GarageScene from "./scenes/GarageScene";
import CalendarScene from "./scenes/CalendarScene";
import AssistantScene from "./scenes/AssistantScene";
import SchoolScene from "./scenes/SchoolScene";
import DefaultScene from "./scenes/DefaultScene";

import { ComponentType } from "react";

const sceneMap: Record<
  BackgroundApp,
  ComponentType<{ context?: unknown }>
> = {
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
  const Scene =
    sceneMap[app] ?? DefaultScene;
    <BackgroundEngine app="weather" />

  return <Scene context={context} />;
}