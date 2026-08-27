"use client";

import { createContext, useContext } from "react";
import type { WidgetSize } from "./types";
import type { WidgetAccent } from "./types";

export type WidgetPresentation = "dashboard" | "kiosk";

const WidgetContext = createContext<{ size: WidgetSize; accent?: WidgetAccent; presentation: WidgetPresentation; active: boolean }>({
  size: "medium",
  presentation: "dashboard",
  active: true,
});

export function WidgetProvider({ children, size, accent, presentation = "dashboard", active = true }: { children: React.ReactNode; size: WidgetSize; accent?: WidgetAccent; presentation?: WidgetPresentation; active?: boolean }) {
  return <WidgetContext.Provider value={{ size, accent, presentation, active }}>{children}</WidgetContext.Provider>;
}

export function useWidgetContext() {
  return useContext(WidgetContext);
}
