"use client";

import type {
  WidgetSize,
} from "../types";

import type {
  AppRendererProps,
} from "./types";

export default function AppRenderer({
  app,
  presentation,
  footprint = { cols: 2, rows: 2 },
}: AppRendererProps) {
  const widgetSize =
    `${footprint.cols}x${footprint.rows}` as WidgetSize;

  switch (presentation) {
    case "widget":
      return (
        <app.widget
          presentation={presentation}
          footprint={footprint}
          widgetSize={widgetSize}
        />
      );

    case "window":
      return (
        <app.window
          presentation={presentation}
          footprint={footprint}
          widgetSize={widgetSize}
        />
      );

    case "fullscreen":
      return (
        <app.fullscreen
          presentation={presentation}
          footprint={footprint}
          widgetSize={widgetSize}
        />
      );

    default:
      return null;
  }
}
