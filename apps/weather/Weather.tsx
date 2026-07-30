"use client";

import { AppShell } from "@/apps/core/AppShell";

import type { CosmicAppProps } from "@/apps/core";

import { WeatherProvider } from "./context";
import { WEATHER_WIDGET_LAYOUTS } from "./layouts/widget";

import TwoByTwo from "./layouts/widget/2x2";

export default function Weather({
  presentation,
  widgetSize,
  footprint,
}: CosmicAppProps) {
  const WidgetLayout =
    WEATHER_WIDGET_LAYOUTS[widgetSize] ?? TwoByTwo;

  return (
    <WeatherProvider>
      <AppShell presentation={presentation}>
        <WidgetLayout
          presentation={presentation}
          widgetSize={widgetSize}
          footprint={footprint}
        />
      </AppShell>
    </WeatherProvider>
  );
}
