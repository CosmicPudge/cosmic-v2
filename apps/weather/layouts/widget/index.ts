import type { ComponentType } from "react";

import type {
  CosmicAppProps,
  WidgetSize,
} from "@/apps/core";

import OneByOne from "./1x1";
import TwoByOne from "./2x1";
import ThreeByOne from "./3x1";
import FourByOne from "./4x1";

import OneByTwo from "./1x2";
import TwoByTwo from "./2x2";
import ThreeByTwo from "./3x2";
import FourByTwo from "./4x2";

export const WEATHER_WIDGET_LAYOUTS: Record<
  WidgetSize,
  ComponentType<CosmicAppProps>
> = {
  "1x1": OneByOne,
  "2x1": TwoByOne,
  "3x1": ThreeByOne,
  "4x1": FourByOne,

  "1x2": OneByTwo,
  "2x2": TwoByTwo,
  "3x2": ThreeByTwo,
  "4x2": FourByTwo,
};